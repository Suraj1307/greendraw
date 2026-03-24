import { useEffect, useState } from "react";

function SubscriptionPanel({ currentSubscription, onSubscribe, onCancel, loading }) {
  const [plan, setPlan] = useState(currentSubscription?.plan || "monthly");

  useEffect(() => {
    setPlan(currentSubscription?.plan || "monthly");
  }, [currentSubscription]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubscribe(plan);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-white">Subscription</h3>
      <p className="mt-1 text-sm text-slate-400">
        Start a real Razorpay checkout for your selected plan.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {["monthly", "yearly"].map((option) => (
          <label
            key={option}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              plan === option
                ? "border-brand-400 bg-brand-500/10"
                : "border-white/10 bg-slate-900/80 hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value={option}
              checked={plan === option}
              onChange={(event) => setPlan(event.target.value)}
              className="hidden"
            />
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">{option}</div>
            <div className="mt-2 text-xl font-semibold text-white">
              {option === "monthly" ? "$12/mo" : "$120/yr"}
            </div>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-2xl bg-brand-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirecting..." : "Continue to payment"}
      </button>
      {currentSubscription ? (
        <div className="mt-4 space-y-1 text-sm text-slate-400">
          <p>
            Status: <span className="text-white">{currentSubscription.status}</span>
          </p>
          <p>
            Renewal date: <span className="text-white">{currentSubscription.renewal_date?.slice(0, 10)}</span>
          </p>
          <p>
            Provider: <span className="text-white">{currentSubscription.payment_provider}</span>
          </p>
          {currentSubscription.status === "active" ? (
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-400 hover:text-rose-300"
            >
              Cancel subscription
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

export default SubscriptionPanel;
