import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import TeamPage from "./pages/TeamPage";
import SchedulePage from "./pages/SchedulePage";
import SponsorshipPage from "./pages/SponsorshipPage";
import ResourcesPage from "./pages/ResourcesPage";
import FeedbackPage from "./pages/FeedbackPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="sponsorship" element={<SponsorshipPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route
              path="dashboard"
              element={(
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="admin"
              element={(
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route path="index.html" element={<Navigate to="/" replace />} />
            <Route path="about.html" element={<Navigate to="/about" replace />} />
            <Route path="team.html" element={<Navigate to="/team" replace />} />
            <Route path="schedule.html" element={<Navigate to="/schedule" replace />} />
            <Route path="sponsorship.html" element={<Navigate to="/sponsorship" replace />} />
            <Route path="resources.html" element={<Navigate to="/resources" replace />} />
            <Route path="feedback.html" element={<Navigate to="/feedback" replace />} />
            <Route path="login.html" element={<Navigate to="/login" replace />} />
            <Route path="dashboard.html" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
