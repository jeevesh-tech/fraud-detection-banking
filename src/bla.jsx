import React, { useState } from "react";

const API_BASE = "https://7uw5orux48.execute-api.us-east-1.amazonaws.com";
const SUBMIT_URL = `${API_BASE}/upload`;
const VERIFY_OTP_URL = `${API_BASE}/verify-otp`;

// ─── Icons ───────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0a0e1a;
    color: #e2e8f0;
    min-height: 100vh;
  }

  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 50% 30% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 50%),
      #0a0e1a;
  }

  .card {
    width: 100%;
    max-width: 560px;
    background: rgba(15,20,35,0.95);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 44px 40px;
    backdrop-filter: blur(20px);
    box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
    animation: fadeUp 0.4s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 6px;
  }

  .header-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 20px rgba(99,102,241,0.35);
  }

  .header-text h1 {
    font-size: 20px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px;
  }
  .header-text p { font-size: 13px; color: #64748b; margin-top: 2px; }

  .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }

  .field { margin-bottom: 18px; }
  .field label {
    display: block; font-size: 12px; font-weight: 600;
    color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;
    margin-bottom: 8px;
  }
  .field input {
    width: 100%; padding: 12px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    color: #f1f5f9; font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
  }
  .field input:focus {
    border-color: rgba(99,102,241,0.6);
    background: rgba(99,102,241,0.06);
  }
  .field input::placeholder { color: #475569; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .btn-primary {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    color: white; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    letter-spacing: 0.2px;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 8px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.3);
  }
  .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-secondary {
    background: transparent; border: 1px solid rgba(255,255,255,0.12);
    color: #94a3b8; border-radius: 10px; padding: 10px 20px;
    font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, color 0.2s;
  }
  .btn-secondary:hover { border-color: rgba(255,255,255,0.25); color: #e2e8f0; }

  /* ── Status Panels ── */
  .status-panel {
    margin-top: 28px;
    border-radius: 16px;
    padding: 28px;
    animation: fadeUp 0.35s ease both;
  }

  .status-panel.safe {
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.25);
  }
  .status-panel.risky {
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.25);
  }
  .status-panel.fraud {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
  }

  .status-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  }
  .status-icon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .status-icon.safe { background: rgba(16,185,129,0.15); color: #10b981; }
  .status-icon.risky { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .status-icon.fraud { background: rgba(239,68,68,0.15); color: #ef4444; }

  .status-title { font-size: 17px; font-weight: 700; }
  .status-title.safe { color: #10b981; }
  .status-title.risky { color: #f59e0b; }
  .status-title.fraud { color: #ef4444; }
  .status-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }

  .meta-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 14px;
  }
  .meta-row:last-child { border-bottom: none; }
  .meta-label { color: #64748b; }
  .meta-value { color: #e2e8f0; font-weight: 500; font-family: 'DM Mono', monospace; font-size: 13px; }

  .reasons-list { margin-top: 16px; }
  .reasons-list h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 10px; }
  .reason-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 12px; background: rgba(255,255,255,0.03);
    border-radius: 8px; margin-bottom: 6px; font-size: 13px; color: #cbd5e1;
  }
  .reason-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #f59e0b; margin-top: 5px; flex-shrink: 0;
  }
  .reason-dot.red { background: #ef4444; }

  .jira-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
    border-radius: 8px; padding: 8px 14px; margin-top: 14px;
    font-size: 13px; color: #818cf8; font-weight: 600;
    font-family: 'DM Mono', monospace;
  }

  /* ── OTP Section ── */
  .otp-section { margin-top: 24px; }
  .otp-label {
    font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 18px; line-height: 1.6;
  }
  .otp-inputs {
    display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;
  }
  .otp-inputs input {
    width: 50px; height: 58px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #f1f5f9; font-size: 22px; font-weight: 700;
    text-align: center; font-family: 'DM Mono', monospace;
    outline: none;
    transition: border-color 0.2s;
  }
  .otp-inputs input:focus {
    border-color: #f59e0b;
    background: rgba(245,158,11,0.08);
  }
  .otp-actions { display: flex; gap: 10px; }
  .otp-actions .btn-primary { margin-top: 0; flex: 1; }

  .spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-right: 8px; vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .score-bar-wrap { margin-top: 14px; }
  .score-bar-label { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 6px; }
  .score-bar-bg { height: 6px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
`;

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [form, setForm] = useState({ user_id: "", location: "", amount: "", user_email: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);   // transaction result
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [finalResult, setFinalResult] = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.user_id || !form.location || !form.amount || !form.user_email) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);
    setResult(null);
    setFinalResult(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");

    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: form.amount })
      });
      const data = await res.json();
      setResult({ ...data, amount: form.amount, user_email: form.user_email });
      setForm({ user_id: "", location: "", amount: "", user_email: "" });
    } catch (err) {
      console.error(err);
      setResult({ status: "ERROR" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    setOtpError("");
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch(VERIFY_OTP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: result.transaction_id, otp })
      });
      const data = await res.json();
      setFinalResult(data);
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setFinalResult(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
  };

  const scoreColor = (s) => {
    if (s < 0.4) return "#10b981";
    if (s < 0.7) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <>
      <style>{css}</style>
      <div className="page">
        <div className="card">
          {/* Header */}
          <div className="header">
            <div className="header-icon"><ShieldIcon /></div>
            <div className="header-text">
              <h1>Fraud Detection System</h1>
              <p>Secure transaction monitoring & risk analysis</p>
            </div>
          </div>

          <hr className="divider" />

          {/* Form */}
          <div className="grid-2">
            <div className="field">
              <label>User ID</label>
              <input name="user_id" value={form.user_id} onChange={handleChange} placeholder="e.g. USR001" />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input name="user_email" value={form.user_email} onChange={handleChange} placeholder="user@gmail.com" type="email" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Amount (₹)</label>
              <input name="amount" value={form.amount} onChange={handleChange} placeholder="e.g. 50000" type="number" />
            </div>
            <div className="field">
              <label>Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Mumbai" />
            </div>
          </div>

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" />Analysing Transaction...</> : "Submit Transaction"}
          </button>

          {/* ── RESULT: SAFE ── */}
          {result?.status === "APPROVED" && !finalResult && (
            <div className="status-panel safe">
              <div className="status-header">
                <div className="status-icon safe"><CheckIcon /></div>
                <div>
                  <div className="status-title safe">Transaction Approved</div>
                  <div className="status-subtitle">No fraud indicators detected</div>
                </div>
              </div>
              <div className="meta-row"><span className="meta-label">Transaction ID</span><span className="meta-value">{result.transaction_id}</span></div>
              <div className="meta-row"><span className="meta-label">Amount</span><span className="meta-value">₹{parseFloat(result.amount).toLocaleString('en-IN')}</span></div>
              <div className="meta-row"><span className="meta-label">Risk Score</span><span className="meta-value">{result.risk_score}</span></div>
              {result.risk_score !== undefined && (
                <div className="score-bar-wrap">
                  <div className="score-bar-label"><span>Risk Level</span><span>{(result.risk_score * 100).toFixed(1)}%</span></div>
                  <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${result.risk_score * 100}%`, background: scoreColor(result.risk_score) }} /></div>
                </div>
              )}
              <button className="btn-secondary" style={{ marginTop: 18, width: "100%" }} onClick={reset}>New Transaction</button>
            </div>
          )}

          {/* ── RESULT: RISKY → OTP ── */}
          {result?.status === "OTP_REQUIRED" && !finalResult && (
            <div className="status-panel risky">
              <div className="status-header">
                <div className="status-icon risky"><LockIcon /></div>
                <div>
                  <div className="status-title risky">Verification Required</div>
                  <div className="status-subtitle">Risky transaction — OTP sent to {result.user_email}</div>
                </div>
              </div>
              <div className="meta-row"><span className="meta-label">Transaction ID</span><span className="meta-value">{result.transaction_id}</span></div>
              <div className="meta-row"><span className="meta-label">Amount</span><span className="meta-value">₹{parseFloat(result.amount).toLocaleString('en-IN')}</span></div>
              <div className="meta-row"><span className="meta-label">Risk Score</span><span className="meta-value">{result.risk_score}</span></div>

              {result.reasons?.length > 0 && (
                <div className="reasons-list">
                  <h4>Risk Factors Detected</h4>
                  {result.reasons.map((r, i) => (
                    <div key={i} className="reason-item">
                      <div className="reason-dot" />
                      {r}
                    </div>
                  ))}
                </div>
              )}

              <div className="otp-section">
                <p className="otp-label">An OTP has been sent to your registered email address and the admin.<br />Please enter it below to authorise this transaction.</p>
                <div className="otp-inputs">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i} id={`otp-${i}`}
                      maxLength={1} value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                    />
                  ))}
                </div>
                {otpError && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 14 }}>{otpError}</p>}
                <div className="otp-actions">
                  <button className="btn-secondary" onClick={reset}>Cancel</button>
                  <button className="btn-primary" onClick={handleVerifyOtp} disabled={otpLoading}>
                    {otpLoading ? <><span className="spinner" />Verifying...</> : "Verify OTP"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── RESULT: FRAUD (immediate block) ── */}
          {result?.status === "BLOCKED" && !finalResult && (
            <div className="status-panel fraud">
              <div className="status-header">
                <div className="status-icon fraud"><AlertIcon /></div>
                <div>
                  <div className="status-title fraud">Transaction Blocked</div>
                  <div className="status-subtitle">Multiple fraud indicators detected</div>
                </div>
              </div>
              <div className="meta-row"><span className="meta-label">Transaction ID</span><span className="meta-value">{result.transaction_id}</span></div>
              <div className="meta-row"><span className="meta-label">Amount</span><span className="meta-value">₹{parseFloat(result.amount).toLocaleString('en-IN')}</span></div>
              <div className="meta-row"><span className="meta-label">Risk Score</span><span className="meta-value">{result.risk_score}</span></div>

              {result.reasons?.length > 0 && (
                <div className="reasons-list">
                  <h4>Fraud Triggers</h4>
                  {result.reasons.map((r, i) => (
                    <div key={i} className="reason-item">
                      <div className="reason-dot red" />
                      {r}
                    </div>
                  ))}
                </div>
              )}

              {result.jira_ticket && (
                <div className="jira-badge">🎫 Jira Ticket: {result.jira_ticket}</div>
              )}
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 14 }}>Admin and user have been notified via email.</p>
              <button className="btn-secondary" style={{ marginTop: 18, width: "100%" }} onClick={reset}>New Transaction</button>
            </div>
          )}

          {/* ── OTP VERIFIED → APPROVED ── */}
          {finalResult?.status === "APPROVED" && (
            <div className="status-panel safe">
              <div className="status-header">
                <div className="status-icon safe"><CheckIcon /></div>
                <div>
                  <div className="status-title safe">Transaction Approved</div>
                  <div className="status-subtitle">OTP verified successfully</div>
                </div>
              </div>
              <div className="meta-row"><span className="meta-label">Transaction ID</span><span className="meta-value">{finalResult.transaction_id}</span></div>
              <button className="btn-secondary" style={{ marginTop: 18, width: "100%" }} onClick={reset}>New Transaction</button>
            </div>
          )}

          {/* ── OTP FAILED → BLOCKED ── */}
          {finalResult?.status === "BLOCKED" && (
            <div className="status-panel fraud">
              <div className="status-header">
                <div className="status-icon fraud"><AlertIcon /></div>
                <div>
                  <div className="status-title fraud">Transaction Blocked</div>
                  <div className="status-subtitle">OTP verification failed — fraud reported</div>
                </div>
              </div>
              <div className="meta-row"><span className="meta-label">Transaction ID</span><span className="meta-value">{finalResult.transaction_id}</span></div>
              {finalResult.jira_ticket && (
                <div className="jira-badge">🎫 Jira Ticket: {finalResult.jira_ticket}</div>
              )}
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 14 }}>Admin and user have been notified via email.</p>
              <button className="btn-secondary" style={{ marginTop: 18, width: "100%" }} onClick={reset}>New Transaction</button>
            </div>
          )}

          {result?.status === "ERROR" && (
            <p style={{ color: "#ef4444", textAlign: "center", marginTop: 20, fontSize: 14 }}>
              ❌ Something went wrong. Please check your connection and try again.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
