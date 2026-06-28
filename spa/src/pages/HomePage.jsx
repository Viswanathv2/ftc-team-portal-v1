import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import RouteLoading from "../components/RouteLoading";
import Lightbox from "../components/Lightbox";
import { usePortalPage } from "../hooks/usePortalPage";
import { useTrackVisit } from "../hooks/useTrackVisit";
import { supabase } from "../lib/supabase";

// Placeholder hero shown until a real gallery photo is available.
const HERO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2300D4B4'/%3E%3Cstop offset='1' stop-color='%231f6feb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='600' fill='url(%23g)'/%3E%3Ctext x='600' y='310' font-family='Arial' font-size='54' fill='white' text-anchor='middle' font-weight='bold'%3EThe Architechs%3C/text%3E%3C/svg%3E";

export default function HomePage() {
  const page = usePortalPage("home");
  useTrackVisit("home");
  const [hero, setHero] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadHero() {
      const { data } = await supabase
        .from("event_media")
        .select("title,caption,event_date,media_url,media_type")
        .eq("media_type", "image")
        .order("event_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active && data) setHero(data);
    }
    loadHero();
    return () => {
      active = false;
    };
  }, []);

  if (page.loading) {
    return <RouteLoading />;
  }

  const heroUrl = hero?.media_url || HERO_PLACEHOLDER;
  const heroTitle = hero?.title || "The Architechs";

  return (
    <PageShell title={page.title} subtitle={page.subtitle} body={page.body}>
      <section className="home-hero">
        <button
          type="button"
          className="home-hero-photo"
          onClick={() => setLightboxOpen(true)}
          aria-label={`Open ${heroTitle}`}
        >
          <img src={heroUrl} alt={heroTitle} />
          <span className="home-hero-caption">
            <span className="home-hero-title">{heroTitle}</span>
            <span className="home-hero-zoom" aria-hidden="true">⤢ Click to view</span>
          </span>
        </button>
      </section>

      {/* <section className="landing-section">
        <h2>Explore</h2>
        <div className="quick-links-grid">
          <div className="quick-link-card"><h3>Team Story</h3><p>Read our journey and mission.</p></div>
          <div className="quick-link-card"><h3>Meet the Team</h3><p>See members and roles.</p></div>
          <div className="quick-link-card"><h3>Schedule</h3><p>Upcoming meetings and events.</p></div>
          <div className="quick-link-card"><h3>Sponsorship Needed</h3><p>Learn how to support our team.</p></div>
          <div className="quick-link-card"><h3>Resources</h3><p>Announcements and learning links.</p></div>
          <div className="quick-link-card"><h3>Team Dashboard</h3><p>Login for members and coach tools.</p></div>
        </div>
      </section> */}

      {lightboxOpen ? (
        <Lightbox
          items={[{
            url: heroUrl,
            type: "image",
            title: heroTitle,
            caption: hero?.caption || "",
            date: hero?.event_date || ""
          }]}
          index={0}
          onClose={() => setLightboxOpen(false)}
          onIndex={() => {}}
        />
      ) : null}
    </PageShell>
  );
}
