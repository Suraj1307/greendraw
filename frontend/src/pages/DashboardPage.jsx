import { useEffect, useState } from "react";
import api from "../api";
import ScoreForm from "../components/ScoreForm";
import ScoreList from "../components/ScoreList";
import CharitySelector from "../components/CharitySelector";
import DrawResultDisplay from "../components/DrawResultDisplay";
import SubscriptionPanel from "../components/SubscriptionPanel";

function DashboardPage({ user, setUser }) {
  const [profile, setProfile] = useState(user || null);
  const [charities, setCharities] = useState([]);
  const [drawHistory, setDrawHistory] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);
  const [editingScore, setEditingScore] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingState, setLoadingState] = useState({
    score: false,
    charity: false,
    subscription: false,
    proof: null
  });

  const fetchDashboardData = async () => {
    const [profileResponse, charitiesResponse, drawHistoryResponse, latestDrawResponse] = await Promise.all([
      api.get("/auth/me"),
      api.get("/charities"),
      api.get("/draw/history"),
      api.get("/draw/latest")
    ]);

    setProfile(profileResponse.data.user);
    setUser(profileResponse.data.user);
    setCharities(charitiesResponse.data.charities || []);
    setDrawHistory(drawHistoryResponse.data.draws || []);
    setLatestDraw(latestDrawResponse.data.draw || null);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      setMessage("Payment completed. Your Razorpay verification is being processed.");
    }
    if (params.get("billing") === "cancelled") {
      setMessage("Payment was cancelled.");
    }

    fetchDashboardData().catch(() => {
      localStorage.removeItem("greendraw-token");
      window.location.href = "/login";
    });
  }, []);

  const updateLoading = (key, value) => {
    setLoadingState((previous) => ({ ...previous, [key]: value }));
  };

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
      document.body.appendChild(script);
    });

  const handleScoreSubmit = async (payload) => {
    updateLoading("score", true);
    setMessage("");

    try {
      const response = payload.id
        ? await api.put(`/scores/${payload.id}`, payload)
        : await api.post("/scores", payload);
      setProfile((previous) => ({ ...previous, scores: response.data.scores || previous.scores }));
      setEditingScore(null);
      setMessage(payload.id ? "Score updated." : "Score added.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save score.");
    } finally {
      updateLoading("score", false);
    }
  };

  const handleSaveCharity = async (payload) => {
    updateLoading("charity", true);
    setMessage("");

    try {
      await api.post("/charities/select", payload);
      await fetchDashboardData();
      setMessage("Charity selection updated.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save charity selection.");
    } finally {
      updateLoading("charity", false);
    }
  };

  const handleSubscribe = async (plan) => {
    updateLoading("subscription", true);
    setMessage("");

    try {
      await loadRazorpayScript();
      const response = await api.post("/subscribe", { plan });
      const { razorpayKeyId, order, checkout } = response.data;

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: checkout.name,
        description: checkout.description,
        order_id: order.id,
        prefill: checkout.prefill,
        notes: checkout.notes,
        handler: async (paymentResponse) => {
          await api.post("/payments/verify", {
            ...paymentResponse,
            plan
          });
          await fetchDashboardData();
          setMessage("Payment completed and subscription activated.");
        },
        modal: {
          ondismiss: () => {
            setMessage("Payment was cancelled.");
          }
        },
        theme: {
          color: "#10b981"
        }
      });

      razorpay.open();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update subscription.");
    } finally {
      updateLoading("subscription", false);
    }
  };

  const handleCancelSubscription = async () => {
    updateLoading("subscription", true);
    setMessage("");

    try {
      await api.post("/subscribe/cancel");
      await fetchDashboardData();
      setMessage("Subscription cancelled.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to cancel subscription.");
    } finally {
      updateLoading("subscription", false);
    }
  };

  const handleUploadProof = async ({ winnerId, proofData, proofFilename }) => {
    updateLoading("proof", winnerId);
    setMessage("");

    try {
      await api.post(`/winners/${winnerId}/proof`, { proofData, proofFilename });
      await fetchDashboardData();
      setMessage("Winner proof uploaded for review.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to upload proof.");
    } finally {
      updateLoading("proof", null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-400">Subscriber dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Welcome, {profile?.name || "member"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Manage your profile, rolling scores, charity contribution, monthly draw participation, and winner proof uploads.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="text-sm text-slate-400">Subscription</div>
              <div className="mt-2 font-medium text-white">{profile?.subscription?.status || "inactive"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="text-sm text-slate-400">Renewal</div>
              <div className="mt-2 font-medium text-white">{profile?.subscription?.renewal_date?.slice(0, 10) || "N/A"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="text-sm text-slate-400">Draws entered</div>
              <div className="mt-2 font-medium text-white">{profile?.stats?.drawsEntered || 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="text-sm text-slate-400">Total won</div>
              <div className="mt-2 font-medium text-white">${Number(profile?.stats?.totalWon || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
        {message ? (
          <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
            {message}
          </div>
        ) : null}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-8">
          <ScoreForm
            onSubmit={handleScoreSubmit}
            loading={loadingState.score}
            editingScore={editingScore}
            onCancelEdit={() => setEditingScore(null)}
          />
          <ScoreList scores={profile?.scores || []} onEdit={setEditingScore} />
          <DrawResultDisplay
            latestDraw={latestDraw}
            drawHistory={drawHistory}
            onUploadProof={handleUploadProof}
            uploadingWinnerId={loadingState.proof}
          />
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-white">Participation summary</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>Upcoming draw: {profile?.stats?.upcomingDrawDate?.slice(0, 10) || "TBD"}</p>
              <p>Pending verification items: {profile?.stats?.pendingVerification || 0}</p>
              <p>Pending payments: {profile?.stats?.pendingPayments || 0}</p>
              <p>Profile email: {profile?.email}</p>
            </div>
          </div>
          <CharitySelector
            charities={charities}
            currentSelection={profile}
            onSave={handleSaveCharity}
            loading={loadingState.charity}
          />
          <SubscriptionPanel
            currentSubscription={profile?.subscription}
            onSubscribe={handleSubscribe}
            onCancel={handleCancelSubscription}
            loading={loadingState.subscription}
          />
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
