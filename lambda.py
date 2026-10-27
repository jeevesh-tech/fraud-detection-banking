import json
import boto3
import random
import string
from datetime import datetime, timedelta
import urllib.request
import base64

# ================================
# AWS CLIENTS
# ================================
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
ses = boto3.client('ses', region_name='us-east-1')
sm_runtime = boto3.client('sagemaker-runtime')

# ================================
# CONFIG
# ================================
BUCKET = "fraud-detection-jeevu"

TABLE = "FraudTransactionsNew"

COUNTER_TABLE = "FraudCounters"

OTP_TABLE = "FraudOTPStore"

SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:696616820896:FraudAlertsNew"

SM_ENDPOINT = "fraud-detection-endpoint"

ADMIN_EMAIL = "taankjeevesh@gmail.com"

# ================================
# JIRA CONFIG
# ================================
JIRA_EMAIL = "taankjeevesh@gmail.com"

JIRA_API_TOKEN = "ATATT3xFfGF0bDGiDIDprPLawlTru8krhICJGo6vsTh6pgqwJMV5ihhL8ejOjHJQq3o_KUTeoB_huuqXC4o5b628_RkjsCW3cx9Vjj690C4C_qz3Rplu-nfUO7sPyt_uVSWjwDf6cA1F24emPc8XbA3AMnUQjJvN28ZRkjeT6bU2MZ4gMNKnYWY=63BF5523"

JIRA_DOMAIN = "jeevesh-taank.atlassian.net"

PROJECT_KEY = "SUP"

# ================================
# FRAUD RULES
# ================================
HIGH_AMOUNT_THRESHOLD = 500000

SUSPICIOUS_HOURS = list(range(0, 6))

# ================================
# TRANSACTION ID
# ================================
def get_next_transaction_id():

    table = dynamodb.Table(COUNTER_TABLE)

    try:

        res = table.update_item(
            Key={'counter_name': 'transaction_id'},

            UpdateExpression='SET current_value = if_not_exists(current_value, :start) + :inc',

            ExpressionAttributeValues={
                ':inc': 1,
                ':start': 0
            },

            ReturnValues='UPDATED_NEW'
        )

        return f"TXN-{int(res['Attributes']['current_value']):06d}"

    except Exception as e:

        print("Counter Error:", e)

        return f"TXN-{int(datetime.now().timestamp())}"

# ================================
# LOCATION ENCODING
# ================================
def encode_location(location):

    location = location.lower().strip()

    indian_places = ["india", "mumbai", "bengaluru","andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka", "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal", "andaman and nicobar islands", "chandigarh", "dadra and nagar haveli and daman and diu", "delhi", "jammu and kashmir", "ladakh", "lakshadweep", "puducherry", "mumbai", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata", "pune", "ahmedabad", "jaipur", "lucknow", "kanpur", "nagpur", "indore", "bhopal", "patna", "surat", "visakhapatnam", "kochi", "thiruvananthapuram", "coimbatore", "vadodara", "ludhiana", "agra", "nashik", "faridabad", "meerut", "rajkot", "varanasi", "amritsar", "allahabad", "prayagraj", "ranchi", "raipur", "noida", "gurgaon", "gurugram", "guwahati", "shimla", "dehradun", "jodhpur", "udaipur", "mysore", "madurai", "vijayawada", "tirupati", "warangal", "srinagar"]

    if location in indian_places:
        return 0

    elif location in ["unknown", "", "null"]:
        return 1

    else:
        return 2

# ================================
# ML PREDICTION
# ================================
def predict_fraud(amount, location):

    try:

        loc = encode_location(location)

        hour = datetime.now().hour

        payload = f"{amount},{loc},{hour}"

        response = sm_runtime.invoke_endpoint(
            EndpointName=SM_ENDPOINT,
            ContentType='text/csv',
            Body=payload
        )

        result = response['Body'].read().decode().strip()

        score = float(result.split(',')[0])

        return score > 0.5, score

    except Exception as e:

        print("SageMaker Error:", e)

        return False, 0.0

# ================================
# MULTI CRITERIA ENGINE
# ================================
def evaluate_risk(amount, location, score):

    triggered = []

    hour = datetime.now().hour

    # CRITERION 1
    if amount > HIGH_AMOUNT_THRESHOLD:

        triggered.append(
            f"High transaction amount (₹{amount:,.0f})"
        )

    # CRITERION 2
    if score > 0.5:

        triggered.append(
            f"ML model flagged suspicious (score: {round(score, 3)})"
        )

    # CRITERION 3
    if encode_location(location) != 0:

        triggered.append(
            "Unknown or foreign location detected"
        )

    # CRITERION 4
    if hour in SUSPICIOUS_HOURS:

        triggered.append(
            f"Transaction during unusual hours ({hour}:00)"
        )

    count = len(triggered)

    if count == 0:
        return "SAFE", triggered

    elif count <= 2:
        return "RISKY", triggered

    else:
        return "FRAUD", triggered

# ================================
# GENERATE OTP
# ================================
def generate_otp(length=6):

    return ''.join(
        random.choices(string.digits, k=length)
    )

# ================================
# STORE OTP IN DYNAMODB
# ================================
def store_otp(transaction_id, otp):

    table = dynamodb.Table(OTP_TABLE)

    # 40 SECOND EXPIRY
    expires_at = int(
        (datetime.now() + timedelta(seconds=40)).timestamp()
    )

    table.put_item(
        Item={
            'transaction_id': transaction_id,
            'otp': otp,
            'expires_at': expires_at,
            'verified': False
        }
    )

# ================================
# SEND OTP EMAIL
# ================================
def send_otp_email(user_email, transaction_id, otp):

    subject = f"OTP Verification - {transaction_id}"

    body_html = f"""
    <html>
    <body style="font-family: Arial;">

        <h2>Fraud Detection System</h2>

        <p>
            Your transaction requires OTP verification.
        </p>

        <p>
            <b>Transaction ID:</b> {transaction_id}
        </p>

        <h1 style="letter-spacing: 8px;">
            {otp}
        </h1>

        <p>
            OTP valid for 40 seconds.
        </p>

    </body>
    </html>
    """

    ses.send_email(

        Source=ADMIN_EMAIL,

        Destination={
            'ToAddresses': [user_email]
        },

        Message={
            'Subject': {
                'Data': subject
            },

            'Body': {
                'Html': {
                    'Data': body_html
                }
            }
        }
    )

# ================================
# CREATE JIRA TICKET
# ================================
def create_jira_ticket(data, reasons):

    try:

        url = f"https://{JIRA_DOMAIN}/rest/api/3/issue"

        auth = base64.b64encode(
            f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()
        ).decode()

        reason_items = [

            {
                "type": "listItem",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": r
                            }
                        ]
                    }
                ]
            }

            for r in reasons
        ]

        payload = json.dumps({

            "fields": {

                "project": {
                    "key": PROJECT_KEY
                },

                "summary": f"🚨 Fraud Alert: {data['transaction_id']}",

                "description": {

                    "type": "doc",

                    "version": 1,

                    "content": [

                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Fraud detected in transaction"
                                }
                            ]
                        },

                        {
                            "type": "bulletList",

                            "content": [

                                {
                                    "type": "listItem",

                                    "content": [
                                        {
                                            "type": "paragraph",

                                            "content": [
                                                {
                                                    "type": "text",
                                                    "text": f"Transaction ID: {data['transaction_id']}"
                                                }
                                            ]
                                        }
                                    ]
                                },

                                {
                                    "type": "listItem",

                                    "content": [
                                        {
                                            "type": "paragraph",

                                            "content": [
                                                {
                                                    "type": "text",
                                                    "text": f"Amount: ₹{data['amount']}"
                                                }
                                            ]
                                        }
                                    ]
                                },

                                {
                                    "type": "listItem",

                                    "content": [
                                        {
                                            "type": "paragraph",

                                            "content": [
                                                {
                                                    "type": "text",
                                                    "text": f"Location: {data['location']}"
                                                }
                                            ]
                                        }
                                    ]
                                }

                            ]
                        },

                        {
                            "type": "paragraph",

                            "content": [
                                {
                                    "type": "text",
                                    "text": "Fraud Triggers"
                                }
                            ]
                        },

                        {
                            "type": "bulletList",
                            "content": reason_items
                        }

                    ]
                },

                "issuetype": {
                    "name": "Task"
                }

            }

        }).encode("utf-8")

        req = urllib.request.Request(

            url,

            data=payload,

            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/json"
            },

            method="POST"
        )

        with urllib.request.urlopen(req) as res:

            result = json.loads(
                res.read().decode()
            )

            jira_key = result.get("key")

            print("Jira Ticket Created:", jira_key)

            return jira_key

    except Exception as e:

        print("Jira Error:", str(e))

        return None

# ================================
# HANDLE TRANSACTION
# ================================
def handle_transaction(body):

    user_id = body.get('user_id', '')

    user_email = body.get('user_email', '')

    amount = float(body.get('amount', 0))

    location = body.get('location', '')

    txn_id = get_next_transaction_id()

    timestamp = datetime.now().isoformat()

    # STORE IN S3
    s3.put_object(
        Bucket=BUCKET,
        Key=f"transactions/{txn_id}.json",
        Body=json.dumps(body)
    )

    # ML PREDICTION
    _, score = predict_fraud(amount, location)

    # RISK ENGINE
    risk_level, reasons = evaluate_risk(
        amount,
        location,
        score
    )

    # STORE IN DYNAMODB
    table = dynamodb.Table(TABLE)

    table.put_item(
        Item={
            "transaction_id": txn_id,
            "user_id": user_id,
            "user_email": user_email,
            "amount": str(amount),
            "location": location,
            "risk_level": risk_level,
            "risk_score": str(score),
            "reasons": json.dumps(reasons),
            "timestamp": timestamp,
            "status": "PENDING" if risk_level == "RISKY" else (
                "BLOCKED" if risk_level == "FRAUD" else "APPROVED"
            )
        }
    )

    # SAFE
    if risk_level == "SAFE":

        return {
            "statusCode": 200,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "transaction_id": txn_id,
                "status": "APPROVED",
                "risk_level": "SAFE",
                "risk_score": round(score, 3),
                "message": "Transaction Approved"
            })
        }

    # RISKY
    elif risk_level == "RISKY":

        otp = generate_otp()

        store_otp(txn_id, otp)

        send_otp_email(
            user_email,
            txn_id,
            otp
        )

        return {
            "statusCode": 200,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "transaction_id": txn_id,
                "status": "OTP_REQUIRED",
                "risk_level": "RISKY",
                "risk_score": round(score, 3),
                "reasons": reasons,
                "message": "OTP sent to your email"
            })
        }

    # FRAUD
    else:

        jira_key = None

        try:

            jira_key = create_jira_ticket(

                {
                    "transaction_id": txn_id,
                    "amount": amount,
                    "location": location,
                    "user_id": user_id
                },

                reasons
            )

        except Exception as e:

            print("Jira Failed:", e)

        try:

            sns.publish(

                TopicArn=SNS_TOPIC_ARN,

                Subject="🚨 Fraud Alert",

                Message=f"""
Fraud detected!

Transaction ID: {txn_id}

Amount: ₹{amount}

Location: {location}

Reasons: {', '.join(reasons)}
"""
            )

        except Exception as e:

            print("SNS Failed:", e)

        return {
            "statusCode": 200,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "transaction_id": txn_id,
                "status": "BLOCKED",
                "risk_level": "FRAUD",
                "risk_score": round(score, 3),
                "reasons": reasons,
                "jira_ticket": jira_key,
                "message": "Transaction blocked"
            })
        }

# ================================
# VERIFY OTP
# ================================
def handle_verify_otp(body):

    transaction_id = body.get('transaction_id', '')

    entered_otp = body.get('otp', '').strip()

    otp_table = dynamodb.Table(OTP_TABLE)

    res = otp_table.get_item(
        Key={'transaction_id': transaction_id}
    )

    item = res.get('Item')

    # OTP NOT FOUND
    if not item:

        return {
            "statusCode": 404,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "error": "OTP not found"
            })
        }

    # OTP EXPIRED
    if int(datetime.now().timestamp()) > int(item.get('expires_at', 0)):

        return {
            "statusCode": 400,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "status": "OTP_EXPIRED",
                "message": "OTP expired"
            })
        }

    # OTP ALREADY USED
    if item.get('verified'):

        return {
            "statusCode": 400,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "status": "OTP_ALREADY_USED"
            })
        }

    # WRONG OTP
    if entered_otp != item.get('otp'):

        txn_table = dynamodb.Table(TABLE)

        txn = txn_table.get_item(
            Key={'transaction_id': transaction_id}
        ).get('Item', {})

        amount = float(txn.get('amount', 0))

        location = txn.get('location', '')

        user_id = txn.get('user_id', '')

        reasons = json.loads(
            txn.get('reasons', '[]')
        )

        reasons.append(
            "Incorrect OTP entered"
        )

        txn_table.update_item(
            Key={'transaction_id': transaction_id},

            UpdateExpression='SET #s = :s',

            ExpressionAttributeNames={
                '#s': 'status'
            },

            ExpressionAttributeValues={
                ':s': 'BLOCKED'
            }
        )

        jira_key = create_jira_ticket(

            {
                "transaction_id": transaction_id,
                "amount": amount,
                "location": location,
                "user_id": user_id
            },

            reasons
        )

        try:

            sns.publish(

                TopicArn=SNS_TOPIC_ARN,

                Subject="🚨 Fraud Alert - OTP Failed",

                Message=f"""
OTP verification failed.

Transaction ID: {transaction_id}

Amount: ₹{amount}

Location: {location}
"""
            )

        except Exception as e:

            print("SNS Failed:", e)

        return {
            "statusCode": 200,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "status": "BLOCKED",
                "transaction_id": transaction_id,
                "jira_ticket": jira_key,
                "message": "Incorrect OTP - transaction blocked"
            })
        }

    # CORRECT OTP
    else:

        otp_table.update_item(

            Key={'transaction_id': transaction_id},

            UpdateExpression='SET verified = :v',

            ExpressionAttributeValues={
                ':v': True
            }
        )

        dynamodb.Table(TABLE).update_item(

            Key={'transaction_id': transaction_id},

            UpdateExpression='SET #s = :s',

            ExpressionAttributeNames={
                '#s': 'status'
            },

            ExpressionAttributeValues={
                ':s': 'APPROVED'
            }
        )

        return {
            "statusCode": 200,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "status": "APPROVED",
                "transaction_id": transaction_id,
                "message": "OTP verified successfully"
            })
        }

# ================================
# MAIN LAMBDA HANDLER
# ================================
def lambda_handler(event, context):

    try:

        path = event.get('path', '') or event.get('rawPath', '')

        body = json.loads(
            event.get('body', '{}') or '{}'
        )

        # OTP ROUTE
        if '/verify-otp' in path:

            return handle_verify_otp(body)

        # MAIN ROUTE
        else:

            return handle_transaction(body)

    except Exception as e:

        print("ERROR:", str(e))

        return {
            "statusCode": 500,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },

            "body": json.dumps({
                "error": str(e)
            })
        }
