import { useState } from "react";
import { loginUser, registerUser } from "../services/authService";

export default function AuthPage({ onAuthenticated, initialError = "" }) {
  const [mode, setMode] = useState("login");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      email: form.email.value.trim(),
      password: form.password.value,
    };

    if (mode === "register") {
      payload.username = form.username.value.trim();
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await registerUser(payload);
      }

      const user = await loginUser({
        email: payload.email,
        password: payload.password,
      });
      onAuthenticated(user);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-intro">
          <div className="brand-mark">S</div>
          <p className="eyebrow">SyncScript workspace</p>
          <h1>Build together, without the handoff.</h1>
          <p className="auth-description">
            A focused space for interviews, pair programming, and real-time collaboration.
          </p>
          <div className="auth-points">
            <span>● Shared editor</span><span>● Live video</span><span>● Interview rooms</span>
          </div>
        </div>
        <div className="auth-form-panel">
          <p className="form-kicker">{mode === "login" ? "Welcome back" : "Get started"}</p>
          <h2>
            {mode === "login" ? "Welcome back." : "Create your account."}
          </h2>
          <p className="form-subtitle">
            {mode === "login"
              ? "Log in to collaborate in real time."
              : "Register to create and join collaborative rooms."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <input
                name="username"
                required
                maxLength={50}
                placeholder="Username"
                className="field"
              />
            )}
            <input
              name="email"
              required
              type="email"
              placeholder="Email"
              className="field"
            />
            <input
              name="password"
              required
              minLength={8}
              type="password"
              placeholder="Password (at least 8 characters)"
              className="field"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button"
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Register"}
            </button>
          </form>

          {errorMessage && (
            <p className="error-banner">{errorMessage}</p>
          )}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMessage("");
            }}
            className="text-button"
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Already registered? Log in"}
          </button>
        </div>
      </div>
    </main>
  );
}
