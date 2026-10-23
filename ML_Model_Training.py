import boto3
import sagemaker
from sagemaker import image_uris
from time import gmtime, strftime

# ================================
# CONFIG
# ================================
BUCKET = "fraud-detection-jeevu"
REGION = "us-east-1"

# SageMaker Role ARN
ROLE = "arn:aws:iam::696616820896:role/SageMakerFraudRole"

# ================================
# SESSION
# ================================
sm = boto3.client("sagemaker", region_name=REGION)
sess = sagemaker.Session()

# ================================
# XGBOOST IMAGE
# ================================
image_uri = image_uris.retrieve(
    framework='xgboost',
    region=REGION,
    version='1.5-1'
)

# ================================
# UNIQUE TRAINING JOB NAME
# ================================
job_name = "fraud-xgboost-" + strftime("%Y%m%d-%H%M%S", gmtime())

# ================================
# START TRAINING JOB
# ================================
sm.create_training_job(
    TrainingJobName=job_name,

    AlgorithmSpecification={
        'TrainingImage': image_uri,
        'TrainingInputMode': 'File'
    },

    RoleArn=ROLE,

    InputDataConfig=[
        {
            'ChannelName': 'train',
            'DataSource': {
                'S3DataSource': {
                    'S3DataType': 'S3Prefix',
                    'S3Uri': f's3://{BUCKET}/training/',
                    'S3DataDistributionType': 'FullyReplicated'
                }
            },
            'ContentType': 'text/csv'
        }
    ],

    OutputDataConfig={
        'S3OutputPath': f's3://{BUCKET}/output/'
    },

    ResourceConfig={
        'InstanceType': 'ml.m4.xlarge',
        'InstanceCount': 1,
        'VolumeSizeInGB': 5
    },

    HyperParameters={
        'objective': 'binary:logistic',
        'num_round': '100',
        'max_depth': '5',
        'eta': '0.2',
        'subsample': '0.8'
    },

    StoppingCondition={
        'MaxRuntimeInSeconds': 600
    }
)

print("Training started:", job_name)