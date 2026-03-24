import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { signup, login, getProfile } from "./controllers/auth.controller.js";
import { addScore, getScores, updateScore } from "./controllers/score.controller.js";
import {
  runDraw,
  getDrawHistoryForUser,
  getLatestPublishedDraw,
  uploadWinnerProof
} from "./controllers/draw.controller.js";
import {
  subscribe,
  cancelSubscription,
  verifyPayment
} from "./controllers/subscription.controller.js";
import {
  getCharities,
  getCharityById,
  selectCharity,
  createCharity,
  updateCharity,
  deleteCharity
} from "./controllers/charity.controller.js";
import {
  getAdminOverview,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserSubscription,
  getAdminWinners,
  updateAdminWinner
} from "./controllers/admin.controller.js";
import {
  authMiddleware,
  requireActiveSubscription,
  requireAdmin
} from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : "*"
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/auth/signup", signup);
app.post("/auth/login", login);
app.get("/auth/me", authMiddleware, getProfile);

app.get("/charities", getCharities);
app.get("/charities/:id", getCharityById);
app.get("/draw/latest", getLatestPublishedDraw);

app.post("/scores", authMiddleware, requireActiveSubscription, addScore);
app.put("/scores/:id", authMiddleware, requireActiveSubscription, updateScore);
app.get("/scores", authMiddleware, requireActiveSubscription, getScores);

app.post("/draw/run", authMiddleware, requireAdmin, runDraw);
app.get("/draw/history", authMiddleware, getDrawHistoryForUser);
app.post("/winners/:id/proof", authMiddleware, uploadWinnerProof);

app.post("/charities/select", authMiddleware, selectCharity);

app.post("/subscribe", authMiddleware, subscribe);
app.post("/subscribe/cancel", authMiddleware, cancelSubscription);
app.post("/payments/verify", authMiddleware, verifyPayment);

app.get("/admin/overview", authMiddleware, requireAdmin, getAdminOverview);
app.get("/admin/users", authMiddleware, requireAdmin, getAdminUsers);
app.patch("/admin/users/:id", authMiddleware, requireAdmin, updateAdminUser);
app.post("/admin/users/:id/subscription", authMiddleware, requireAdmin, updateAdminUserSubscription);
app.get("/admin/winners", authMiddleware, requireAdmin, getAdminWinners);
app.patch("/admin/winners/:id", authMiddleware, requireAdmin, updateAdminWinner);
app.post("/admin/charities", authMiddleware, requireAdmin, createCharity);
app.patch("/admin/charities/:id", authMiddleware, requireAdmin, updateCharity);
app.delete("/admin/charities/:id", authMiddleware, requireAdmin, deleteCharity);
app.put("/admin/scores/:id", authMiddleware, requireAdmin, updateScore);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`GreenDraw backend listening on port ${port}`);
});
