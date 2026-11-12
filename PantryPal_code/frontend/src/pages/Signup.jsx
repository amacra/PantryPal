import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [showTnC, setShowTnC] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/signup", { email, password, consent });
      login(response.data.sessionToken, response.data.UserID || email);
      alert("Signup successful!");
      navigate("/suggest");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>
        Create an Account
      </h2>

      <form onSubmit={handleSignup}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Password
          <input
            type="password"
            minLength={8}
            maxLength={128}
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        </label>

        <label
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <input
            type="checkbox"
            checked={consent}
            required
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          I agree to the{" "}
          <span
            onClick={() => setShowTnC(true)}
            style={{
              textDecoration: "underline",
              cursor: "pointer",
              color: "#0366d6",
              marginLeft: 4,
            }}
            onMouseOver={(e) => (e.target.style.color = "#0056b3")}
            onMouseOut={(e) => (e.target.style.color = "#0366d6")}
          >
            Terms and Conditions
          </span>
        </label>

        <button
          type="submit"
          style={{
            marginTop: 8,
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "none",
            background: "#0366d6",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Create Account
        </button>

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </form>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <span>Already have an account? </span>
        <button
          onClick={() => navigate("/login")}
          style={{
            color: "#0366d6",
            cursor: "pointer",
            border: "none",
            background: "transparent",
          }}
        >
          Log in
        </button>
      </div>

      {/* Terms & Conditions Modal */}
      {showTnC && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowTnC(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              maxWidth: 650,
              maxHeight: "80%",
              overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              padding: 30,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 16 }}>
              Terms & Conditions — PantryPal Meal Recommender
            </h2>

            <section style={{ marginBottom: 16 }}>
              <h3>1. Acceptance of Terms</h3>
              <p>
                By registering for an account or using the PantryPal Meal
                Recommender service (the “Service”), you agree to be bound by
                these Terms and Conditions (“Terms”) and our Privacy Policy. If
                you do not agree, you may not access or use the Service.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>2. Account Registration</h3>
              <p>
                You must provide accurate, complete, and up-to-date information
                when creating an account. You are responsible for maintaining
                the confidentiality of your login credentials and for notifying
                us immediately of any unauthorized use.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>3. Use of the Service</h3>
              <p>
                The Service is intended for personal, non-commercial use. You
                agree not to engage in any activity that disrupts, interferes
                with, or compromises the integrity of the Service. You must
                comply with all applicable laws and regulations while using the
                Service.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>4. Data Collection and Consent</h3>
              <p>
                The Service collects and processes personal data in accordance
                with our Privacy Policy. By creating an account, you consent to
                the collection, use, and storage of your data for the purposes
                described, including the generation of personalized meal
                recommendations.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>5. Intellectual Property</h3>
              <p>
                All content, trademarks, and proprietary information provided
                through the Service are the property of PantryPal or its
                licensors. You may not copy, distribute, modify, or create
                derivative works from any Service content without explicit
                written permission.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>6. Termination of Accounts</h3>
              <p>
                PantryPal reserves the right to suspend or terminate accounts
                that violate these Terms or any applicable law. You may also
                terminate your account at any time by following the account
                deletion process provided within the Service.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>7. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, PantryPal shall not be
                liable for any direct, indirect, incidental, consequential, or
                punitive damages arising from the use of or inability to use the
                Service, including data loss, errors, or service interruptions.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>8. Changes to Terms</h3>
              <p>
                PantryPal may update these Terms periodically. Continued use of
                the Service constitutes acceptance of any revisions. We
                encourage you to review the Terms regularly to stay informed of
                changes.
              </p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <h3>9. Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of Canada. Any disputes arising under these Terms
                shall be subject to the exclusive jurisdiction of the courts in
                the province of British Columbia.
              </p>
            </section>

            <button
              onClick={() => setShowTnC(false)}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                borderRadius: 6,
                border: "none",
                background: "#0366d6",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
