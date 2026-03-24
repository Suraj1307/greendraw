import { supabase } from "../services/supabase.js";

const MAX_SCORES = 5;
const MIN_SCORE = 1;
const MAX_SCORE = 45;

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const fetchScoresForUser = async (userId) => {
  const { data: scores, error } = await supabase
    .from("scores")
    .select("id, value, played_at, created_at")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return scores;
};

export const addScore = async (req, res) => {
  try {
    const value = Number(req.body.value);
    const playedAt = req.body.playedAt;

    if (!Number.isInteger(value) || value < MIN_SCORE || value > MAX_SCORE) {
      return res.status(400).json({ message: "Score must be an integer between 1 and 45." });
    }

    if (!playedAt || !isValidDate(playedAt)) {
      return res.status(400).json({ message: "A valid score date is required." });
    }

    const { data: existingScores, error: fetchError } = await supabase
      .from("scores")
      .select("id, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if ((existingScores || []).length >= MAX_SCORES) {
      const oldestScore = existingScores[0];
      const { error: deleteError } = await supabase.from("scores").delete().eq("id", oldestScore.id);

      if (deleteError) {
        throw deleteError;
      }
    }

    const { data: newScore, error: insertError } = await supabase
      .from("scores")
      .insert({
        user_id: req.user.id,
        value,
        played_at: new Date(playedAt).toISOString().slice(0, 10)
      })
      .select("id, value, played_at, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    const scores = await fetchScoresForUser(req.user.id);

    return res.status(201).json({
      message: "Score added successfully.",
      score: newScore,
      scores
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to add score.",
      error: error.message
    });
  }
};

export const updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const value = Number(req.body.value);
    const playedAt = req.body.playedAt;

    if (!Number.isInteger(value) || value < MIN_SCORE || value > MAX_SCORE) {
      return res.status(400).json({ message: "Score must be an integer between 1 and 45." });
    }

    if (!playedAt || !isValidDate(playedAt)) {
      return res.status(400).json({ message: "A valid score date is required." });
    }

    const { data: existingScore, error: existingScoreError } = await supabase
      .from("scores")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (existingScoreError) {
      throw existingScoreError;
    }

    if (!existingScore) {
      return res.status(404).json({ message: "Score not found." });
    }

    if (existingScore.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You cannot edit this score." });
    }

    const { data: score, error } = await supabase
      .from("scores")
      .update({
        value,
        played_at: new Date(playedAt).toISOString().slice(0, 10)
      })
      .eq("id", id)
      .select("id, user_id, value, played_at, created_at")
      .single();

    if (error) {
      throw error;
    }

    const scores = await fetchScoresForUser(score.user_id);

    return res.json({
      message: "Score updated successfully.",
      score,
      scores
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update score.",
      error: error.message
    });
  }
};

export const getScores = async (req, res) => {
  try {
    const scores = await fetchScoresForUser(req.user.id);
    return res.json({ scores });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch scores.",
      error: error.message
    });
  }
};
