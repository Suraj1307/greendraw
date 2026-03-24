import { supabase } from "../services/supabase.js";
import {
  createSubscriptionPayload,
  getCharityContributionAmount,
  normalizeSubscription
} from "../services/subscription.js";
import { logEmail } from "../services/email.js";
import {
  getRazorpayKeyId,
  requireRazorpay,
  verifyRazorpaySignature
} from "../services/razorpay.js";

const allowedPlans = ["monthly", "yearly"];

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

  return data;
};

const recordCharityContribution = async ({ userId, subscription, charityId, charityPercentage }) => {
  if (!charityId) {
    return;
  }

  const amount = getCharityContributionAmount(subscription, charityPercentage);

  await supabase.from("charity_contributions").insert({
    user_id: userId,
    charity_id: charityId,
    subscription_id: subscription.id,
    amount,
    percentage: Number(charityPercentage)
  });
};

export const subscribe = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!allowedPlans.includes(plan)) {
      return res.status(400).json({ message: "Plan must be monthly or yearly." });
    }

    const razorpay = requireRazorpay();
    const payload = createSubscriptionPayload(plan);
    const amountInPaise = Math.round(Number(payload.amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `gd_${req.user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: req.user.id,
        plan,
        charityId: req.user.charity_id || "",
        charityPercentage: String(req.user.charity_percentage || 10)
      }
    });

    return res.status(201).json({
      message: "Razorpay order created.",
      razorpayKeyId: getRazorpayKeyId(),
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      checkout: {
        name: "GreenDraw",
        description: `${plan} subscription`,
        prefill: {
          name: req.user.name,
          email: req.user.email
        },
        notes: {
          userId: req.user.id,
          plan
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create Razorpay order.",
      error: error.message
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await getLatestSubscription(req.user.id);

    if (!subscription) {
      return res.status(404).json({ message: "No subscription found to cancel." });
    }

    const { data: updatedSubscription, error } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString()
      })
      .eq("id", subscription.id)
      .select("id, user_id, plan, status, amount, payment_provider, payment_reference, started_at, renewal_date, cancelled_at")
      .single();

    if (error) {
      throw error;
    }

    await logEmail({
      recipientEmail: req.user.email,
      eventType: "subscription-cancelled",
      subject: "Your GreenDraw subscription has been cancelled",
      body: `Your ${subscription.plan} subscription is now cancelled.`
    });

    return res.json({
      message: "Subscription cancelled.",
      subscription: normalizeSubscription(updatedSubscription)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to cancel subscription.",
      error: error.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      plan
    } = req.body;

    if (!orderId || !paymentId || !signature || !allowedPlans.includes(plan)) {
      return res.status(400).json({ message: "Payment verification payload is incomplete." });
    }

    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid Razorpay payment signature." });
    }

    const payload = createSubscriptionPayload(plan);
    payload.payment_provider = "razorpay";
    payload.payment_reference = paymentId;

    const { data: insertedSubscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: req.user.id,
        ...payload
      })
      .select("id, user_id, plan, status, amount, payment_provider, payment_reference, started_at, renewal_date, cancelled_at")
      .single();

    if (error) {
      throw error;
    }

    await recordCharityContribution({
      userId: req.user.id,
      subscription: insertedSubscription,
      charityId: req.user.charity_id,
      charityPercentage: req.user.charity_percentage
    });

    await logEmail({
      recipientEmail: req.user.email,
      eventType: "subscription-activated",
      subject: "Your GreenDraw subscription is active",
      body: `Hi ${req.user.name}, your ${plan} plan is active until ${insertedSubscription.renewal_date}.`
    });

    return res.json({
      message: "Payment verified successfully.",
      subscription: normalizeSubscription(insertedSubscription)
    });
  } catch (error) {
    return res.status(400).json({
      message: "Razorpay payment verification failed.",
      error: error.message
    });
  }
};
