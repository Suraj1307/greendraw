import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CharitiesPage from "./pages/CharitiesPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("greendraw-token");

    if (!token) {
      setBooting(false);
      return;
    }

    api.get("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem("greendraw-token");
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("greendraw-token");
    setUser(null);
  };

  if (booting) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/login" element={<AuthPage mode="login" onAuthSuccess={setUser} />} />
        <Route path="/signup" element={<AuthPage mode="signup" onAuthSuccess={setUser} />} />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={user?.role === "admin" ? <AdminPage /> : <Navigate to="/dashboard" replace />}
        />
      </Routes>
    </div>
  );
}

export default App;
