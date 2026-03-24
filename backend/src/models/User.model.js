const UserModel = {
  table: "users",
  fields: {
    id: "uuid",
    name: "text",
    email: "text",
    password_hash: "text",
    role: "text",
    is_active: "boolean",
    charity_id: "uuid",
    charity_percentage: "integer",
    last_login_at: "timestamp",
    created_at: "timestamp"
  }
};

export default UserModel;
