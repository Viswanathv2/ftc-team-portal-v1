import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RouteLoading from "../components/RouteLoading";
import Lightbox from "../components/Lightbox";
import UploadMediaModal from "../components/UploadMediaModal";
import { usePortalPage } from "../hooks/usePortalPage";
import { useTrackVisit } from "../hooks/useTrackVisit";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const DISCIPLINES = [
  { icon: "💻", title: "Software", desc: "FTCLib, RoadRunner, OpenCV vision pipelines" },
  { icon: "🔧", title: "Mechanical", desc: "Custom drivetrain and game-specific manipulators" },
  { icon: "📐", title: "CAD & Design", desc: "OnShape assemblies with tolerance-aware modeling" },
  { icon: "🏆", title: "Competition", desc: "League play with World Championship aspirations" }
];

const EVENT_FILTERS = [
  { value: "all", label: "All" },
  { value: "game", label: "Matches" },
  { value: "party", label: "Team Fun" },
  { value: "outreach", label: "Outreach" },
  { value: "workout", label: "Brainstorming" },
  { value: "design", label: "Design" }
];

const TYPE_LABELS = {
  game: "Matches",
  party: "Team Fun",
  outreach: "Outreach",
  workout: "Brainstorming",
  design: "Design",
  other: "Event"
};

// Achievements may store many media in `media`, or a single legacy media_url.
// Normalize both into one array of { url, type } objects.
function achievementMedia(a) {
  if (Array.isArray(a?.media) && a.media.length) return a.media;
  if (a?.media_url) return [{ url: a.media_url, type: a.media_type || "image" }];
  return [];
}

// Member Portal internal resource cards (logged-in only).
const MEMBER_RESOURCES = [
  { icon: "📅", title: "Build Calendar", desc: "Meeting dates, deadlines, and competition schedule.", to: "/schedule" },
  { icon: "🔩", title: "Parts Inventory", desc: "What we have, what we need, and where it lives.", to: "/learning" },
  { icon: "📓", title: "Engineering Notebook", desc: "Design decisions, iterations, and documentation.", to: "/learning" },
  { icon: "🔍", title: "Scouting", desc: "Match notes and alliance scouting data.", to: "/learning" }
];

export default function AboutPage() {
  const page = usePortalPage("about");
  useTrackVisit("about");
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [newIds, setNewIds] = useState(() => new Set());
  const [showUpload, setShowUpload] = useState(false);
  // Lightbox: { items: [{url,type,title,caption,date}], index } or null
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [mediaResp, achvResp] = await Promise.all([
        supabase
          .from("event_media")
          .select("id,title,event_type,event_date,caption,media_url,media_type,created_at")
          .order("event_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("achievements")
          .select("id,season,event_name,event_date,location,result,sort_order,matches_played,matches_won,highest_score,overall_rank,media,media_url,media_type")
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

  // Recently uploaded items (this session, or created in the last 3 days) get a NEW badge.
  function isNew(item) {
    if (newIds.has(item.id)) return true;
    if (!item.created_at) return false;
    return Date.now() - new Date(item.created_at).getTime() < 3 * 24 * 60 * 60 * 1000;
  }

  function openGalleryLightbox(startIndex) {
    setLightbox({
      items: filteredMedia.map((m) => ({
        url: m.media_url,
        type: m.media_type === "video" ? "video" : "image",
        title: m.title,
        caption: m.caption,
        date: m.event_date
      })),
      index: startIndex
    });
  }

  function openAchievementLightbox(ev, startIndex = 0) {
    const items = achievementMedia(ev).map((m) => ({
      url: m.url,
      type: m.type === "video" ? "video" : "image",
      title: ev.event_name,
      caption: ev.location || "",
      date: ev.event_date
    }));
    if (items.length) setLightbox({ items, index: startIndex });
  }

  function handleUploaded(row) {
    setMedia((prev) => [row, ...prev]);
    setNewIds((prev) => new Set(prev).add(row.id));
    setShowUpload(false);
  }

  const seasons = useMemo(() => {
    const grouped = new Map();
    achievements.forEach((a) => {
      if (!grouped.has(a.season)) grouped.set(a.season, []);
      grouped.get(a.season).push(a);
    });
    return Array.from(grouped.entries());
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

          {/* <p className="content-box-lead"> */}
          <p>
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
            <span className="about-eyebrow-text">Season by Season</span>
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
                    {events.map((ev) => {
                      const evMedia = achievementMedia(ev);
                      return (
                      <div key={ev.id} className={`achievement-row${evMedia.length ? " has-media" : ""}`}>
                        <span className="achievement-dot" />
                        <div className="achievement-main">
                          <div className="achievement-name">
                            {ev.event_name}
                            {evMedia.length ? (
                              <span className="achievement-media-hint" aria-hidden="true">
                                📷{evMedia.length > 1 ? ` ${evMedia.length}` : ""}
                              </span>
                            ) : null}
                          </div>
                          {ev.location ? (
                            <div className="achievement-loc">📍 {ev.location}</div>
                          ) : null}
                          {(ev.matches_played != null ||
                            ev.matches_won != null ||
                            ev.highest_score ||
                            ev.overall_rank) ? (
                            <div className="achievement-stats">
                              {ev.matches_played != null ? (
                                <span className="achievement-stat">🤖 {ev.matches_played} matches</span>
                              ) : null}
                              {ev.matches_won != null ? (
                                <span className="achievement-stat">✅ {ev.matches_won} won</span>
                              ) : null}
                              {ev.highest_score ? (
                                <span className="achievement-stat">🔥 High {ev.highest_score}</span>
                              ) : null}
                              {ev.overall_rank ? (
                                <span className="achievement-stat">🏅 Rank {ev.overall_rank}</span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="achievement-meta">
                          {ev.event_date ? <div className="achievement-date">{ev.event_date}</div> : null}
                          {ev.result ? <div className="achievement-result">{ev.result}</div> : null}
                        </div>
                        {/* {evMedia.length ? (
                          <div className="achievement-media-pop">
                            <div className="achievement-media-strip">
                              {evMedia.map((m, i) => (
                                <button
                                  type="button"
                                  key={`${m.url}-${i}`}
                                  className="achievement-media-item"
                                  onClick={() => openAchievementLightbox(ev, i)}
                                  aria-label={`Open ${ev.event_name} media`}
                                >
                                  {m.type === "video" ? (
                                    <video src={m.url} muted loop autoPlay playsInline />
                                  ) : (
                                    <img src={m.url} alt={`${ev.event_name} ${i + 1}`} loading="lazy" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null} */}
                      </div>
                      );
                    })}
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
          <div className="gallery-header">
            <h2>Team Events</h2>
            {user ? (
              <button type="button" className="gallery-upload-btn" onClick={() => setShowUpload(true)}>
                + Upload Media
              </button>
            ) : null}
          </div>
          <p className="about-gallery-sub">
            Matches, team fun, outreach, brainstorming sessions, and design days — a look at life on
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
              {filteredMedia.map((item, idx) => (
                <figure key={item.id} className="event-media-card">
                  <button
                    type="button"
                    className="event-media-frame"
                    onClick={() => openGalleryLightbox(idx)}
                    aria-label={`Open ${item.title}`}
                  >
                    {item.media_type === "video" ? (
                      <video src={item.media_url} preload="metadata" />
                    ) : (
                      <img src={item.media_url} alt={item.title} loading="lazy" />
                    )}
                    <span className="event-media-type">{TYPE_LABELS[item.event_type] || "Event"}</span>
                    {isNew(item) ? <span className="event-media-new">NEW</span> : null}
                    <span className="event-media-zoom" aria-hidden="true">⤢</span>
                  </button>
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
              {user
                ? "No media yet. Use “+ Upload Media” to add the first photo or video."
                : "No media yet. Check back soon for photos and videos from our events."}
            </p>
          )}

          {!user ? (
            <div className="gallery-login-banner">
              🔒 Team members — <Link to="/login">log in</Link> to upload photos and videos.
            </div>
          ) : null}
        </section>

        {/* ── MEMBER PORTAL (logged-in only) ──────────────────────────── */}
        {user ? (
          <section className="landing-section member-portal">
            <div className="about-eyebrow">
              <span className="about-eyebrow-line" />
              <span className="about-eyebrow-text">Members Only</span>
            </div>
            <h2>Member Portal</h2>
            <p className="about-gallery-sub">Quick links to our internal team resources.</p>
            <div className="member-portal-grid">
              {MEMBER_RESOURCES.map((r) => (
                <Link key={r.title} to={r.to} className="member-portal-card">
                  <span className="member-portal-icon">{r.icon}</span>
                  <span className="member-portal-title">{r.title}</span>
                  <span className="member-portal-desc">{r.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {lightbox ? (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : prev))}
        />
      ) : null}

      {showUpload ? (
        <UploadMediaModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
      ) : null}
    </section>
  );
}
