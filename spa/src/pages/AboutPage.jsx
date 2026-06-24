import { useEffect, useMemo, useState } from "react";
import RouteLoading from "../components/RouteLoading";
import { usePortalPage } from "../hooks/usePortalPage";
import { useTrackVisit } from "../hooks/useTrackVisit";
import { supabase } from "../lib/supabase";

const DISCIPLINES = [
  { icon: "💻", title: "Software", desc: "FTCLib, RoadRunner, OpenCV vision pipelines" },
  { icon: "🔧", title: "Mechanical", desc: "Custom drivetrain and game-specific manipulators" },
  { icon: "📐", title: "CAD & Design", desc: "OnShape assemblies with tolerance-aware modeling" },
  { icon: "🏆", title: "Competition", desc: "League play with World Championship aspirations" }
];

const EVENT_FILTERS = [
  { value: "all", label: "All" },
  { value: "game", label: "Games" },
  { value: "party", label: "Parties" },
  { value: "outreach", label: "Outreach" },
  { value: "workout", label: "Workout" },
  { value: "design", label: "Design" }
];

const TYPE_LABELS = {
  game: "Game",
  party: "Party",
  outreach: "Outreach",
  workout: "Workout",
  design: "Design",
  other: "Event"
};

export default function AboutPage() {
  const page = usePortalPage("about");
  useTrackVisit("about");
  const [media, setMedia] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [mediaFilter, setMediaFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [mediaResp, achvResp] = await Promise.all([
        supabase
          .from("event_media")
          .select("id,title,event_type,event_date,caption,media_url,media_type")
          .order("event_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("achievements")
          .select("id,season,event_name,event_date,location,score,result,sort_order")
          .order("season", { ascending: false })
          .order("sort_order", { ascending: true })
      ]);

      if (!isMounted) return;
      setMedia(Array.isArray(mediaResp.data) ? mediaResp.data : []);
      setAchievements(Array.isArray(achvResp.data) ? achvResp.data : []);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMedia = useMemo(
    () => (mediaFilter === "all" ? media : media.filter((m) => m.event_type === mediaFilter)),
    [media, mediaFilter]
  );

  const seasons = useMemo(() => {
    const grouped = new Map();
    achievements.forEach((a) => {
      if (!grouped.has(a.season)) grouped.set(a.season, []);
      grouped.get(a.season).push(a);
    });
    return Array.from(grouped.entries()).slice(0, 2);
  }, [achievements]);

  if (page.loading) {
    return <RouteLoading />;
  }

  return (
    <section className="landing-page">
      <header className="landing-header">
        <h1>{page.title || "About Our Team"}</h1>
        <p className="landing-tagline">
          {page.subtitle || "Built by students. Driven by curiosity."}
        </p>
      </header>

      <div className="landing-container">
        <section className="landing-section">
          <div className="about-eyebrow">
            <span className="about-eyebrow-line" />
            <span className="about-eyebrow-text">About Our Team</span>
          </div>

          <p className="content-box-lead">
            Architechs (FTC #25795) was founded in 2024 with a simple conviction: students
            can engineer competition-grade robots. We compete in the FIRST Tech Challenge,
            where teams design, build, program, and operate robots in alliance-format field
            matches.
          </p>
          <p>
            Every member participates across the full engineering cycle — from whiteboard
            concepts to field-ready hardware. Beyond competition, we document our process,
            mentor younger students, and engage our community through STEM outreach events.
          </p>

          <p>
            Based in Mechanicsburg, PA, we combine the rookie energy of a 2nd-year FTC team
            with the veteran wisdom of 8 years in FLL. We&apos;re a diverse team of builders,
            coders, and community leaders, recognized by <strong>POWER WOMEN</strong> for
            introducing girls to STEM.
          </p>

          <div className="about-disciplines">
            {DISCIPLINES.map((item) => (
              <div key={item.title} className="about-card">
                <div className="about-card-icon">{item.icon}</div>
                <div className="about-card-title">{item.title}</div>
                <div className="about-card-desc">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="about-aspirations">
            <h3>Future Aspirations</h3>
            <p>
              Our goal is to qualify for Worlds, further reduce cycle times, spread awareness
              of FIRST, and continue building the &lsquo;ARCHITECHS&rsquo; legacy.
            </p>
          </div>
        </section>

        {/* ── SEASON ACHIEVEMENTS ─────────────────────────────────────── */}
        <section className="landing-section">
          <div className="about-eyebrow">
            <span className="about-eyebrow-line" />
            <span className="about-eyebrow-text">Last 2 Seasons</span>
          </div>
          <h2>Season Achievements</h2>

          {seasons.length ? (
            <div className="achievements-seasons">
              {seasons.map(([season, events]) => (
                <div key={season} className="achievement-season">
                  <div className="achievement-season-head">
                    <span className="achievement-season-name">{season}</span>
                    <span className="achievement-season-count">{events.length} events</span>
                  </div>
                  <div className="achievement-timeline">
                    {events.map((ev) => (
                      <div key={ev.id} className="achievement-row">
                        <span className="achievement-dot" />
                        <div className="achievement-main">
                          <div className="achievement-name">{ev.event_name}</div>
                          {ev.location ? (
                            <div className="achievement-loc">📍 {ev.location}</div>
                          ) : null}
                        </div>
                        <div className="achievement-meta">
                          {ev.event_date ? <div className="achievement-date">{ev.event_date}</div> : null}
                          {ev.score ? <div className="achievement-score">{ev.score}</div> : null}
                          {ev.result ? <div className="achievement-result">{ev.result}</div> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="about-empty">Achievements will appear here once added in the admin dashboard.</p>
          )}
        </section>

        {/* ── EVENT GALLERY ───────────────────────────────────────────── */}
        <section className="landing-section">
          <div className="about-eyebrow">
            <span className="about-eyebrow-line" />
            <span className="about-eyebrow-text">Moments</span>
          </div>
          <h2>Team Events</h2>
          <p className="about-gallery-sub">
            Games, parties, outreach, workout sessions, and design days — a look at life on
            the Architechs.
          </p>

          <div className="gallery-filters">
            {EVENT_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`gallery-filter${mediaFilter === f.value ? " active" : ""}`}
                onClick={() => setMediaFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredMedia.length ? (
            <div className="event-gallery">
              {filteredMedia.map((item) => (
                <figure key={item.id} className="event-media-card">
                  <div className="event-media-frame">
                    {item.media_type === "video" ? (
                      <video src={item.media_url} controls preload="metadata" />
                    ) : (
                      <img src={item.media_url} alt={item.title} loading="lazy" />
                    )}
                    <span className="event-media-type">{TYPE_LABELS[item.event_type] || "Event"}</span>
                  </div>
                  <figcaption className="event-media-cap">
                    <span className="event-media-title">{item.title}</span>
                    {item.event_date ? <span className="event-media-date">{item.event_date}</span> : null}
                    {item.caption ? <span className="event-media-desc">{item.caption}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="about-empty">
              No media yet. Upload photos and videos from the admin dashboard (Team Story tab).
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
