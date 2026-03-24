import { useEffect, useState } from "react";

function ScoreForm({ onSubmit, loading, editingScore, onCancelEdit }) {
  const [value, setValue] = useState("");
  const [playedAt, setPlayedAt] = useState("");

  useEffect(() => {
    if (editingScore) {
      setValue(String(editingScore.value));
      setPlayedAt(editingScore.played_at);
      return;
    }

    setValue("");
    setPlayedAt(new Date().toISOString().slice(0, 10));
  }, [editingScore]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!value || !playedAt) return;

    await onSubmit({
      id: editingScore?.id,
      value: Number(value),
      playedAt
    });

    if (!editingScore) {
      setValue("");
      setPlayedAt(new Date().toISOString().slice(0, 10));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {editingScore ? "Edit score" : "Add a score"}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Record Stableford scores with the date played. Only the latest five are kept.
          </p>
        </div>
        {editingScore ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-white/30"
          >
            Cancel
          </button>
        ) : null}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="number"
          min="1"
          max="45"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
          placeholder="Enter score"
          required
        />
        <input
          type="date"
          value={playedAt}
          onChange={(event) => setPlayedAt(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-brand-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : editingScore ? "Update" : "Add score"}
        </button>
      </div>
    </form>
  );
}

export default ScoreForm;
