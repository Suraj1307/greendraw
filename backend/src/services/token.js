import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be defined.");
  }

  return process.env.JWT_SECRET;
};

export const signToken = (payload) => jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
export const verifyToken = (token) => jwt.verify(token, getJwtSecret());
