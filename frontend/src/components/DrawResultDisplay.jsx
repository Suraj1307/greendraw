import { useRef } from "react";

function DrawResultDisplay({ latestDraw, drawHistory, onUploadProof, uploadingWinnerId }) {
  const inputRefs = useRef({});

  const handleFileChange = (winnerId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      await onUploadProof({
        winnerId,
        proofData: reader.result,
        proofFilename: file.name
      });
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Draw participation</h3>
        <p className="mt-1 text-sm text-slate-400">
          View the latest official draw, track your winnings, and upload proof for verification.
        </p>
      </div>

      {latestDraw ? (
        <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-500/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-400">Latest published draw</p>
            <p className="text-sm text-slate-300">{latestDraw.draw_month}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {latestDraw.numbers.map((number) => (
              <span
                key={number}
                className="rounded-full border border-brand-400/30 bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                {number}
              </span>
            ))}
          </div>
          <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div>Mode: <span className="text-white">{latestDraw.mode}</span></div>
            <div>Prize pool: <span className="text-white">${Number(latestDraw.prize_pool_total || 0).toFixed(2)}</span></div>
            <div>Rollover: <span className="text-white">${Number(latestDraw.jackpot_rollover_out || 0).toFixed(2)}</span></div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {drawHistory.length > 0 ? (
          drawHistory.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium text-white">{item.prize_tier}</div>
                  <div className="mt-1 text-sm text-slate-400">Draw month: {item.draws?.draw_month}</div>
                </div>
                <div className="text-sm text-brand-400">${Number(item.prize_amount || 0).toFixed(2)}</div>
              </div>
              <div className="mt-3 text-sm text-slate-300">
                Winning numbers: {item.draws?.numbers?.join(", ") || "Unavailable"}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Your matches: {item.matched_numbers?.join(", ") || "None"}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Verification: {item.verification_status} | Payment: {item.payment_status}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => inputRefs.current[item.id]?.click()}
                  disabled={uploadingWinnerId === item.id}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-brand-400 hover:text-brand-400 disabled:opacity-60"
                >
                  {uploadingWinnerId === item.id ? "Uploading..." : item.proof_filename ? "Replace proof" : "Upload proof"}
                </button>
                {item.proof_filename ? (
                  <span className="self-center text-xs text-slate-500">{item.proof_filename}</span>
                ) : null}
                <input
                  ref={(node) => {
                    inputRefs.current[item.id] = node;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleFileChange(item.id, event)}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            No winnings yet. When an official draw matches your scores, it will show up here.
          </div>
        )}
      </div>
    </section>
  );
}

export default DrawResultDisplay;
