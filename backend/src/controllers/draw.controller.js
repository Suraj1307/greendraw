import { supabase, supabaseAdmin } from "../services/supabase.js";
import { buildWinnerSummary, generateDrawNumbers } from "../services/drawEngine.js";
import { getMonthlyPrizeContribution, normalizeSubscription } from "../services/subscription.js";
import { logEmail } from "../services/email.js";

const TIER_SPLITS = {
  "5-match": 0.4,
  "4-match": 0.35,
  "3-match": 0.25
};
const drawSimulations = new Map();

const getMonthKey = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
};

const fetchLatestSubscriptions = async () => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan, status, amount, payment_provider, payment_reference, started_at, renewal_date, cancelled_at")
    .order("started_at", { ascending: false });

  if (error) {
    throw error;
  }

  const latestByUser = new Map();
  for (const subscription of data || []) {
    if (!latestByUser.has(subscription.user_id)) {
      latestByUser.set(subscription.user_id, normalizeSubscription(subscription));
    }
  }

  return latestByUser;
};

const fetchEligibleParticipants = async () => {
  const [usersResponse, scoresResponse] = await Promise.all([
    supabase.from("users").select("id, name, email, charity_percentage, is_active").eq("is_active", true),
    supabase.from("scores").select("id, user_id, value, played_at, created_at").order("created_at", { ascending: false })
  ]);

  if (usersResponse.error) {
    throw usersResponse.error;
  }

  if (scoresResponse.error) {
    throw scoresResponse.error;
  }

  const subscriptions = await fetchLatestSubscriptions();
  const scoresByUser = new Map();

  for (const score of scoresResponse.data || []) {
    if (!scoresByUser.has(score.user_id)) {
      scoresByUser.set(score.user_id, []);
    }

    if (scoresByUser.get(score.user_id).length < 5) {
      scoresByUser.get(score.user_id).push(score.value);
    }
  }

  return (usersResponse.data || [])
    .map((user) => ({
      ...user,
      subscription: subscriptions.get(user.id) || normalizeSubscription(null),
      scoreValues: scoresByUser.get(user.id) || []
    }))
    .filter((user) => user.subscription.isActive && user.scoreValues.length > 0);
};

const fetchLastPublishedDraw = async () => {
  const { data, error } = await supabase
    .from("draws")
    .select("id, jackpot_rollover_out")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const parseCustomNumbers = (customNumbers) => {
  if (!customNumbers) {
    return null;
  }

  const values = Array.isArray(customNumbers)
    ? customNumbers
    : String(customNumbers)
        .split(",")
        .map((value) => Number(value.trim()));

  const normalized = values.filter((value) => Number.isInteger(value));
  const unique = [...new Set(normalized)].sort((a, b) => a - b);

  if (unique.length !== 5 || unique.some((value) => value < 1 || value > 45)) {
    throw new Error("Custom draw numbers must contain exactly 5 unique integers between 1 and 45.");
  }

  return unique;
};

const buildDrawOutcome = async ({ mode, drawMonth, customNumbers = null }) => {
  const participants = await fetchEligibleParticipants();

  if (participants.length === 0) {
    throw new Error("No active subscribers with eligible scores are available for this draw.");
  }

  const allScores = participants.flatMap((participant) =>
    participant.scoreValues.map((value) => ({ user_id: participant.id, value }))
  );
  const drawNumbers = customNumbers || generateDrawNumbers(mode, allScores);
  const lastDraw = await fetchLastPublishedDraw();
  const rolloverIn = Number(lastDraw?.jackpot_rollover_out || 0);
  const prizePoolTotal = participants.reduce(
    (sum, participant) => sum + getMonthlyPrizeContribution(participant.subscription),
    0
  );
  const tierPools = {
    "5-match": Number((prizePoolTotal * TIER_SPLITS["5-match"] + rolloverIn).toFixed(2)),
    "4-match": Number((prizePoolTotal * TIER_SPLITS["4-match"]).toFixed(2)),
    "3-match": Number((prizePoolTotal * TIER_SPLITS["3-match"]).toFixed(2))
  };

  const winnerSummaries = participants
    .map((participant) =>
      buildWinnerSummary({
        userId: participant.id,
        userName: participant.name,
        userEmail: participant.email,
        drawNumbers,
        userNumbers: participant.scoreValues
      })
    )
    .filter((winner) => winner.matchedCount >= 3);

  const winnersByTier = {
    "5-match": winnerSummaries.filter((winner) => winner.prizeTier === "5-match"),
    "4-match": winnerSummaries.filter((winner) => winner.prizeTier === "4-match"),
    "3-match": winnerSummaries.filter((winner) => winner.prizeTier === "3-match")
  };

  const payoutByTier = {
    "5-match": winnersByTier["5-match"].length > 0 ? Number((tierPools["5-match"] / winnersByTier["5-match"].length).toFixed(2)) : 0,
    "4-match": winnersByTier["4-match"].length > 0 ? Number((tierPools["4-match"] / winnersByTier["4-match"].length).toFixed(2)) : 0,
    "3-match": winnersByTier["3-match"].length > 0 ? Number((tierPools["3-match"] / winnersByTier["3-match"].length).toFixed(2)) : 0
  };

  const winners = winnerSummaries.map((winner) => ({
    ...winner,
    prizeAmount: payoutByTier[winner.prizeTier] || 0,
    verificationStatus: "pending_review",
    paymentStatus: "pending"
  }));

  const jackpotRolloverOut = winnersByTier["5-match"].length === 0 ? tierPools["5-match"] : 0;

  return {
    mode,
    drawMonth: getMonthKey(drawMonth),
    drawNumbers,
    participants,
    winners,
    activeSubscriberCount: participants.length,
    prizePoolTotal: Number(prizePoolTotal.toFixed(2)),
    tierPools,
    jackpotRolloverIn: rolloverIn,
    jackpotRolloverOut: Number(jackpotRolloverOut.toFixed(2))
  };
};

const getSimulationKey = (drawMonth) => drawMonth;

const storeSimulation = (outcome) => {
  drawSimulations.set(getSimulationKey(outcome.drawMonth), outcome);
};

const getStoredSimulation = (drawMonth) => drawSimulations.get(getSimulationKey(drawMonth)) || null;

export const runDraw = async (req, res) => {
  try {
    const mode = req.body.mode === "algorithmic" ? "algorithmic" : "random";
    const publish = Boolean(req.body.publish);
    const drawMonth = getMonthKey(req.body.drawMonth);
    const customNumbers = parseCustomNumbers(req.body.customNumbers);
    const publishLastSimulation = Boolean(req.body.publishLastSimulation);

    const existingDrawResponse = await supabase.from("draws").select("id").eq("draw_month", drawMonth).maybeSingle();
    if (existingDrawResponse.error) {
      throw existingDrawResponse.error;
    }
    if (publish && existingDrawResponse.data) {
      return res.status(409).json({ message: "A published draw already exists for that month." });
    }

    let outcome;

    if (publish && publishLastSimulation) {
      outcome = getStoredSimulation(drawMonth);
      if (!outcome) {
        return res.status(400).json({ message: "No stored simulation exists for that month." });
      }
    } else {
      outcome = await buildDrawOutcome({ mode, drawMonth, customNumbers });
    }

    if (!publish) {
      storeSimulation(outcome);

      return res.json({
        message: "Simulation completed.",
        simulation: true,
        storedForPublish: true,
        draw: {
          mode: outcome.mode,
          draw_month: outcome.drawMonth,
          numbers: outcome.drawNumbers,
          active_subscriber_count: outcome.activeSubscriberCount,
          prize_pool_total: outcome.prizePoolTotal,
          tier_5_pool: outcome.tierPools["5-match"],
          tier_4_pool: outcome.tierPools["4-match"],
          tier_3_pool: outcome.tierPools["3-match"],
          jackpot_rollover_in: outcome.jackpotRolloverIn,
          jackpot_rollover_out: outcome.jackpotRolloverOut
        },
        winners: outcome.winners
      });
    }

    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .insert({
        mode: outcome.mode,
        status: "published",
        draw_month: outcome.drawMonth,
        numbers: outcome.drawNumbers,
        active_subscriber_count: outcome.activeSubscriberCount,
        prize_pool_total: outcome.prizePoolTotal,
        tier_5_pool: outcome.tierPools["5-match"],
        tier_4_pool: outcome.tierPools["4-match"],
        tier_3_pool: outcome.tierPools["3-match"],
        jackpot_rollover_in: outcome.jackpotRolloverIn,
        jackpot_rollover_out: outcome.jackpotRolloverOut,
        published_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (drawError) {
      throw drawError;
    }

    let storedWinners = [];
    if (outcome.winners.length > 0) {
      const { data: createdWinners, error: winnersError } = await supabase
        .from("winners")
        .insert(
          outcome.winners.map((winner) => ({
            draw_id: draw.id,
            user_id: winner.userId,
            matched_count: winner.matchedCount,
            prize_tier: winner.prizeTier,
            matched_numbers: winner.matchedNumbers,
            prize_amount: winner.prizeAmount,
            verification_status: winner.verificationStatus,
            payment_status: winner.paymentStatus
          }))
        )
        .select("id, user_id, matched_count, prize_tier, matched_numbers, prize_amount, verification_status, payment_status");

      if (winnersError) {
        throw winnersError;
      }

      storedWinners = createdWinners;
    }

    await Promise.all(
      outcome.winners.map((winner) =>
        logEmail({
          recipientEmail: winner.userEmail,
          eventType: "draw-result",
          subject: `GreenDraw result for ${outcome.drawMonth}`,
          body: `${winner.userName}, you hit ${winner.matchedCount} matches and earned ${winner.prizeAmount}.`
        })
      )
    );

    return res.status(201).json({
      message: "Draw published successfully.",
      simulation: false,
      draw,
      winners: storedWinners
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to run draw.",
      error: error.message
    });
  }
};

export const getDrawHistoryForUser = async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from("winners")
      .select("id, matched_count, prize_tier, matched_numbers, prize_amount, verification_status, payment_status, proof_filename, proof_url, created_at, draws(id, draw_month, numbers, prize_pool_total, published_at)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ draws: winners });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch draw history.",
      error: error.message
    });
  }
};

export const getLatestPublishedDraw = async (_req, res) => {
  try {
    const { data: draw, error } = await supabase
      .from("draws")
      .select("id, draw_month, mode, numbers, prize_pool_total, active_subscriber_count, jackpot_rollover_out, published_at")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return res.json({ draw });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch the latest draw.",
      error: error.message
    });
  }
};

export const uploadWinnerProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { proofData, proofFilename } = req.body;

    if (!proofData || !proofFilename) {
      return res.status(400).json({ message: "proofData and proofFilename are required." });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: "Supabase service role key is required for proof uploads." });
    }

    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select("id, user_id, draw_id")
      .eq("id", id)
      .maybeSingle();

    if (winnerError) {
      throw winnerError;
    }

    if (!winner || winner.user_id !== req.user.id) {
      return res.status(404).json({ message: "Winner record not found." });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "winner-proofs";
    const matches = proofData.match(/^data:(.+);base64,(.+)$/);

    if (!matches) {
      return res.status(400).json({ message: "proofData must be a valid base64 data URL." });
    }

    const mimeType = matches[1];
    const base64Body = matches[2];
    const storagePath = `${req.user.id}/${winner.draw_id}/${Date.now()}-${proofFilename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fileBuffer = Buffer.from(base64Body, "base64");

    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl }
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);

    const { data: updatedWinner, error } = await supabase
      .from("winners")
      .update({
        proof_filename: proofFilename,
        proof_url: publicUrl,
        proof_storage_path: storagePath,
        verification_status: "pending_review",
        payment_status: "pending"
      })
      .eq("id", id)
      .select("id, proof_filename, proof_url, verification_status, payment_status")
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      message: "Winner proof uploaded successfully.",
      winner: updatedWinner
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to upload proof.",
      error: error.message
    });
  }
};
