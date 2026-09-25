import { useState, type FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  // The home page reads the search text from the "q" address parameter
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    const text = query.trim();

    navigate(text ? `/?q=${encodeURIComponent(text)}` : "/");
  };

  const linkClass = "text-sm font-medium text-slate-200 hover:text-white";

  return (
    <nav className="h-16 bg-[#333545] text-white shadow-md">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4">
        {/* LOGO */}

        <Link
          to="/"
          className="shrink-0 text-xl font-extrabold tracking-tight"
        >
          🎬 Movie<span className="text-[#f84464]">Book</span>
        </Link>

        {/* SEARCH */}

        <form onSubmit={handleSearch} className="hidden flex-1 md:block">
          <div className="relative mx-auto max-w-lg">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies"
              aria-label="Search for movies"
              className="w-full rounded-md bg-white py-2 pl-10 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </form>

        {/* LINKS */}

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <Link to="/" className={linkClass}>
            Movies
          </Link>

          {user ? (
            <>
              <Link to="/bookings" className={linkClass}>
                My Bookings
              </Link>

              <span className="hidden items-center gap-2 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f84464] text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </span>

                <span className="text-sm font-medium">{user.name}</span>
              </span>

              <button
                onClick={handleLogout}
                className="rounded-md border border-white/40 px-4 py-1.5 text-sm font-semibold hover:bg-white/10"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-md bg-[#f84464] px-4 py-1.5 text-sm font-semibold hover:bg-[#e63a58]"
              >
                Register
              </Link>

                <Link to="/admin/posters" className={linkClass}>Posters</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
