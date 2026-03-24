import crypto from "crypto";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpay = keyId && keySecret
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })
  : null;

export const requireRazorpay = () => {
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  return razorpay;
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is required for signature verification.");
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
};

export const getRazorpayKeyId = () => keyId;
