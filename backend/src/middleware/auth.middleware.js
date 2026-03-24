import { supabase } from "../services/supabase.js";
import { verifyToken } from "../services/token.js";
import { normalizeSubscription } from "../services/subscription.js";

const getLatestSubscription = async (userId) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan, status, amount, payment_provider, payment_reference, started_at, renewal_date, cancelled_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeSubscription(data);
};

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, is_active, charity_id, charity_percentage, created_at")
      .eq("id", decoded.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user || !user.is_active) {
      return res.status(401).json({ message: "User account is unavailable." });
    }

    req.user = user;
    req.subscription = await getLatestSubscription(user.id);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
};

export const requireActiveSubscription = (req, res, next) => {
  if (!req.subscription?.isActive) {
    return res.status(403).json({
      message: "An active subscription is required for this action.",
      subscription: req.subscription
    });
  }

  return next();
};
