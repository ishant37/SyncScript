import { useState } from "react";
import { loginUser, registerUser } from "../services/authService";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [errorMessage, setErrorMessage] = useState("");
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
    <main className="min-h-screen w-full bg-[#09090b] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-zinc-950 to-zinc-950 p-8 shadow-2xl">
        <div className="w-full max-w-md">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            SyncScript
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back." : "Create your account."}
          </h1>
          <p className="mt-4 text-zinc-400">
            {mode === "login"
              ? "Log in to collaborate in real time."
              : "Register to create and join collaborative rooms."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            {mode === "register" && (
              <input
                name="username"
                required
                maxLength={50}
                placeholder="Username"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
              />
            )}
            <input
              name="email"
              required
              type="email"
              placeholder="Email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />
            <input
              name="password"
              required
              minLength={8}
              type="password"
              placeholder="Password (at least 8 characters)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-60"
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Register"}
            </button>
          </form>

          {errorMessage && (
            <p className="mt-4 text-sm text-red-300">{errorMessage}</p>
          )}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMessage("");
            }}
            className="mt-5 text-sm text-violet-300 hover:text-violet-200"
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
