import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://192.168.29.178:5000";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Login
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token
      localStorage.setItem("token", data.token);

      // Save user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // Get authenticated user's PG information
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        throw new Error(
          meData.message || "Failed to fetch PG information"
        );
      }

      // Remove old PG data first
      localStorage.removeItem("pg");

      // Save current PG information
      if (meData.pg) {
        localStorage.setItem("pg", JSON.stringify(meData.pg));
      }

      // Redirect according to user role
      if (data.user.role === "owner") {
        if (meData.pg) {
          navigate("/dashboard");
        } else {
          navigate("/pg-setup");
        }
      } else if (data.user.role === "admin") {
        navigate("/dashboard");
      } else if (data.user.role === "tenant") {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (error) {
      setError(
        error.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 sm:rounded-3xl">
          {/* Header */}
          <div className="px-5 pb-2 pt-7 sm:px-8 sm:pt-9">
            <div className="mb-7 sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">
                PG Management
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back 👋
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                Login to manage your PG
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600"
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  disabled={loading}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 sm:h-[52px]"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 sm:h-[52px]"
                  />

                  {/* Show / Hide Password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      /* Eye Off */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.58 10.58a2 2 0 002.84 2.84"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.88 4.24A9.77 9.77 0 0112 4c5.05 0 8.27 4.18 9.5 6.01a3.04 3.04 0 010 3.98 16.74 16.74 0 01-3.18 3.08M6.23 6.23C4.55 7.35 3.29 8.77 2.5 10.01a3.04 3.04 0 000 3.98C3.73 15.82 6.95 20 12 20c1.61 0 3.04-.42 4.3-1.05"
                        />
                      </svg>
                    ) : (
                      /* Eye */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M21 12a9 9 0 00-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>

          {/* Signup */}
          <div className="px-5 pb-7 pt-6 sm:px-8 sm:pb-9">
            <div className="border-t border-slate-100 pt-5 text-center sm:pt-6">
              <p className="text-sm text-slate-500">
                Don't have an owner account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  disabled={loading}
                  className="font-semibold text-slate-900 transition hover:text-slate-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Small Footer */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Secure PG management system
        </p>
      </div>
    </div>
  );
}

export default Login;