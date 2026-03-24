# 🌱 GreenDraw

GreenDraw is a full-stack subscription-based web application where users can track performance scores, participate in monthly draws, and contribute to charitable causes.

---

## 🚀 Features

* 🔐 User Authentication (JWT-based login/signup)
* 💳 Subscription System (Razorpay integration)
* 🎯 Score Tracking (stores last 5 scores only)
* 🎲 Monthly Draw System
* 🏆 Winner Verification Flow
* ❤️ Charity Selection & Contributions
* 🧑‍💼 Admin Dashboard
* 📧 Email Notifications (Resend)

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* Supabase

### Integrations

* Razorpay (Payments)
* Resend (Email Service)

---

## 📂 Project Structure

greendraw/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   └── package.json
│
└── README.md

---

## ⚙️ Environment Variables

### Backend (.env)

PORT=4000
JWT_SECRET=your_secret

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

RESEND_API_KEY=re_xxxxx
EMAIL_FROM=[onboarding@resend.dev](mailto:onboarding@resend.dev)

ADMIN_EMAIL=[admin@greendraw.local](mailto:admin@greendraw.local)
ADMIN_PASSWORD=Admin@12345

---

### Frontend (.env)

VITE_API_URL=http://localhost:4000

---

## 🧪 Running Locally

### Backend

cd backend
npm install
npm run dev

### Frontend

cd frontend
npm install
npm run dev

---

## 🎯 How It Works

1. User signs up and selects a charity
2. User subscribes via Razorpay
3. User adds scores (maximum 5 stored)
4. User participates in monthly draw
5. Winners upload proof
6. Admin verifies and processes results

---

## 🔐 Security Features

* JWT Authentication
* Protected routes
* Secure payment verification (Razorpay signature validation)

---

## 🏆 Highlights

* Real-world subscription flow
* Admin-controlled system
* Clean architecture (MERN-style)
* Scalable backend design

---

## 📌 Author

Suraj Kumar
