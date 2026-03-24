import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
    navigate("/login");
  };

  const handleNavigate = () => {
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" onClick={handleNavigate} className="text-lg font-semibold tracking-wide text-white sm:text-xl">
            GreenDraw
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200 sm:hidden"
          >
            {isOpen ? "Close" : "Menu"}
          </button>
          <nav className="hidden items-center gap-4 text-sm text-slate-300 sm:flex">
            <Link to="/" onClick={handleNavigate} className="transition hover:text-brand-400">
              Home
            </Link>
            <Link to="/charities" onClick={handleNavigate} className="transition hover:text-brand-400">
              Charities
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={handleNavigate} className="transition hover:text-brand-400">
                  Dashboard
                </Link>
                {user.role === "admin" ? (
                  <Link to="/admin" onClick={handleNavigate} className="transition hover:text-brand-400">
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-white/15 px-4 py-2 transition hover:border-brand-400 hover:text-brand-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={handleNavigate} className="transition hover:text-brand-400">
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={handleNavigate}
                  className="rounded-full bg-brand-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-brand-400"
                >
                  Join now
                </Link>
              </>
            )}
          </nav>
        </div>
        {isOpen ? (
          <nav className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-sm text-slate-200 sm:hidden">
            <Link to="/" onClick={handleNavigate} className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-brand-400">
              Home
            </Link>
            <Link to="/charities" onClick={handleNavigate} className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-brand-400">
              Charities
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={handleNavigate} className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-brand-400">
                  Dashboard
                </Link>
                {user.role === "admin" ? (
                  <Link to="/admin" onClick={handleNavigate} className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-brand-400">
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-white/10 px-3 py-2 text-left transition hover:border-brand-400 hover:text-brand-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={handleNavigate} className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-brand-400">
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={handleNavigate}
                  className="rounded-xl bg-brand-500 px-3 py-2 font-medium text-slate-950 transition hover:bg-brand-400"
                >
                  Join now
                </Link>
              </>
            )}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

export default Navbar;
