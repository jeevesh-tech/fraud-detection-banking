import React, { useState } from "react";

const API_BASE =
  "https://7uw5orux48.execute-api.us-east-1.amazonaws.com";

const SUBMIT_URL = `${API_BASE}/upload`;

const VERIFY_OTP_URL = `${API_BASE}/verify-otp`;

export default function App() {

  const [form, setForm] = useState({
    user_id: "",
    location: "",
    amount: "",
    user_email: ""
  });

  const [status, setStatus] = useState(null);

  const [otp, setOtp] = useState("");

  const [transactionId, setTransactionId] = useState("");

  const [loading, setLoading] = useState(false);

  // ================================
  // HANDLE FORM CHANGE
  // ================================
  const handleChange = (e) => {

    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value
    }));
  };

  // ================================
  // SUBMIT TRANSACTION
  // ================================
  const handleSubmit = async () => {

    if (
      !form.user_id ||
      !form.location ||
      !form.amount ||
      !form.user_email
    ) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch(SUBMIT_URL, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          user_id: form.user_id,
          user_email: form.user_email,
          amount: form.amount,
          location: form.location
        })
      });

      const json = await res.json();

      console.log(json);

      // ================================
      // OTP REQUIRED
      // ================================
      if (json.status === "OTP_REQUIRED") {

        setTransactionId(json.transaction_id);

        setStatus({
          type: "otp",
          transaction_id: json.transaction_id,
          risk_score: json.risk_score,
          reasons: json.reasons
        });

      }

      // ================================
      // APPROVED
      // ================================
      else if (json.status === "APPROVED") {

        setStatus({
          type: "approved",
          transaction_id: json.transaction_id,
          risk_score: json.risk_score
        });
      }

      // ================================
      // BLOCKED
      // ================================
      else if (json.status === "BLOCKED") {

        setStatus({
          type: "blocked",
          transaction_id: json.transaction_id,
          risk_score: json.risk_score,
          reasons: json.reasons,
          jira_ticket: json.jira_ticket
        });
      }

      setForm({
        user_id: "",
        location: "",
        amount: "",
        user_email: ""
      });

    } catch (err) {

      console.error(err);

      setStatus({
        type: "error"
      });
    }

    setLoading(false);
  };

  // ================================
  // VERIFY OTP
  // ================================
  const verifyOtp = async () => {

    if (!otp) {
      alert("Enter OTP");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch(VERIFY_OTP_URL, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          transaction_id: transactionId,
          otp: otp
        })
      });

      const json = await res.json();

      console.log(json);

      // ================================
      // APPROVED
      // ================================
      if (json.status === "APPROVED") {

        setStatus({
          type: "approved",
          transaction_id: json.transaction_id
        });
      }

      // ================================
      // OTP EXPIRED
      // ================================
      else if (json.status === "OTP_EXPIRED") {

        setStatus({
          type: "expired"
        });
      }

      // ================================
      // BLOCKED
      // ================================
      else if (json.status === "BLOCKED") {

        setStatus({
          type: "blocked",
          transaction_id: json.transaction_id,
          jira_ticket: json.jira_ticket
        });
      }

    } catch (err) {

      console.error(err);

      setStatus({
        type: "error"
      });
    }

    setLoading(false);
  };

  return (

    <div style={styles.page}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          🏦 Fraud Detection System
        </h1>

        <p style={styles.sub}>
          AI Powered Banking Fraud Prevention
        </p>

        {/* ================================ */}
        {/* FORM */}
        {/* ================================ */}

        {["user_id", "user_email", "amount", "location"].map((field) => (

          <div key={field} style={styles.fieldRow}>

            <label style={styles.label}>

              {field === "user_id"
                ? "User ID"
                : field === "user_email"
                ? "Email"
                : field === "amount"
                ? "Amount (₹)"
                : "Location"}

            </label>

            <input

              name={field}

              value={form[field]}

              onChange={handleChange}

              placeholder={
                field === "user_id"
                  ? "e.g. USR001"
                  : field === "user_email"
                  ? "e.g. user@gmail.com"
                  : field === "amount"
                  ? "e.g. 500000"
                  : "e.g. Mumbai"
              }

              style={styles.input}

              type={field === "amount" ? "number" : "text"}
            />

          </div>
        ))}

        <button

          onClick={handleSubmit}

          style={styles.btn}

          disabled={loading}

        >
          {loading ? "Processing..." : "Submit Transaction"}
        </button>

        {/* ================================ */}
        {/* OTP BOX */}
        {/* ================================ */}

        {status?.type === "otp" && (

          <div style={styles.otpBox}>

            <h2>🔐 OTP Verification Required</h2>

            <p>
              OTP sent to your email.
            </p>

            <p>
              Transaction ID:
              <b> {status.transaction_id}</b>
            </p>

            <div style={{ marginTop: 10 }}>

              <input

                type="text"

                placeholder="Enter OTP"

                value={otp}

                onChange={(e) => setOtp(e.target.value)}

                style={styles.otpInput}
              />

            </div>

            <button
              onClick={verifyOtp}
              style={styles.verifyBtn}
            >
              Verify OTP
            </button>

          </div>
        )}

        {/* ================================ */}
        {/* APPROVED */}
        {/* ================================ */}

        {status?.type === "approved" && (

          <div style={styles.success}>

            <h2>
              ✅ Transaction Approved
            </h2>

            <p>
              Transaction ID:
              <b> {status.transaction_id}</b>
            </p>

          </div>
        )}

        {/* ================================ */}
        {/* BLOCKED */}
        {/* ================================ */}

        {status?.type === "blocked" && (

          <div style={styles.blocked}>

            <h2>
              🚨 Transaction Blocked
            </h2>

            <p>
              Transaction ID:
              <b> {status.transaction_id}</b>
            </p>

            {status.jira_ticket && (

              <p>

                🎫 Jira Ticket:
                <b> {status.jira_ticket}</b>

              </p>
            )}

          </div>
        )}

        {/* ================================ */}
        {/* EXPIRED */}
        {/* ================================ */}

        {status?.type === "expired" && (

          <div style={styles.expired}>

            <h2>
              ⌛ OTP Expired
            </h2>

            <p>
              Please retry transaction.
            </p>

          </div>
        )}

        {/* ================================ */}
        {/* ERROR */}
        {/* ================================ */}

        {status?.type === "error" && (

          <div style={styles.error}>

            <h2>
              ❌ Something went wrong
            </h2>

          </div>
        )}

      </div>

    </div>
  );
}

const styles = {

  page: {

    minHeight: "100vh",

    background: "#eef2ff",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: 20
  },

  card: {

    background: "#fff",

    borderRadius: 18,

    padding: 40,

    width: "100%",

    maxWidth: 650,

    boxShadow: "0 6px 24px rgba(0,0,0,0.1)"
  },

  title: {

    textAlign: "center",

    margin: 0,

    fontSize: 30
  },

  sub: {

    textAlign: "center",

    color: "#666",

    marginBottom: 28
  },

  fieldRow: {

    marginBottom: 16
  },

  label: {

    display: "block",

    marginBottom: 7,

    fontWeight: 600
  },

  input: {

    width: "100%",

    padding: "12px 14px",

    borderRadius: 10,

    border: "1px solid #ccc",

    fontSize: 15,

    boxSizing: "border-box"
  },

  btn: {

    width: "100%",

    padding: "14px",

    borderRadius: 10,

    border: "none",

    background: "#4f46e5",

    color: "#fff",

    fontSize: 16,

    fontWeight: 700,

    cursor: "pointer",

    marginTop: 10
  },

  otpBox: {

    marginTop: 25,

    padding: 20,

    borderRadius: 12,

    background: "#fff7ed",

    border: "2px solid orange",

    textAlign: "center"
  },

  otpInput: {

    width: "100%",

    padding: 12,

    borderRadius: 10,

    border: "1px solid #ccc",

    fontSize: 16
  },

  verifyBtn: {

    marginTop: 15,

    width: "100%",

    padding: 12,

    background: "#ea580c",

    color: "#fff",

    border: "none",

    borderRadius: 10,

    fontWeight: 700,

    cursor: "pointer"
  },

  success: {

    marginTop: 25,

    padding: 20,

    borderRadius: 12,

    background: "#f0fff4",

    border: "2px solid #38a169",

    textAlign: "center"
  },

  blocked: {

    marginTop: 25,

    padding: 20,

    borderRadius: 12,

    background: "#fff5f5",

    border: "2px solid #e53e3e",

    textAlign: "center"
  },

  expired: {

    marginTop: 25,

    padding: 20,

    borderRadius: 12,

    background: "#fffbea",

    border: "2px solid #d69e2e",

    textAlign: "center"
  },

  error: {

    marginTop: 25,

    padding: 20,

    borderRadius: 12,

    background: "#fff5f5",

    border: "2px solid red",

    textAlign: "center"
  }
};