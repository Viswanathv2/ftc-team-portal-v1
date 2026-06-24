import PageShell from "../components/PageShell";
import RouteLoading from "../components/RouteLoading";
import { usePortalPage } from "../hooks/usePortalPage";
import { useTrackVisit } from "../hooks/useTrackVisit";

export default function HomePage() {
  const page = usePortalPage("home");
  useTrackVisit("home");

  if (page.loading) {
    return <RouteLoading />;
  }

  return (
    <PageShell title={page.title} subtitle={page.subtitle} body={page.body}>
      <section className="landing-section">
        <h2>Explore</h2>
        <div className="quick-links-grid">
          <div className="quick-link-card"><h3>Team Story</h3><p>Read our journey and mission.</p></div>
          <div className="quick-link-card"><h3>Meet the Team</h3><p>See members and roles.</p></div>
          <div className="quick-link-card"><h3>Schedule</h3><p>Upcoming meetings and events.</p></div>
          <div className="quick-link-card"><h3>Sponsorship Needed</h3><p>Learn how to support our team.</p></div>
          <div className="quick-link-card"><h3>Resources</h3><p>Announcements and learning links.</p></div>
          <div className="quick-link-card"><h3>Team Dashboard</h3><p>Login for members and coach tools.</p></div>
        </div>
      </section>
    </PageShell>
  );
}
