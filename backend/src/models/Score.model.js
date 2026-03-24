const ScoreModel = {
  table: "scores",
  fields: {
    id: "uuid",
    user_id: "uuid",
    value: "integer",
    played_at: "date",
    created_at: "timestamp"
  }
};

export default ScoreModel;
