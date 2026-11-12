import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/login", { email, password });
      // backend returns { token, expiresIn }; pass email too so AuthContext stores userEmail
      login(response.data.sessionToken, response.data.UserID || email);
      // Avoid a blocking alert which can interfere with React state propagation
      navigate("/suggest");
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.error;
      if (backendMessage && backendMessage.toLowerCase().includes('deleted')) {
        setError("This account has been deleted. Please sign up again.");
      } else {
        setError(backendMessage || "Login failed");
      }
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Password
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <button
          type="submit"
          style={{
            marginTop: 18,
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#0366d6",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Log In
        </button>

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </form>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <span>Don't have an account? </span>
        <button
          onClick={() => navigate("/signup")}
          style={{
            color: "#0366d6",
            cursor: "pointer",
            border: "none",
            background: "transparent",
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
