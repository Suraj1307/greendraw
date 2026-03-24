import { useEffect, useState } from "react";

function CharitySelector({ charities, currentSelection, onSave, loading }) {
  const [charityId, setCharityId] = useState("");
  const [percentage, setPercentage] = useState(10);

  useEffect(() => {
    setCharityId(currentSelection?.charity_id || charities[0]?.id || "");
    setPercentage(currentSelection?.charity_percentage ?? 10);
  }, [charities, currentSelection]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave({ charityId, percentage: Number(percentage) });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">Charity allocation</h3>
      <p className="mt-1 text-sm text-slate-400">
        Choose the charity your membership supports. Minimum contribution is 10%.
      </p>
      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected charity</div>
          <div className="mt-2 text-sm font-medium text-white">
            {charities.find((charity) => charity.id === charityId)?.name || "Choose a charity"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {charities.map((charity) => (
            <button
              key={charity.id}
              type="button"
              onClick={() => setCharityId(charity.id)}
              className={
                charityId === charity.id
                  ? "rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-slate-950"
                  : "rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-brand-400 hover:text-brand-300"
              }
            >
              {charity.name}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="10"
          max="100"
          value={percentage}
          onChange={(event) => setPercentage(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
          placeholder="Contribution percentage"
        />
        <button
          type="submit"
          disabled={loading || !charityId}
          className="w-full rounded-2xl bg-brand-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save charity"}
        </button>
      </div>
    </form>
  );
}

export default CharitySelector;
