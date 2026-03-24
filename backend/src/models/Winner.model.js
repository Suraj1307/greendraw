const WinnerModel = {
  table: "winners",
  fields: {
    id: "uuid",
    draw_id: "uuid",
    user_id: "uuid",
    matched_count: "integer",
    prize_tier: "text",
    matched_numbers: "integer[]",
    prize_amount: "numeric",
    verification_status: "text",
    payment_status: "text",
    proof_filename: "text",
    proof_url: "text",
    proof_storage_path: "text",
    review_notes: "text",
    reviewed_at: "timestamp",
    reviewed_by: "uuid",
    created_at: "timestamp"
  }
};

export default WinnerModel;
