import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import MenuEditorTab from "../components/admin/MenuEditorTab";
import PortalPagesEditorTab from "../components/admin/PortalPagesEditorTab";
import TeamMembersAdminTab from "../components/admin/TeamMembersAdminTab";
import StaffAdminTab from "../components/admin/StaffAdminTab";
import EventsAdminTab from "../components/admin/EventsAdminTab";
import AlumniAdminTab from "../components/admin/AlumniAdminTab";
import VisitAnalyticsTab from "../components/admin/VisitAnalyticsTab";
import FeedbackTab from "../components/admin/FeedbackTab";

export default function AdminDashboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("menu");

  // Only coaches and portal admins can access
  if (!user || (!profile.isCoach && !profile.isPortalAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="admin-dashboard-page">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage menu items, pages, team members, and alumni</p>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          Menu Items {profile.isCoach ? "(Coach)" : ""}
        </button>
        {profile.isPortalAdmin && (
          <>
            <button
              className={`admin-tab-btn ${activeTab === "pages" ? "active" : ""}`}
              onClick={() => setActiveTab("pages")}
            >
              Portal Pages
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "team" ? "active" : ""}`}
              onClick={() => setActiveTab("team")}
            >
              Team Members
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "staff" ? "active" : ""}`}
              onClick={() => setActiveTab("staff")}
            >
              Coaches &amp; Mentors
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "alumni" ? "active" : ""}`}
              onClick={() => setActiveTab("alumni")}
            >
              Alumni
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "story" ? "active" : ""}`}
              onClick={() => setActiveTab("story")}
            >
              Team Story
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "visits" ? "active" : ""}`}
              onClick={() => setActiveTab("visits")}
            >
              Visit Analytics
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "feedback" ? "active" : ""}`}
              onClick={() => setActiveTab("feedback")}
            >
              Feedback
            </button>
          </>
        )}
      </div>

      <div className="admin-content">
        {activeTab === "menu" && <MenuEditorTab isCoach={profile.isCoach} />}
        {activeTab === "pages" && profile.isPortalAdmin && <PortalPagesEditorTab />}
        {activeTab === "team" && profile.isPortalAdmin && <TeamMembersAdminTab />}
        {activeTab === "staff" && profile.isPortalAdmin && <StaffAdminTab />}
        {activeTab === "alumni" && profile.isPortalAdmin && <AlumniAdminTab />}
        {activeTab === "story" && profile.isPortalAdmin && <EventsAdminTab />}
        {activeTab === "visits" && profile.isPortalAdmin && <VisitAnalyticsTab />}
        {activeTab === "feedback" && profile.isPortalAdmin && <FeedbackTab />}
      </div>
    </section>
  );
}
