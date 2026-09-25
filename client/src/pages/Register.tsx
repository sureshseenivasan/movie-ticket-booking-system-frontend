import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import AuthLayout from "../components/AuthLayout";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-[#f84464] focus:ring-2 focus:ring-[#f84464]/20";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");

      return;
    }

    try {
      setLoading(true);

      setError("");

      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // The Login page shows a "Registration successful" message
      navigate("/login", { state: { registered: true } });
    } catch (error: any) {
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up to start booking movies"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#f84464]">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <label className="text-sm font-semibold text-slate-700">
          Full name
          <input
            type="text"
            placeholder="Your name"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className={inputClass}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
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
            htmlFor="register-password"
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
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

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Confirm password
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            className={inputClass}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#f84464] py-3 font-semibold text-white transition hover:bg-[#e63a58] disabled:bg-slate-300"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
