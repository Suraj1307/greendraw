function ScoreList({ scores, onEdit }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Your active scores</h3>
          <p className="mt-1 text-sm text-slate-400">Latest five scores in reverse chronological order.</p>
        </div>
        <span className="rounded-full border border-brand-400/30 px-3 py-1 text-xs text-brand-400">
          {scores.length}/5
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {scores.length > 0 ? (
          scores.map((score) => (
            <div
              key={score.id}
              className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-center"
            >
              <div className="text-2xl font-semibold text-white">{score.value}</div>
              <div className="mt-2 text-xs text-slate-500">Played {score.played_at}</div>
              <button
                type="button"
                onClick={() => onEdit(score)}
                className="mt-4 rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300 transition hover:border-brand-400 hover:text-brand-400"
              >
                Edit
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            No scores yet. Add your first score to enter the next monthly draw.
          </div>
        )}
      </div>
    </section>
  );
}

export default ScoreList;
