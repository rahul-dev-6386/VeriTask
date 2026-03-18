import { createElement, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  LayoutTemplate,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import api, { getErrorMessage } from "../lib/api";

const featureCards = [
  {
    icon: LayoutTemplate,
    title: "Smart planning",
    description: "Organize tasks with clean status views, due dates, and a dashboard built for daily execution.",
  },
  {
    icon: ShieldEllipsis,
    title: "Secure recovery",
    description: "Forgot-password and reset flows are protected with OTP verification so access stays in the right hands.",
  },
  {
    icon: ShieldCheck,
    title: "Protected sessions",
    description: "Verified signup, trusted sessions, and logout-all controls help keep every account protected.",
  },
];

const securityHighlights = [
  "Email OTP to verify every new account",
  "One-time code based password recovery",
  "Protected session access across devices",
  "Logout all devices directly from the dashboard",
];

const metrics = [
  { label: "Task views", value: "4" },
  { label: "Secure signup", value: "OTP" },
  { label: "Recovery flow", value: "Ready" },
];

const initialSignupState = {
  email: "",
  password: "",
  name: "",
};

const initialResetState = {
  email: "",
  otp: "",
  newPassword: "",
};

export default function Landing({ theme, setTheme }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [signupDraft, setSignupDraft] = useState(initialSignupState);
  const [resetDraft, setResetDraft] = useState(initialResetState);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        await api.get("/user");
        navigate("/dashboard", { replace: true });
      } catch {
        setSessionChecking(false);
      }
    };

    checkSession();
  }, [navigate]);

  const resetFeedback = () => {
    setErrors({});
    setFeedback({ type: "", text: "" });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setOtp("");
    resetFeedback();
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      if (mode === "login") {
        await api.post("/signin", { email, password });
        navigate("/dashboard", { replace: true });
        return;
      }

      await api.post("/signup", { email, password, name });
      setSignupDraft({ email, password, name });
      setOtp("");
      setMode("signup-otp");
      setFeedback({
        type: "success",
        text: "We sent a 6-digit verification code to your email. Enter it below to finish signup.",
      });
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setFeedback({ type: "error", text: getErrorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      await api.post("/verify-otp", {
        email: signupDraft.email,
        otp,
      });

      setFeedback({
        type: "success",
        text: "Account verified successfully. You can sign in now.",
      });
      setOtp("");
      setPassword("");
      setMode("login");
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "OTP verification failed.") });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    resetFeedback();
    setLoading(true);

    try {
      await api.post("/signup", signupDraft);
      setFeedback({
        type: "success",
        text: `A fresh OTP was sent to ${signupDraft.email}.`,
      });
      setOtp("");
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Unable to resend OTP.") });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      await api.post("/forgot-password", { email: resetDraft.email });
      setMode("reset-password");
      setFeedback({
        type: "success",
        text: "If your account exists, a reset OTP has been sent to your email.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Unable to start password reset.") });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      await api.post("/reset-password", {
        email: resetDraft.email,
        otp: resetDraft.otp,
        newPassword: resetDraft.newPassword,
      });

      setResetDraft(initialResetState);
      setPassword("");
      setMode("login");
      setFeedback({
        type: "success",
        text: "Password reset successful. Sign in with your new password.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Unable to reset password.") });
    } finally {
      setLoading(false);
    }
  };

  if (sessionChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-4 text-[var(--text-strong)]">
        <div className="flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white/70 px-5 py-3 shadow-lg shadow-black/5 backdrop-blur">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)]" />
          <span className="text-sm text-[var(--text-muted)]">Preparing your workspace...</span>
        </div>
      </div>
    );
  }

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isSignupOtp = mode === "signup-otp";
  const isForgotPassword = mode === "forgot-password";
  const isResetPassword = mode === "reset-password";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] text-[var(--text-strong)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(241,120,72,0.18),transparent_28%),radial-gradient(circle_at_78%_18%,_rgba(12,148,136,0.14),transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.76),rgba(246,241,232,0.98))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(241,120,72,0.14),transparent_28%),radial-gradient(circle_at_78%_18%,_rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,_rgba(12,17,24,0.94),rgba(12,17,24,1))]" />
      <div className="absolute left-[-8rem] top-20 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />
      <div className="absolute bottom-[-5rem] right-[-4rem] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl dark:bg-sky-400/10" />

      <button
        onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        title={theme === "light" ? "Dark mode" : "Light mode"}
        className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/75 text-[var(--text-muted)] shadow-lg shadow-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:text-[var(--text-strong)] dark:bg-[rgba(15,23,33,0.78)] sm:right-6 sm:top-6"
      >
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-4 pb-10 pt-20 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:px-10 lg:pb-12 lg:pt-10">
        <section className="flex flex-col justify-between gap-10 lg:py-10">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm text-[var(--text-muted)] shadow-lg shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                <CheckCircle2 size={18} />
              </div>
              VeriTask
            </div>

            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                <Clock3 size={14} />
                Smart planning with secure access
              </p>
              <h1 className="font-display text-4xl leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                VeriTask helps you plan clearly, work faster, and stay secure.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                Manage tasks, monitor progress, and keep account access protected with OTP verification, secure recovery, and device-level session control.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureCards.map(({ icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-[var(--border-soft)] bg-[var(--panel)] p-5 shadow-xl shadow-black/[0.04] backdrop-blur transition hover:-translate-y-1"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    {createElement(icon, { size: 20 })}
                  </div>
                  <h2 className="text-base font-semibold text-[var(--text-strong)]">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
                </article>
              ))}
            </div>

            <div className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-xl shadow-black/[0.04]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">Security highlights</p>
                  <h2 className="mt-2 text-2xl font-semibold">What VeriTask offers</h2>
                </div>
                <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {securityHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-4 text-sm text-[var(--text-muted)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[var(--accent)]" />
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-xl shadow-black/[0.04]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">What we offer</p>
                <h2 className="mt-2 text-2xl font-semibold">A workspace focused on execution</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                  VeriTask brings planning, task tracking, completion visibility, and deadline awareness into one clean workflow for desktop and mobile.
                </p>
              </article>

              <article className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-xl shadow-black/[0.04]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">Why it is secure</p>
                <h2 className="mt-2 text-2xl font-semibold">Protection built into every login flow</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                  Signup verification, password reset OTP, session handling, and logout-all controls help keep your account safe without making the experience complicated.
                </p>
              </article>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] px-4 py-5 shadow-lg shadow-black/[0.04]">
                <p className="text-2xl font-semibold text-[var(--text-strong)]">{metric.value}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center lg:py-10">
          <div className="w-full max-w-lg rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.74)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(15,23,33,0.84)] sm:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-subtle)]">Workspace access</p>
                <h2 className="mt-2 font-display text-3xl tracking-[-0.03em]">
                  {isSignupOtp
                    ? "Verify your email"
                    : isForgotPassword
                      ? "Recover access"
                      : isResetPassword
                        ? "Reset your password"
                        : isLogin
                          ? "Welcome back"
                          : "Create your account"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  {isSignupOtp
                    ? `Enter the code sent to ${signupDraft.email}.`
                    : isForgotPassword
                      ? "Request a reset OTP using your registered email."
                      : isResetPassword
                        ? "Enter the reset OTP and choose your new password."
                        : isLogin
                          ? "Sign in to continue with your saved tasks and AI history."
                          : "Create your account, then confirm it with a one-time password."}
                </p>
              </div>
              <div className="w-fit rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-2 text-xs text-[var(--text-subtle)]">
                {isSignupOtp ? "OTP required" : isResetPassword ? "Password reset" : "Secure access"}
              </div>
            </div>

            {isSignupOtp ? (
              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <Field
                  icon={Mail}
                  label="Email"
                  value={signupDraft.email}
                  onChange={() => {}}
                  readOnly
                />
                <Field
                  icon={KeyRound}
                  label="Verification code"
                  value={otp}
                  onChange={setOtp}
                  placeholder="Enter 6-digit OTP"
                  error={errors.otp}
                />

                <FeedbackBanner feedback={feedback} />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <SpinnerLabel label="Verifying" /> : <>
                    Verify OTP
                    <ArrowRight size={16} />
                  </>}
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setOtp("");
                      resetFeedback();
                    }}
                    className="rounded-2xl border border-[var(--border-soft)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                  >
                    Back to details
                  </button>
                </div>
              </form>
            ) : isForgotPassword ? (
              <form className="space-y-4" onSubmit={handleForgotPassword}>
                <Field
                  icon={Mail}
                  label="Registered email"
                  type="email"
                  value={resetDraft.email}
                  onChange={(value) => setResetDraft((current) => ({ ...current, email: value }))}
                  placeholder="you@example.com"
                />

                <FeedbackBanner feedback={feedback} />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <SpinnerLabel label="Sending OTP" /> : <>
                    Send reset OTP
                    <ArrowRight size={16} />
                  </>}
                </button>
              </form>
            ) : isResetPassword ? (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <Field
                  icon={Mail}
                  label="Email"
                  type="email"
                  value={resetDraft.email}
                  onChange={(value) => setResetDraft((current) => ({ ...current, email: value }))}
                  placeholder="you@example.com"
                />
                <Field
                  icon={KeyRound}
                  label="Reset OTP"
                  value={resetDraft.otp}
                  onChange={(value) => setResetDraft((current) => ({ ...current, otp: value }))}
                  placeholder="Enter 6-digit OTP"
                />
                <Field
                  icon={Lock}
                  label="New password"
                  type="password"
                  value={resetDraft.newPassword}
                  onChange={(value) => setResetDraft((current) => ({ ...current, newPassword: value }))}
                  placeholder="Use 8+ characters"
                />

                <FeedbackBanner feedback={feedback} />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <SpinnerLabel label="Resetting" /> : <>
                    Reset password
                    <ArrowRight size={16} />
                  </>}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleAuth}>
                {isSignup && (
                  <Field
                    icon={User}
                    label="Full name"
                    value={name}
                    onChange={setName}
                    placeholder="Rahul Sharma"
                    error={errors.name}
                  />
                )}

                <Field
                  icon={Mail}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  error={errors.email}
                />

                <Field
                  icon={Lock}
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder={isLogin ? "Enter your password" : "Use 8+ chars with mixed strength"}
                  error={errors.password}
                />

                {isSignup && (
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    Sign up now sends an OTP to your email before the account becomes active.
                  </div>
                )}

                <FeedbackBanner feedback={feedback} />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <SpinnerLabel label="Processing" />
                  ) : (
                    <>
                      {isLogin ? "Sign in" : "Send OTP"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {!isSignupOtp && (
              <div className="mt-6 space-y-3">
                {(isLogin || isSignup) && (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    <span>{isLogin ? "Need an account?" : "Already registered?"}</span>
                    <button
                      type="button"
                      onClick={() => switchMode(isLogin ? "signup" : "login")}
                      className="font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                    >
                      {isLogin ? "Create one" : "Sign in"}
                    </button>
                  </div>
                )}

                {isLogin && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot-password")}
                    className="w-full rounded-2xl border border-[var(--border-soft)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                  >
                    Forgot password?
                  </button>
                )}

                {(isForgotPassword || isResetPassword) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {isForgotPassword && (
                      <button
                        type="button"
                        onClick={() => switchMode("reset-password")}
                        className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                      >
                        I already have OTP
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="rounded-2xl border border-[var(--border-soft)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                    >
                      Back to sign in
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FeedbackBanner({ feedback }) {
  if (!feedback.text) {
    return null;
  }

  const isError = feedback.type === "error";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          : "border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]"
      }`}
    >
      <AlertCircle size={16} className={`mt-0.5 shrink-0 ${isError ? "" : "text-[var(--accent)]"}`} />
      <span>{feedback.text}</span>
    </div>
  );
}

function SpinnerLabel({ label }) {
  return (
    <>
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
      {label}
    </>
  );
}

function Field({ icon, label, value, onChange, placeholder, type = "text", error, readOnly = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">{label}</span>
      <div
        className={`flex items-center gap-3 rounded-2xl border bg-[var(--panel-soft)] px-4 py-3 transition ${
          error ? "border-red-400/80" : "border-[var(--border-soft)] focus-within:border-[var(--accent)]"
        } ${readOnly ? "opacity-80" : ""}`}
      >
        {createElement(icon, { size: 18, className: "shrink-0 text-[var(--text-subtle)]" })}
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-subtle)]"
        />
      </div>
      {error && <span className="mt-2 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
