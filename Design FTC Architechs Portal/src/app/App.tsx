import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Menu, X, Sun, Moon, ChevronDown, ChevronRight,
  ExternalLink, Mail, MapPin, Code, Wrench, Cpu, Trophy,
  Calendar, Users, Github, Instagram,
} from "lucide-react";

type Role = "Coder" | "Build" | "CAD" | "Captain";
type TeamTab = "active" | "alumni";
type SponsorTier = "Gold" | "Silver" | "Bronze";

interface Member {
  name: string;
  role: Role | Role[];
  year?: string;
  grade?: string;
  photoId: string;
}

interface Sponsor {
  name: string;
  tier: SponsorTier;
}

interface ScheduleEvent {
  name: string;
  date: string;
  location: string;
  type: "kickoff" | "meet" | "championship" | "outreach";
  status: "upcoming" | "completed" | "current";
}

const activeMembers: Member[] = [
  { name: "Aiden Chen", role: ["Coder", "Captain"], grade: "11th", photoId: "1593376893114-1aed528d80cf" },
  { name: "Maya Patel", role: "CAD", grade: "10th", photoId: "1705579608049-a251d1ba0405" },
  { name: "Jordan Williams", role: "Build", grade: "12th", photoId: "1581092334651-ddf26d9a09d0" },
  { name: "Sofia Rodriguez", role: "Coder", grade: "9th", photoId: "1705579608865-29080b646d9c" },
  { name: "Marcus Lee", role: "Build", grade: "11th", photoId: "1596496050756-93ba991aae15" },
  { name: "Priya Sharma", role: ["CAD", "Coder"], grade: "10th", photoId: "1705579610200-d7e0f6000bb1" },
];

const alumniMembers: Member[] = [
  { name: "Tyler Zhang", role: "Coder", year: "2024", photoId: "1755053757758-e06b6593a320" },
  { name: "Aaliyah Johnson", role: "Build", year: "2024", photoId: "1581092333322-31d2fd38a35e" },
];

const sponsors: Sponsor[] = [
  { name: "TechCorp Industries", tier: "Gold" },
  { name: "FIRST Robotics Foundation", tier: "Gold" },
  { name: "Valley Engineering Co.", tier: "Silver" },
  { name: "CodePath Academy", tier: "Silver" },
  { name: "Local Hardware Supply", tier: "Bronze" },
  { name: "STEM Alliance", tier: "Bronze" },
  { name: "Architechs Parent Boosters", tier: "Bronze" },
];

const schedule: ScheduleEvent[] = [
  { name: "INTO THE DEEP Season Kickoff", date: "Sep 7, 2024", location: "Virtual Livestream", type: "kickoff", status: "completed" },
  { name: "League Meet #1", date: "Oct 19, 2024", location: "Riverside High School", type: "meet", status: "completed" },
  { name: "League Meet #2", date: "Nov 16, 2024", location: "Central Valley Academy", type: "meet", status: "completed" },
  { name: "League Championship", date: "Dec 14, 2024", location: "Metro Convention Center", type: "championship", status: "current" },
  { name: "State Championship", date: "Jan 25–26, 2025", location: "Sacramento Convention Center", type: "championship", status: "upcoming" },
  { name: "Community Outreach Day", date: "Feb 8, 2025", location: "Westside Library", type: "outreach", status: "upcoming" },
];

const resources = [
  { title: "FTC Game Manual", desc: "INTO THE DEEP official rules, scoring, and field specs.", icon: "📋", url: "#" },
  { title: "REV Robotics Docs", desc: "Control Hub, motors, servos, and expansion hub guides.", icon: "⚙️", url: "#" },
  { title: "GitHub Repository", desc: "Our open-source robot code — OpModes, auto, and vision.", icon: "💻", url: "#" },
  { title: "OnShape CAD Files", desc: "Full robot models, subsystems, and field element replicas.", icon: "📐", url: "#" },
  { title: "Programming Guide", desc: "Internal reference for FTCLib, RoadRunner, and OpenCV.", icon: "🔧", url: "#" },
  { title: "Meeting Notes Archive", desc: "Weekly build logs, design decisions, and action items.", icon: "📝", url: "#" },
];

const navLinks = ["About", "Team", "Sponsors", "Schedule", "Resources", "Join"];

const roleColors: Record<Role, string> = {
  Coder: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Build: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  CAD: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  Captain: "bg-[#00D4B4]/15 text-[#00D4B4] border-[#00D4B4]/25",
};

function RoleBadge({ role }: { role: Role | Role[] }) {
  const roles = Array.isArray(role) ? role : [role];
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span key={r} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${roleColors[r]}`}>
          {r}
        </span>
      ))}
    </div>
  );
}

function MemberCard({ member, isAlumni = false }: { member: Member; isAlumni?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative bg-card border border-border rounded overflow-hidden hover:border-[#00D4B4]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,180,0.06)]"
    >
      <div className="aspect-[3/4] bg-muted overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-${member.photoId}?w=400&h=533&fit=crop&auto=format&q=80`}
          alt={member.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-display font-semibold text-sm text-foreground leading-tight">{member.name}</h3>
          <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
            {isAlumni ? `'${member.year?.slice(2)}` : member.grade}
          </span>
        </div>
        <RoleBadge role={member.role} />
      </div>
      <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#00D4B4] opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

const tierConfig = {
  Gold: {
    grid: "grid-cols-1 sm:grid-cols-2",
    card: "border-yellow-400/30 bg-yellow-400/5 py-10 text-lg",
    label: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  Silver: {
    grid: "grid-cols-2 sm:grid-cols-3",
    card: "border-slate-400/30 bg-slate-400/5 py-8 text-base",
    label: "text-slate-400",
    dot: "bg-slate-400",
  },
  Bronze: {
    grid: "grid-cols-2 sm:grid-cols-4",
    card: "border-orange-700/30 bg-orange-700/5 py-6 text-sm",
    label: "text-orange-500",
    dot: "bg-orange-500",
  },
};

export default function App() {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [teamTab, setTeamTab] = useState<TeamTab>("active");
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinGrade, setJoinGrade] = useState("");
  const [joinInterest, setJoinInterest] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [joinSubmitted, setJoinSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-[#00D4B4] rounded-sm flex items-center justify-center shrink-0">
              <span className="font-display font-black text-sm text-[#080C18] leading-none">A</span>
            </div>
            <div className="text-left leading-none">
              <div className="font-display font-black text-sm tracking-wide text-foreground">ARCHITECHS</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">#25795 · FTC</div>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                className="px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-all"
              >
                {link}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDark(!dark)}
              className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[#00D4B4]/40 transition-all"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={() => scrollTo("join")}
              className="hidden md:flex items-center gap-1.5 bg-[#00D4B4] text-[#080C18] font-mono text-xs font-semibold px-4 py-2 rounded hover:bg-[#00D4B4]/80 transition-colors"
            >
              Join Us <ChevronRight size={12} />
            </button>
            <button
              className="md:hidden w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 px-5 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                className="block w-full text-left px-3 py-2.5 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-all"
              >
                {link}
              </button>
            ))}
            <div className="pt-2 pb-1">
              <button
                onClick={() => scrollTo("join")}
                className="w-full bg-[#00D4B4] text-[#080C18] font-mono text-xs font-semibold py-2.5 rounded text-center"
              >
                Join Us
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-16">

        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1742767069929-0c663150b164?w=1600&h=900&fit=crop&auto=format&q=60"
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-10 dark:opacity-[0.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Engineering grid */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Giant watermark number */}
        <div className="absolute right-[-2vw] top-1/2 -translate-y-1/2 font-display font-black text-[22vw] text-foreground/[0.025] select-none leading-none pointer-events-none">
          25795
        </div>

        <div className="relative max-w-7xl mx-auto px-5 py-20 grid md:grid-cols-[1fr_420px] gap-12 items-center w-full">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-[1px] bg-[#00D4B4]" />
                <span className="font-mono text-[10px] text-[#00D4B4] tracking-[0.2em] uppercase">
                  FTC Team #25795 · INTO THE DEEP 2024–25
                </span>
              </div>
              <h1 className="font-display font-black text-[clamp(4rem,10vw,7rem)] leading-[0.9] text-foreground tracking-tight">
                ARCHI<span className="text-[#00D4B4]">TECHS</span>
              </h1>
              <p className="font-display font-medium text-xl text-muted-foreground">
                Engineering the future, one match at a time.
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              We are a student-led FIRST Tech Challenge robotics team. We build, code, and
              design competition-ready robots — while mentoring the next generation of
              engineers through community outreach and STEM advocacy.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo("about")}
                className="flex items-center gap-2 bg-[#00D4B4] text-[#080C18] font-mono font-semibold text-xs px-5 py-3 rounded hover:bg-[#00D4B4]/80 transition-colors"
              >
                Our Story <ChevronRight size={14} />
              </button>
              <button
                onClick={() => scrollTo("join")}
                className="flex items-center gap-2 border border-border text-foreground font-mono text-xs px-5 py-3 rounded hover:border-[#00D4B4]/50 hover:text-[#00D4B4] transition-all"
              >
                Join the Team
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border max-w-sm">
              {[
                { val: "2024", label: "Founded" },
                { val: "6", label: "Members" },
                { val: "CA", label: "State" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display font-black text-3xl text-foreground leading-none">{s.val}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — robot photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="hidden md:block"
          >
            <div className="relative aspect-[4/5] rounded overflow-hidden border border-[#00D4B4]/20">
              <div className="absolute inset-0 bg-muted" />
              <img
                src="https://images.unsplash.com/photo-1775826476148-1e35e8a74f09?w=600&h=750&fit=crop&auto=format&q=80"
                alt="Architechs competition robot"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080C18]/80 via-transparent to-transparent" />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="font-mono text-[10px] text-[#00D4B4] tracking-wider uppercase">Current Build</div>
                <div className="font-display font-bold text-foreground text-xl mt-0.5">ARCH-1 Prototype</div>
              </div>
              {/* Corner marks */}
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#00D4B4]/50" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#00D4B4]/50" />
              {/* Team number watermark */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-[#00D4B4]/60">#25795</div>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground">
          <span className="font-mono text-[10px] tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* Copy */}
            <div className="space-y-7">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-4 h-[1px] bg-[#00D4B4]" />
                  <span className="font-mono text-[10px] text-[#00D4B4] tracking-widest uppercase">About Our Team</span>
                </div>
                <h2 className="font-display font-black text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] text-foreground">
                  Built by students.<br />Driven by curiosity.
                </h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Architechs (FTC #25795) was founded in 2024 with a simple conviction: high school
                students can engineer competition-grade robots. We compete in FIRST Tech Challenge,
                where teams design, build, program, and operate robots in alliance-format field matches.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every member participates across the full engineering cycle — from whiteboard concepts
                to field-ready hardware. Beyond competition, we document our process, mentor younger
                students, and engage our community through STEM outreach events.
              </p>

              {/* Discipline cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Code size={16} />, title: "Software", desc: "FTCLib, RoadRunner, OpenCV vision pipelines" },
                  { icon: <Wrench size={16} />, title: "Mechanical", desc: "Custom drivetrain and game-specific manipulators" },
                  { icon: <Cpu size={16} />, title: "CAD & Design", desc: "OnShape assemblies with tolerance-aware modeling" },
                  { icon: <Trophy size={16} />, title: "Competition", desc: "League play with state championship aspirations" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-4 border border-border rounded bg-card space-y-2 hover:border-[#00D4B4]/30 transition-colors"
                  >
                    <div className="text-[#00D4B4]">{item.icon}</div>
                    <div className="font-display font-semibold text-sm text-foreground">{item.title}</div>
                    <div className="font-mono text-[11px] text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visuals */}
            <div className="space-y-3">
              <div className="aspect-video rounded overflow-hidden border border-border bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1742767069929-544f5084f7d8?w=800&h=450&fit=crop&auto=format&q=80"
                  alt="Team working on the robot"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: "INTO THE DEEP", label: "Season" },
                  { val: "League", label: "Competition" },
                  { val: "California", label: "Region" },
                ].map((s) => (
                  <div key={s.label} className="p-3 border border-border rounded bg-card text-center">
                    <div className="font-mono text-[10px] font-semibold text-[#00D4B4] leading-snug">{s.val}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Engineering spec strip */}
              <div className="border border-border rounded bg-card px-4 py-3 flex items-center gap-6 overflow-x-auto">
                {[
                  ["Controller", "REV Control Hub"],
                  ["Motors", "goBILDA 5202"],
                  ["Language", "Java / Kotlin"],
                  ["CAD", "OnShape"],
                ].map(([k, v]) => (
                  <div key={k} className="shrink-0">
                    <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{k}</div>
                    <div className="font-mono text-[11px] text-[#00D4B4] font-semibold mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ────────────────────────────────────────────────────────── */}
      <section id="team" className="py-24 border-t border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-5">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-[1px] bg-[#00D4B4]" />
                <span className="font-mono text-[10px] text-[#00D4B4] tracking-widest uppercase">The Roster</span>
              </div>
              <h2 className="font-display font-black text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] text-foreground">
                Meet the Team
              </h2>
            </div>

            {/* Tab selector */}
            <div className="flex border border-border rounded overflow-hidden w-fit">
              {(["active", "alumni"] as TeamTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTeamTab(tab)}
                  className={`px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    teamTab === tab
                      ? "bg-[#00D4B4] text-[#080C18] font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "active" ? "Active Members" : "Alumni"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {(teamTab === "active" ? activeMembers : alumniMembers).map((member) => (
              <MemberCard key={member.name} member={member} isAlumni={teamTab === "alumni"} />
            ))}
          </div>

          {/* Role legend */}
          <div className="mt-6 flex items-center gap-4 p-4 border border-border rounded bg-card flex-wrap">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Role Key:</span>
            {(["Captain", "Coder", "Build", "CAD"] as Role[]).map((r) => (
              <span key={r} className={`font-mono text-[10px] px-2 py-0.5 rounded border ${roleColors[r]}`}>
                {r}
              </span>
            ))}
          </div>

          {/* Alumni note */}
          {teamTab === "alumni" && (
            <div className="mt-6 p-4 border border-dashed border-border rounded text-center">
              <p className="font-mono text-xs text-muted-foreground">
                Architechs is a young team. Alumni listings grow each graduating season. Thank you to our founders.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── SPONSORS ────────────────────────────────────────────────────── */}
      <section id="sponsors" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-5">

          <div className="text-center mb-12 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-[1px] bg-[#00D4B4]" />
              <span className="font-mono text-[10px] text-[#00D4B4] tracking-widest uppercase">Our Supporters</span>
              <span className="w-4 h-[1px] bg-[#00D4B4]" />
            </div>
            <h2 className="font-display font-black text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] text-foreground">
              Sponsors
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Architechs is powered by the generosity of our sponsors. Their investment funds
              components, travel, registration fees, and our outreach programs.
            </p>
          </div>

          {(["Gold", "Silver", "Bronze"] as SponsorTier[]).map((tier) => {
            const tierSponsors = sponsors.filter((s) => s.tier === tier);
            const cfg = tierConfig[tier];
            return (
              <div key={tier} className="mb-8">
                <div className={`flex items-center gap-2 mb-3`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${cfg.label}`}>{tier} Tier</span>
                </div>
                <div className={`grid gap-3 ${cfg.grid}`}>
                  {tierSponsors.map((s) => (
                    <div
                      key={s.name}
                      className={`border rounded flex items-center justify-center text-center font-display font-semibold transition-all hover:border-[#00D4B4]/30 cursor-default px-6 ${cfg.card} text-foreground`}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* CTA */}
          <div className="mt-10 border border-dashed border-border rounded p-8 text-center space-y-3">
            <div className="font-display font-bold text-lg text-foreground">Interested in sponsoring Architechs?</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your support helps us compete, learn, and inspire students to pursue engineering.
            </p>
            <button
              onClick={() => scrollTo("join")}
              className="inline-flex items-center gap-2 bg-[#00D4B4] text-[#080C18] font-mono font-semibold text-xs px-5 py-2.5 rounded hover:bg-[#00D4B4]/80 transition-colors"
            >
              Get in Touch <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* ── SCHEDULE ────────────────────────────────────────────────────── */}
      <section id="schedule" className="py-24 border-t border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-5">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-[1px] bg-[#00D4B4]" />
                <span className="font-mono text-[10px] text-[#00D4B4] tracking-widest uppercase">2024–25 Season</span>
              </div>
              <h2 className="font-display font-black text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] text-foreground">
                Schedule
              </h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00D4B4]" />In Progress</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/50" />Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border-2 border-muted-foreground/40" />Upcoming</span>
            </div>
          </div>

          <div className="space-y-2">
            {schedule.map((event, i) => (
              <motion.div
                key={event.name}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`grid grid-cols-[20px_1fr_auto] gap-4 md:gap-8 items-center px-5 py-4 border rounded transition-all ${
                  event.status === "current"
                    ? "border-[#00D4B4]/50 bg-[#00D4B4]/5"
                    : event.status === "completed"
                    ? "border-border bg-card opacity-55"
                    : "border-border bg-card hover:border-[#00D4B4]/25"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    event.status === "current"
                      ? "bg-[#00D4B4] shadow-[0_0_8px_rgba(0,212,180,0.6)]"
                      : event.status === "completed"
                      ? "bg-muted-foreground/40"
                      : "border-2 border-muted-foreground/40"
                  }`}
                />
                <div>
                  <div className="font-display font-semibold text-foreground text-sm">{event.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <MapPin size={9} /> {event.location}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs text-foreground">{event.date}</div>
                  <div
                    className={`font-mono text-[10px] mt-0.5 ${
                      event.status === "current"
                        ? "text-[#00D4B4]"
                        : event.status === "completed"
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {event.status === "current" ? "▶ In Progress" : event.status === "completed" ? "✓ Done" : "◦ Upcoming"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="font-mono text-[10px] text-muted-foreground mt-5 text-center">
            All dates subject to change. Follow our Instagram for real-time updates.
          </p>
        </div>
      </section>

      {/* ── RESOURCES ───────────────────────────────────────────────────── */}
      <section id="resources" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-5">

          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-[1px] bg-[#00D4B4]" />
              <span className="font-mono text-[10px] text-[#00D4B4] tracking-widest uppercase">Open Access</span>
            </div>
            <h2 className="font-display font-black text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] text-foreground">
              Resources
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
              Everything we use and produce is available openly. Great robotics is built on
              shared knowledge.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {resources.map((r, i) => (
              <motion.a
                key={r.title}
                href={r.url}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group p-5 border border-border rounded bg-card hover:border-[#00D4B4]/40 hover:bg-[#00D4B4]/[0.03] transition-all flex flex-col gap-3"
              >
                <div className="text-2xl">{r.icon}</div>
                <div>
                  <div className="font-display font-semibold text-sm text-foreground group-hover:text-[#00D4B4] transition-colors flex items-center justify-between gap-2">
                    {r.title}
                    <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{r.desc}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN ────────────────────────────────────────────────────────── */}
      <section id="join" className="py-24 border-t border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-16 items-start">

            {/* Left — pitch */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-[1px] bg-[#00D4B4]" />
                  <span className="font-mono text-[10px] text-[#00D4B4] tracking-widest uppercase">Get Involved</span>
                </div>
                <h2 className="font-display font-black text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] text-foreground">
                  Join the<br />Architechs
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                We welcome high school students (grades 9–12) with a passion for engineering,
                programming, or design. No prior experience required — just curiosity and commitment.
              </p>

              <div className="space-y-3">
                {[
                  {
                    icon: <Code size={15} />,
                    title: "Coders",
                    desc: "Java / Kotlin programming, autonomous path planning, and computer vision pipelines.",
                  },
                  {
                    icon: <Wrench size={15} />,
                    title: "Builders",
                    desc: "Mechanical fabrication, drivetrain assembly, wiring, and field-side testing.",
                  },
                  {
                    icon: <Cpu size={15} />,
                    title: "CAD Designers",
                    desc: "3D modeling in OnShape, GD&T, tolerance analysis, and iterative design.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-4 border border-border rounded bg-card hover:border-[#00D4B4]/30 transition-colors">
                    <div className="text-[#00D4B4] mt-0.5 shrink-0">{item.icon}</div>
                    <div>
                      <div className="font-display font-semibold text-sm text-foreground">{item.title}</div>
                      <div className="font-mono text-[11px] text-muted-foreground mt-1 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 p-4 border border-border rounded bg-card">
                <Mail size={15} className="text-[#00D4B4] shrink-0" />
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Email us directly</div>
                  <div className="font-mono text-xs text-foreground mt-0.5">architechs25795@gmail.com</div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="border border-border rounded bg-card p-7">
              {joinSubmitted ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 bg-[#00D4B4]/15 border border-[#00D4B4]/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="font-display font-black text-xl text-foreground">Application Received!</div>
                  <p className="font-mono text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    We review applications on a rolling basis and will reach out within a week. Welcome to the community!
                  </p>
                  <button
                    onClick={() => setJoinSubmitted(false)}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Submit another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="font-display font-bold text-lg text-foreground mb-1">Express Interest</div>
                  <p className="font-mono text-[11px] text-muted-foreground mb-4">
                    Fill this out and we'll get back to you about joining the team.
                  </p>

                  {[
                    { label: "Full Name", type: "text", val: joinName, set: setJoinName, placeholder: "Your full name", required: true },
                    { label: "Email Address", type: "email", val: joinEmail, set: setJoinEmail, placeholder: "you@school.edu", required: true },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1.5">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</label>
                      <input
                        type={f.type}
                        required={f.required}
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 border border-border rounded bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#00D4B4]/50 transition-colors"
                      />
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Current Grade</label>
                    <select
                      value={joinGrade}
                      onChange={(e) => setJoinGrade(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded bg-background text-foreground text-sm font-mono focus:outline-none focus:border-[#00D4B4]/50 transition-colors"
                    >
                      <option value="">Select grade...</option>
                      {["9th", "10th", "11th", "12th"].map((g) => (
                        <option key={g} value={g}>{g} Grade</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Area of Interest</label>
                    <select
                      required
                      value={joinInterest}
                      onChange={(e) => setJoinInterest(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded bg-background text-foreground text-sm font-mono focus:outline-none focus:border-[#00D4B4]/50 transition-colors"
                    >
                      <option value="">Select a role...</option>
                      <option value="coder">Coder / Programmer</option>
                      <option value="build">Build / Mechanical</option>
                      <option value="cad">CAD / Design</option>
                      <option value="multiple">Multiple / Not sure yet</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Tell us about yourself <span className="normal-case">(optional)</span></label>
                    <textarea
                      value={joinMessage}
                      onChange={(e) => setJoinMessage(e.target.value)}
                      placeholder="Any relevant experience, projects, or questions..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-border rounded bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#00D4B4]/50 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#00D4B4] text-[#080C18] font-mono font-semibold text-sm py-3 rounded hover:bg-[#00D4B4]/80 transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    Submit Application <ChevronRight size={14} />
                  </button>
                  <p className="font-mono text-[10px] text-muted-foreground text-center">
                    We review on a rolling basis. You'll hear from us within a week.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-14">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-4 gap-10 mb-10">

            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#00D4B4] rounded-sm flex items-center justify-center shrink-0">
                  <span className="font-display font-black text-sm text-[#080C18]">A</span>
                </div>
                <div>
                  <div className="font-display font-black text-sm text-foreground">ARCHITECHS</div>
                  <div className="font-mono text-[10px] text-muted-foreground">FTC Team #25795</div>
                </div>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground leading-relaxed max-w-xs">
                A student-led FIRST Tech Challenge robotics team engineering innovative solutions
                and inspiring the next generation of technologists.
              </p>
              <div className="flex items-center gap-2">
                <a href="#" className="w-8 h-8 border border-border rounded flex items-center justify-center text-muted-foreground hover:text-[#00D4B4] hover:border-[#00D4B4]/40 transition-all">
                  <Github size={13} />
                </a>
                <a href="#" className="w-8 h-8 border border-border rounded flex items-center justify-center text-muted-foreground hover:text-[#00D4B4] hover:border-[#00D4B4]/40 transition-all">
                  <Instagram size={13} />
                </a>
                <a href="#" className="w-8 h-8 border border-border rounded flex items-center justify-center text-muted-foreground hover:text-[#00D4B4] hover:border-[#00D4B4]/40 transition-all">
                  <Mail size={13} />
                </a>
              </div>
            </div>

            {/* Nav links */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] text-[#00D4B4] uppercase tracking-widest">Navigate</div>
              {navLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => scrollTo(link.toLowerCase())}
                  className="block font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link}
                </button>
              ))}
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] text-[#00D4B4] uppercase tracking-widest">Contact</div>
              <div className="font-mono text-[11px] text-muted-foreground">architechs25795@gmail.com</div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <MapPin size={10} /> California, USA
              </div>
              <div className="pt-2 border-t border-border space-y-2">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">External</div>
                {[
                  { label: "ftcscout.org", href: "#" },
                  { label: "firstinspires.org", href: "#" },
                  { label: "GitHub Repository", href: "#" },
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-[#00D4B4] transition-colors"
                  >
                    <ExternalLink size={9} /> {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="font-mono text-[10px] text-muted-foreground">
              © 2025 Architechs FTC #25795. All rights reserved.
            </div>
            <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4B4]" />
              Powered by FIRST Tech Challenge
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
