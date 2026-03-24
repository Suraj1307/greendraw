const DrawModel = {
  table: "draws",
  fields: {
    id: "uuid",
    mode: "text",
    status: "text",
    draw_month: "date",
    numbers: "integer[]",
    active_subscriber_count: "integer",
    prize_pool_total: "numeric",
    tier_5_pool: "numeric",
    tier_4_pool: "numeric",
    tier_3_pool: "numeric",
    jackpot_rollover_in: "numeric",
    jackpot_rollover_out: "numeric",
    published_at: "timestamp",
    created_at: "timestamp"
  }
};

export default DrawModel;
