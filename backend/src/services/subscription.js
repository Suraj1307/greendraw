const PLAN_CONFIG = {
  monthly: {
    amount: 12,
    renewalMonths: 1
  },
  yearly: {
    amount: 120,
    renewalMonths: 12
  }
};

const PRIZE_POOL_SHARE = 0.5;

export const getPlanConfig = (plan) => PLAN_CONFIG[plan];

export const getRenewalDate = (plan, startedAt = new Date()) => {
  const config = getPlanConfig(plan);
  const renewalDate = new Date(startedAt);
  renewalDate.setMonth(renewalDate.getMonth() + config.renewalMonths);
  return renewalDate.toISOString();
};

export const normalizeSubscription = (subscription) => {
  if (!subscription) {
    return {
      status: "inactive",
      isActive: false,
      renewal_date: null
    };
  }

  const renewalDate = subscription.renewal_date ? new Date(subscription.renewal_date) : null;
  const now = new Date();
  let status = subscription.status;

  if (status === "active" && renewalDate && renewalDate < now) {
    status = "lapsed";
  }

  return {
    ...subscription,
    status,
    isActive: status === "active"
  };
};

export const createSubscriptionPayload = (plan) => {
  const config = getPlanConfig(plan);

  return {
    plan,
    status: "active",
    amount: config.amount,
    payment_provider: "razorpay",
    payment_reference: `mock_${plan}_${Date.now()}`,
    started_at: new Date().toISOString(),
    renewal_date: getRenewalDate(plan)
  };
};

export const getMonthlyPrizeContribution = (subscription) => {
  const normalized = normalizeSubscription(subscription);

  if (!normalized.isActive) {
    return 0;
  }

  if (normalized.plan === "yearly") {
    return Number((normalized.amount * PRIZE_POOL_SHARE) / 12);
  }

  return Number(normalized.amount * PRIZE_POOL_SHARE);
};

export const getCharityContributionAmount = (subscription, charityPercentage) => {
  const normalized = normalizeSubscription(subscription);

  if (!normalized.isActive) {
    return 0;
  }

  const base = normalized.plan === "yearly" ? Number(normalized.amount) / 12 : Number(normalized.amount);
  return Number((base * (Number(charityPercentage) / 100)).toFixed(2));
};
