import type { ReactNode } from "react";

interface Props {
  title: string;

  subtitle: string;

  children: ReactNode;

  footer: ReactNode;
}

const features = [
  { icon: "🎟️", text: "Book tickets in a few taps" },
  { icon: "💺", text: "Pick your exact seats" },
  { icon: "📧", text: "Get your ticket by email and SMS" },
];

// Shared layout for the Login and Register pages
const AuthLayout = ({ title, subtitle, children, footer }: Props) => {
  return (
    <div className="grid min-h-[calc(100vh-64px)] md:grid-cols-2">
      {/* BRAND PANEL */}

      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#1f2533] via-[#333545] to-[#f84464] p-12 text-white md:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />

        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative text-2xl font-extrabold tracking-tight">
          🎬 Movie<span className="text-[#f84464]">Book</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Your seat is
            <br />
            waiting for you.
          </h2>

          <p className="mt-4 max-w-sm text-slate-200">
            Discover the latest movies, choose your theater and book your
            tickets instantly.
          </p>

          <ul className="mt-8 space-y-4">
            {features.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg">
                  {feature.icon}
                </span>

                <span className="font-medium">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-slate-300">
          © {new Date().getFullYear()} MovieBook
        </p>
      </div>

      {/* FORM PANEL */}

      <div className="flex items-center justify-center bg-[#f2f2f2] px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center text-2xl font-extrabold text-[#1f2533] md:hidden">
            🎬 Movie<span className="text-[#f84464]">Book</span>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-[#1f2533]">{title}</h1>

            <p className="mt-1 text-slate-500">{subtitle}</p>

            <div className="mt-6">{children}</div>
          </div>

          <p className="mt-6 text-center text-slate-600">{footer}</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
