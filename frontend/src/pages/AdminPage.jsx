import { useEffect, useState } from "react";
import api from "../api";

function AdminPage() {
  const drawModes = ["random", "algorithmic"];
  const userRoles = ["subscriber", "admin"];
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [winners, setWinners] = useState([]);
  const [charities, setCharities] = useState([]);
  const [drawForm, setDrawForm] = useState({
    mode: "random",
    publish: false,
    drawMonth: new Date().toISOString().slice(0, 10),
    customNumbers: "",
    publishLastSimulation: false
  });
  const [drawResult, setDrawResult] = useState(null);
  const [charityForm, setCharityForm] = useState({ name: "", description: "", category: "community", imageUrl: "", upcomingEvent: "", featured: false });
  const [message, setMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const loadAdminData = async () => {
    const [overviewResponse, usersResponse, winnersResponse, charitiesResponse] = await Promise.all([
      api.get("/admin/overview"),
      api.get("/admin/users"),
      api.get("/admin/winners"),
      api.get("/charities")
    ]);

    setOverview(overviewResponse.data.overview);
    setUsers(usersResponse.data.users || []);
    setWinners(winnersResponse.data.winners || []);
    setCharities(charitiesResponse.data.charities || []);
  };

  useEffect(() => {
    loadAdminData().catch((error) => {
      setPageError(error.response?.data?.message || "Unable to load admin data.");
    });
  }, []);

  const handleRunDraw = async (publish, options = {}) => {
    setMessage("");

    try {
      const response = await api.post("/draw/run", {
        ...drawForm,
        publish,
        ...options
      });
      setDrawResult(response.data);
      if (publish) {
        await loadAdminData();
      }
      setMessage(
        publish
          ? options.publishLastSimulation
            ? "Stored simulation published."
            : "Official draw published."
          : "Simulation completed."
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to run draw.");
    }
  };

  const handleUserRoleChange = async (userId, role) => {
    await api.patch(`/admin/users/${userId}`, { role });
    await loadAdminData();
    setMessage("User updated.");
  };

  const handleSubscriptionStatus = async (userId, plan, status) => {
    await api.post(`/admin/users/${userId}/subscription`, { plan, status });
    await loadAdminData();
    setMessage("Subscription status updated.");
  };

  const handleWinnerUpdate = async (winnerId, verificationStatus, paymentStatus) => {
    await api.patch(`/admin/winners/${winnerId}`, { verificationStatus, paymentStatus });
    await loadAdminData();
    setMessage("Winner updated.");
  };

  const handleCreateCharity = async (event) => {
    event.preventDefault();
    await api.post("/admin/charities", charityForm);
    setCharityForm({ name: "", description: "", category: "community", imageUrl: "", upcomingEvent: "", featured: false });
    await loadAdminData();
    setMessage("Charity created.");
  };

  const handleDeleteCharity = async (charityId) => {
    await api.delete(`/admin/charities/${charityId}`);
    await loadAdminData();
    setMessage("Charity deleted.");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-400">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Operations, verification, and reporting</h1>
        {pageError ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {pageError}
          </div>
        ) : null}
        {message ? (
          <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
            {message}
          </div>
        ) : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {overview
            ? [
                ["Users", overview.totalUsers],
                ["Active Subs", overview.activeSubscriptions],
                ["Draws", overview.totalDraws],
                ["Prize Paid", `$${Number(overview.totalPrizePaid || 0).toFixed(2)}`],
                ["Charity Total", `$${Number(overview.totalCharityContribution || 0).toFixed(2)}`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="text-sm text-slate-400">{label}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{value}</div>
                </div>
              ))
            : null}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Draw studio</h2>
            <p className="mt-1 text-sm text-slate-400">
              Simulate once, publish the same simulation, or provide custom numbers for deterministic testing.
            </p>
          </div>
          <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[minmax(0,220px)_minmax(0,180px)_minmax(0,260px)_minmax(0,220px)]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Draw mode</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {drawModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDrawForm((previous) => ({ ...previous, mode }))}
                    className={
                      drawForm.mode === mode
                        ? "rounded-full bg-brand-500 px-4 py-2 text-sm font-medium capitalize text-slate-950"
                        : "rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm capitalize text-slate-300 transition hover:border-brand-400 hover:text-brand-300"
                    }
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              value={drawForm.drawMonth}
              onChange={(event) => setDrawForm((previous) => ({ ...previous, drawMonth: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            />
            <input
              type="text"
              value={drawForm.customNumbers}
              onChange={(event) => setDrawForm((previous) => ({ ...previous, customNumbers: event.target.value }))}
              placeholder="Custom numbers e.g. 6,8,30,40,43"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => handleRunDraw(false)} className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-white transition hover:border-brand-400">
                Simulate
              </button>
              <button type="button" onClick={() => handleRunDraw(true)} className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-brand-400">
                Publish
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleRunDraw(true, { publishLastSimulation: true, customNumbers: "" })}
            className="rounded-2xl border border-brand-400/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-300 transition hover:bg-brand-500/20"
          >
            Publish last simulation
          </button>
          <button
            type="button"
            onClick={() =>
              setDrawForm((previous) => ({
                ...previous,
                customNumbers: "6,8,30,40,43"
              }))
            }
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-white transition hover:border-brand-400"
          >
            Autofill winning test numbers
          </button>
        </div>
        {drawResult ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="text-sm text-slate-400">{drawResult.simulation ? "Simulation" : "Published draw"}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(drawResult.draw?.numbers || []).map((number) => (
                <span key={number} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-white">
                  {number}
                </span>
              ))}
            </div>
            <div className="mt-4 text-sm text-slate-300">Winners: {drawResult.winners?.length || 0}</div>
            {drawResult.simulation ? (
              <div className="mt-2 text-xs text-slate-500">This simulation is stored and can be published with the button above.</div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Users and subscriptions</h2>
            <div className="mt-5 space-y-4">
              {users.map((user) => (
                <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {user.subscription?.plan || "no plan"} | {user.subscription?.status || "inactive"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Charity: {user.charity?.name || "Not selected"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <div className="flex flex-wrap gap-2">
                        {userRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleUserRoleChange(user.id, role)}
                            className={
                              user.role === role
                                ? "rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium capitalize text-slate-950"
                                : "rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm capitalize text-white transition hover:border-brand-400 hover:text-brand-300"
                            }
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleSubscriptionStatus(user.id, user.subscription?.plan || "monthly", "active")}
                        className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => handleSubscriptionStatus(user.id, user.subscription?.plan || "monthly", "cancelled")}
                        className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Winner verification</h2>
            <div className="mt-5 space-y-4">
              {winners.map((winner) => (
                <div key={winner.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-medium text-white">{winner.user?.name}</div>
                      <div className="text-sm text-slate-400">{winner.prize_tier} | ${Number(winner.prize_amount || 0).toFixed(2)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Verification: {winner.verification_status} | Payment: {winner.payment_status}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Draw month: {winner.draw?.draw_month || "Unknown"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        onClick={() => handleWinnerUpdate(winner.id, "approved", "pending")}
                        className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleWinnerUpdate(winner.id, "rejected", "rejected")}
                        className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleWinnerUpdate(winner.id, winner.verification_status, "paid")}
                        className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white"
                      >
                        Mark paid
                      </button>
                    </div>
                  </div>
                  {winner.proof_url ? (
                    <img src={winner.proof_url} alt={winner.proof_filename || "Winner proof"} className="mt-4 max-h-64 rounded-2xl border border-white/10 object-contain" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <form onSubmit={handleCreateCharity} className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Charity management</h2>
            <div className="mt-5 space-y-3">
              <input value={charityForm.name} onChange={(event) => setCharityForm((previous) => ({ ...previous, name: event.target.value }))} placeholder="Charity name" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" required />
              <textarea value={charityForm.description} onChange={(event) => setCharityForm((previous) => ({ ...previous, description: event.target.value }))} placeholder="Description" className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" required />
              <input value={charityForm.category} onChange={(event) => setCharityForm((previous) => ({ ...previous, category: event.target.value }))} placeholder="Category" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
              <input value={charityForm.imageUrl} onChange={(event) => setCharityForm((previous) => ({ ...previous, imageUrl: event.target.value }))} placeholder="Image URL" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
              <input value={charityForm.upcomingEvent} onChange={(event) => setCharityForm((previous) => ({ ...previous, upcomingEvent: event.target.value }))} placeholder="Upcoming event" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" checked={charityForm.featured} onChange={(event) => setCharityForm((previous) => ({ ...previous, featured: event.target.checked }))} />
                Featured on homepage
              </label>
              <button type="submit" className="w-full rounded-2xl bg-brand-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-brand-400">
                Add charity
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Current charities</h2>
            <div className="mt-5 space-y-3">
              {charities.map((charity) => (
                <div key={charity.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{charity.name}</div>
                      <div className="mt-1 text-sm text-slate-400">{charity.category}</div>
                    </div>
                    <button onClick={() => handleDeleteCharity(charity.id)} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
