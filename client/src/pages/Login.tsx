import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-[#f84464] focus:ring-2 focus:ring-[#f84464]/20";

const Login = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // Set by the Register page after a successful sign up
  const justRegistered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      setError("");

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      login(token, user);

      navigate("/");
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to book your tickets"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[#f84464]">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {justRegistered && !error && (
          <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Registration successful! Please login.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <label className="text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className={inputClass}
            required
          />
        </label>

        <div className="mt-4">
          <label
            htmlFor="login-password"
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className={`${inputClass} pr-16`}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-[#f84464]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#f84464] py-3 font-semibold text-white transition hover:bg-[#e63a58] disabled:bg-slate-300"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
