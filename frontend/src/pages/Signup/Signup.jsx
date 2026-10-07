import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://192.168.29.178:5000";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      alert("Owner account created successfully!");

      navigate("/login");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* Background */}

      <div className="absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      {/* Main */}

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">

          {/* LEFT SIDE */}

          <div className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-900">
                  PG
                </div>

                <div>
                  <p className="font-bold">
                    PG Manager
                  </p>

                  <p className="text-xs text-slate-400">
                    Smart PG Management
                  </p>
                </div>
              </div>

              <div className="mt-20">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                  Get started
                </p>

                <h2 className="mt-4 text-4xl font-bold leading-tight">
                  Manage your PG
                  <br />
                  smarter.
                </h2>

                <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
                  Create your owner account and manage tenants,
                  rooms, beds, rent and payments from one place.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FeatureCard
                number="01"
                text="Tenants"
              />

              <FeatureCard
                number="02"
                text="Rooms"
              />

              <FeatureCard
                number="03"
                text="Payments"
              />
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="bg-white p-6 sm:p-8 md:p-10">

            {/* Mobile Logo */}

            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                PG
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  PG Manager
                </p>

                <p className="text-xs text-slate-500">
                  Smart PG Management
                </p>
              </div>
            </div>

            {/* Heading */}

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Welcome to PG Manager
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Create your owner account
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Set up your account to start managing your PG.
              </p>
            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* Name */}

              <InputField
                label="Full Name"
                icon={<UserIcon />}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className="form-input"
                />
              </InputField>

              {/* Email */}

              <InputField
                label="Email Address"
                icon={<MailIcon />}
              >
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="form-input"
                />
              </InputField>

              {/* Phone */}

              <InputField
                label="Phone Number"
                icon={<PhoneIcon />}
              >
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  className="form-input"
                />
              </InputField>

              {/* Password */}

              <InputField
                label="Password"
                icon={<LockIcon />}
              >
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="form-input pr-12"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Password must be at least 6 characters.
                </p>
              </InputField>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Owner Account
                    <ArrowIcon />
                  </>
                )}
              </button>
            </form>

            {/* Login */}

            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-semibold text-slate-900 transition hover:text-blue-600"
                >
                  Login
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Input Utility Style */}

      <style>{`
        .form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          padding-left: 2.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
          transition: all 150ms ease;
        }

        .form-input::placeholder {
          color: rgb(148 163 184);
        }

        .form-input:hover {
          border-color: rgb(203 213 225);
        }

        .form-input:focus {
          border-color: rgb(15 23 42);
          box-shadow: 0 0 0 3px rgb(15 23 42 / 0.06);
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({ label, icon, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400">
          {icon}
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({ number, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-500">
        {number}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-200">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 20.25a7.5 7.5 0 0115 0"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7l9 6 9-6"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.5 3.5h3l1.5 4-2 1.5a13 13 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2C10.596 18.5 5.5 13.404 5.5 7a2 2 0 012-2z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />
      <path
        strokeLinecap="round"
        d="M8 10V7a4 4 0 018 0v3"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
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
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
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
        d="M10.58 10.58a2 2 0 002.83 2.83"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.88 5.08A10.8 10.8 0 0112 4.9c6 0 9.5 7.1 9.5 7.1a17.5 17.5 0 01-3.1 3.84M6.23 6.23C3.83 7.8 2.5 12 2.5 12s3.5 7.1 9.5 7.1a10.6 10.6 0 003.15-.48"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 transition-transform group-hover:translate-x-1"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14M13 6l6 6-6 6"
      />
    </svg>
  );
}

export default Signup;