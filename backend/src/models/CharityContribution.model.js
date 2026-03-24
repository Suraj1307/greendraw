const CharityContributionModel = {
  table: "charity_contributions",
  fields: {
    id: "uuid",
    user_id: "uuid",
    charity_id: "uuid",
    subscription_id: "uuid",
    amount: "numeric",
    percentage: "integer",
    created_at: "timestamp"
  }
};

export default CharityContributionModel;
