import bcrypt from "bcryptjs";
import { supabase } from "../services/supabase.js";
import { logEmail } from "../services/email.js";
import { signToken } from "../services/token.js";

const getPublicUserFields = () =>
  "id, name, email, role, charity_id, charity_percentage, created_at, last_login_at";

const getLatestSubscriptionForUser = async (userId) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, plan, status, amount, payment_provider, payment_reference, started_at, renewal_date, cancelled_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const getProfilePayload = async (userId) => {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(`${getPublicUserFields()}, charities(id, name, description, image_url, upcoming_event, featured)`)
    .eq("id", userId)
    .single();

  if (userError) {
    throw userError;
  }

  const subscription = await getLatestSubscriptionForUser(userId);

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("id, value, played_at, created_at")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (scoresError) {
    throw scoresError;
  }

  const { data: winners, error: winnersError } = await supabase
    .from("winners")
    .select("id, prize_amount, payment_status, verification_status, created_at")
    .eq("user_id", userId);

  if (winnersError) {
    throw winnersError;
  }

  const { count: drawsEnteredCount, error: drawsCountError } = await supabase
    .from("draws")
    .select("id", { count: "exact", head: true });

  if (drawsCountError) {
    throw drawsCountError;
  }

  const totalWon = (winners || []).reduce((sum, winner) => sum + Number(winner.prize_amount || 0), 0);
  const pendingPayments = (winners || []).filter((winner) => winner.payment_status === "pending").length;
  const pendingVerification = (winners || []).filter(
    (winner) => winner.verification_status === "pending_review"
  ).length;

  return {
    ...user,
    subscription,
    scores,
    stats: {
      drawsEntered: drawsEnteredCount || 0,
      upcomingDrawDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      totalWon,
      pendingPayments,
      pendingVerification
    }
  };
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, charityId, charityPercentage = 10 } = req.body;

    if (!name || !email || !password || !charityId) {
      return res.status(400).json({
        message: "Name, email, password, charityId, and charityPercentage are required."
      });
    }

    if (Number(charityPercentage) < 10 || Number(charityPercentage) > 100) {
      return res.status(400).json({ message: "Charity contribution must be between 10% and 100%." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUserError) {
      throw existingUserError;
    }

    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("id")
      .eq("id", charityId)
      .maybeSingle();

    if (charityError) {
      throw charityError;
    }

    if (!charity) {
      return res.status(404).json({ message: "Selected charity was not found." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password_hash,
        role: "subscriber",
        charity_id: charityId,
        charity_percentage: Number(charityPercentage)
      })
      .select(getPublicUserFields())
      .single();

    if (error) {
      throw error;
    }

    await logEmail({
      recipientEmail: normalizedEmail,
      eventType: "signup",
      subject: "Welcome to GreenDraw",
      body: `Hi ${name.trim()}, your GreenDraw account is ready.`
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    return res.status(201).json({ token, user });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to sign up user.",
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from("users")
      .select(`${getPublicUserFields()}, password_hash`)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      charity_id: user.charity_id,
      charity_percentage: user.charity_percentage,
      created_at: user.created_at,
      last_login_at: new Date().toISOString()
    };

    return res.json({ token, user: sanitizedUser });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to log in.",
      error: error.message
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await getProfilePayload(req.user.id);
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch profile.",
      error: error.message
    });
  }
};

export const getProfilePayloadForUser = getProfilePayload;
