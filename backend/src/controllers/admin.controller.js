import { supabase } from "../services/supabase.js";
import { createSubscriptionPayload, normalizeSubscription } from "../services/subscription.js";
import { logEmail } from "../services/email.js";

export const getAdminOverview = async (_req, res) => {
  try {
    const [usersCount, drawsCount, winnersResponse, contributionsResponse, subscriptionsResponse] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("draws").select("id", { count: "exact", head: true }),
      supabase.from("winners").select("prize_amount, payment_status, verification_status"),
      supabase.from("charity_contributions").select("amount"),
      supabase.from("subscriptions").select("id, user_id, plan, status, amount, started_at, renewal_date, cancelled_at").order("started_at", { ascending: false })
    ]);

    if (usersCount.error) throw usersCount.error;
    if (drawsCount.error) throw drawsCount.error;
    if (winnersResponse.error) throw winnersResponse.error;
    if (contributionsResponse.error) throw contributionsResponse.error;
    if (subscriptionsResponse.error) throw subscriptionsResponse.error;

    const latestSubscriptions = new Map();
    for (const subscription of subscriptionsResponse.data || []) {
      if (!latestSubscriptions.has(subscription.user_id)) {
        latestSubscriptions.set(subscription.user_id, normalizeSubscription(subscription));
      }
    }

    const activeSubscriptions = [...latestSubscriptions.values()].filter((subscription) => subscription.isActive).length;
    const totalPrizePaid = (winnersResponse.data || []).reduce((sum, winner) => sum + Number(winner.prize_amount || 0), 0);
    const totalCharityContribution = (contributionsResponse.data || []).reduce((sum, contribution) => sum + Number(contribution.amount || 0), 0);
    const pendingVerification = (winnersResponse.data || []).filter((winner) => winner.verification_status === "pending_review").length;

    return res.json({
      overview: {
        totalUsers: usersCount.count || 0,
        activeSubscriptions,
        totalDraws: drawsCount.count || 0,
        totalPrizePaid: Number(totalPrizePaid.toFixed(2)),
        totalCharityContribution: Number(totalCharityContribution.toFixed(2)),
        pendingVerification
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch admin overview.", error: error.message });
  }
};

export const getAdminUsers = async (_req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, is_active, charity_id, charity_percentage, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: charities, error: charitiesError } = await supabase
      .from("charities")
      .select("id, name");

    if (charitiesError) throw charitiesError;

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan, status, amount, started_at, renewal_date, cancelled_at")
      .order("started_at", { ascending: false });

    if (subscriptionsError) throw subscriptionsError;

    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("id, user_id, value, played_at, created_at")
      .order("created_at", { ascending: false });

    if (scoresError) throw scoresError;

    const latestSubscriptions = new Map();
    for (const subscription of subscriptions || []) {
      if (!latestSubscriptions.has(subscription.user_id)) {
        latestSubscriptions.set(subscription.user_id, normalizeSubscription(subscription));
      }
    }

    const scoresByUser = new Map();
    for (const score of scores || []) {
      if (!scoresByUser.has(score.user_id)) {
        scoresByUser.set(score.user_id, []);
      }
      if (scoresByUser.get(score.user_id).length < 5) {
        scoresByUser.get(score.user_id).push(score);
      }
    }

    const charityById = new Map((charities || []).map((charity) => [charity.id, charity]));

    return res.json({
      users: (users || []).map((user) => ({
        ...user,
        charity: charityById.get(user.charity_id) || null,
        subscription: latestSubscriptions.get(user.id) || normalizeSubscription(null),
        scores: scoresByUser.get(user.id) || []
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch users.", error: error.message });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, charityPercentage } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.is_active = Boolean(isActive);
    if (charityPercentage !== undefined) updates.charity_percentage = Number(charityPercentage);

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, role, is_active, charity_percentage")
      .single();

    if (error) throw error;

    return res.json({ message: "User updated.", user });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update user.", error: error.message });
  }
};

export const updateAdminUserSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status } = req.body;

    const payload = createSubscriptionPayload(plan);
    payload.status = status || "active";
    if (payload.status !== "active") {
      payload.cancelled_at = new Date().toISOString();
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: id,
        ...payload
      })
      .select("id, user_id, plan, status, amount, started_at, renewal_date, cancelled_at")
      .single();

    if (error) throw error;

    return res.status(201).json({ message: "Subscription updated.", subscription });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update subscription.", error: error.message });
  }
};

export const getAdminWinners = async (_req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from("winners")
      .select("id, draw_id, user_id, matched_count, prize_tier, prize_amount, verification_status, payment_status, proof_url, proof_filename, review_notes, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const [usersResponse, drawsResponse] = await Promise.all([
      supabase.from("users").select("id, name, email"),
      supabase.from("draws").select("id, draw_month, numbers")
    ]);

    if (usersResponse.error) throw usersResponse.error;
    if (drawsResponse.error) throw drawsResponse.error;

    const userById = new Map((usersResponse.data || []).map((user) => [user.id, user]));
    const drawById = new Map((drawsResponse.data || []).map((draw) => [draw.id, draw]));

    return res.json({
      winners: (winners || []).map((winner) => ({
        ...winner,
        user: userById.get(winner.user_id) || null,
        draw: drawById.get(winner.draw_id) || null
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch winners.", error: error.message });
  }
};

export const updateAdminWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, paymentStatus, reviewNotes } = req.body;

    const { data: winnerBefore, error: winnerBeforeError } = await supabase
      .from("winners")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (winnerBeforeError) throw winnerBeforeError;

    const { data: winnerUser, error: winnerUserError } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", winnerBefore.user_id)
      .single();

    if (winnerUserError) throw winnerUserError;

    const { data: winner, error } = await supabase
      .from("winners")
      .update({
        verification_status: verificationStatus,
        payment_status: paymentStatus,
        review_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id
      })
      .eq("id", id)
      .select("id, matched_count, prize_tier, prize_amount, verification_status, payment_status, review_notes")
      .single();

    if (error) throw error;

    await logEmail({
      recipientEmail: winnerUser.email,
      eventType: "winner-review",
      subject: "Your GreenDraw winner review has been updated",
      body: `${winnerUser.name}, your winner verification is now ${verificationStatus} and payment status is ${paymentStatus}.`
    });

    return res.json({ message: "Winner updated.", winner });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update winner.", error: error.message });
  }
};
