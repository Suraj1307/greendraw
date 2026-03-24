const SubscriptionModel = {
  table: "subscriptions",
  fields: {
    id: "uuid",
    user_id: "uuid",
    plan: "text",
    status: "text",
    amount: "numeric",
    payment_provider: "text",
    payment_reference: "text",
    started_at: "timestamp",
    renewal_date: "timestamp",
    cancelled_at: "timestamp"
  }
};

export default SubscriptionModel;
