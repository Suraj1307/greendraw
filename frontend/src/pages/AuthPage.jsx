import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function AuthPage({ mode, onAuthSuccess }) {
  const navigate = useNavigate();
  const isSignup = mode === "signup";
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    charityId: "",
    charityPercentage: 10
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignup) return;

    api.get("/charities")
      .then((response) => {
        const charityList = response.data.charities || [];
        setCharities(charityList);
        if (charityList[0]) {
          setForm((previous) => ({ ...previous, charityId: charityList[0].id }));
        }
      })
      .catch(() => setCharities([]));
  }, [isSignup]);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const payload = isSignup
        ? {
            name: form.name,
            email: form.email,
            password: form.password,
            charityId: form.charityId,
            charityPercentage: Number(form.charityPercentage)
          }
        : { email: form.email, password: form.password };
      const response = await api.post(endpoint, payload);

      localStorage.setItem("greendraw-token", response.data.token);
      onAuthSuccess(response.data.user);
      navigate(response.data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-4 py-8 sm:px-6 sm:py-16">
      <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-glow lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-brand-600 via-slate-900 to-slate-950 p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-400">GreenDraw access</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            {isSignup ? "Join the charity draw platform." : "Welcome back to your dashboard."}
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Manage scores, subscriptions, draw participation, charity support, and winner verification from one flow.
          </p>
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{isSignup ? "Create account" : "Login"}</h2>
          <p className="mt-2 text-slate-400">
            {isSignup ? "Select your charity and start your membership." : "Continue where you left off."}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup ? (
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
                required
              />
            ) : null}
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
              required
            />
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
              required
            />
            {isSignup ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected charity</div>
                  <div className="mt-2 text-sm font-medium text-white">
                    {charities.find((charity) => charity.id === form.charityId)?.name || "Choose a charity"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {charities.map((charity) => (
                    <button
                      key={charity.id}
                      type="button"
                      onClick={() => setForm((previous) => ({ ...previous, charityId: charity.id }))}
                      className={
                        form.charityId === charity.id
                          ? "rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-slate-950"
                          : "rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-brand-400 hover:text-brand-300"
                      }
                    >
                      {charity.name}
                    </button>
                  ))}
                </div>
                <input
                  name="charityPercentage"
                  type="number"
                  min="10"
                  max="100"
                  value={form.charityPercentage}
                  onChange={handleChange}
                  placeholder="Charity contribution %"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
                  required
                />
              </>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : isSignup ? "Create account" : "Login"}
            </button>
          </form>
          <p className="mt-5 text-sm text-slate-400">
            {isSignup ? "Already registered?" : "Need an account?"}{" "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="font-medium text-brand-400 transition hover:text-brand-300"
            >
              {isSignup ? "Login" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
