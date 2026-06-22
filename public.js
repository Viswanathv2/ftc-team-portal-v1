const PUBLIC_SUPABASE_URL = "https://hurchbtvwjrdxovkswjd.supabase.co";
const PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_tZEFxppT7q0kC0JpJo_wYw_-WIKPJCm";

const PUBLIC_PAGE_DEFAULTS = {
  home: {
    title: "FTC Team Portal",
    subtitle: "Welcome to Team 25795 - Architechs",
    body: "We are Team 25795 Architechs from Mechanicsburg, Pennsylvania.",
    contactEmail: "ftc25795@gmail.com"
  },
  about: {
    title: "Team Story",
    subtitle: "How Architechs grew through robotics",
    body: "Share your team story and milestones here.",
    contactEmail: "ftc25795@gmail.com"
  },
  team: {
    title: "Meet the Team",
    subtitle: "Team 25795 - Architechs",
    body: "Meet our team members.",
    contactEmail: "ftc25795@gmail.com"
  },
  schedule: {
    title: "Schedule and Events",
    subtitle: "Upcoming plans for Team 25795",
    body: "Add your meeting schedule, competitions, and build sessions.",
    contactEmail: "ftc25795@gmail.com"
  },
  resources: {
    title: "Resources and Announcements",
    subtitle: "Helpful materials for our team and visitors",
    body: "Post announcements and learning resources here.",
    contactEmail: "ftc25795@gmail.com"
  },
  sponsorship: {
    title: "Sponsorship Needed",
    subtitle: "Partner with Team 25795 - Architechs",
    body: "Architechs is actively seeking sponsorship from local businesses and community organizations.",
    contactEmail: "ftc25795@gmail.com"
  }
};

let publicSupabase = null;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPageSlug() {
  return document.body.getAttribute("data-page") || "home";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value) {
    el.textContent = value;
  }
}

function setParagraphContent(id, value) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }

  const lines = String(value || "").split("\n").map((x) => x.trim()).filter(Boolean);
  if (!lines.length) {
    return;
  }

  el.innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

async function loadPageContent(pageSlug) {
  if (!publicSupabase) {
    return PUBLIC_PAGE_DEFAULTS[pageSlug] || PUBLIC_PAGE_DEFAULTS.home;
  }

  const defaults = PUBLIC_PAGE_DEFAULTS[pageSlug] || PUBLIC_PAGE_DEFAULTS.home;
  const { data, error } = await publicSupabase
    .from("portal_pages")
    .select("slug,title,subtitle,body,contact_email")
    .eq("slug", pageSlug)
    .maybeSingle();

  if (error || !data) {
    return defaults;
  }

  return {
    title: data.title || defaults.title,
    subtitle: data.subtitle || defaults.subtitle,
    body: data.body || defaults.body,
    contactEmail: data.contact_email || defaults.contactEmail
  };
}

function applyPageContent(content) {
  setText("publicPageTitle", content.title);
  setText("publicPageSubtitle", content.subtitle);
  setParagraphContent("publicPageBody", content.body);

  const emailLink = document.getElementById("sponsorshipEmailLink");
  if (emailLink && content.contactEmail) {
    emailLink.href = `mailto:${content.contactEmail}`;
    emailLink.textContent = content.contactEmail;
  }
}

async function loadTeamMembers() {
  const teamGrid = document.getElementById("publicTeamGrid");
  if (!teamGrid || !publicSupabase) {
    return;
  }

  const { data, error } = await publicSupabase
    .from("team_members")
    .select("name,role,image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data) || !data.length) {
    return;
  }

  teamGrid.innerHTML = data
    .map(
      (member) => `
        <div class="team-member-card">
          ${member.image_url ? `<img src="${escapeHtml(member.image_url)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none'" />` : ""}
          <h3>${escapeHtml(member.name)}</h3>
          <p>${escapeHtml(member.role || "")}</p>
        </div>
      `
    )
    .join("");
}

async function trackVisit(pageSlug) {
  if (!publicSupabase) {
    return;
  }

  // Skip if already counted in this browser tab/session
  const sessionKey = `visit_counted_${pageSlug}`;
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }
  sessionStorage.setItem(sessionKey, "1");

  // Generate or retrieve persistent visitor ID (survives browser restarts)
  let visitorId = localStorage.getItem("ftc_visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("ftc_visitor_id", visitorId);
  }

  const today = new Date().toISOString().split("T")[0];

  // Upsert: one row per visitor+page+day so different tabs/browsers are deduplicated per day
  await publicSupabase.from("page_visits").upsert(
    {
      page_slug: pageSlug,
      visitor_id: visitorId,
      visit_date: today,
      visited_at: new Date().toISOString()
    },
    { onConflict: "visitor_id,page_slug,visit_date", ignoreDuplicates: true }
  );
}

async function loadFeedback(pageSlug) {
  const feedbackList = document.getElementById("feedbackList");
  if (!feedbackList || !publicSupabase) {
    return;
  }

  // On feedback.html (slug = "feedback") load all recent feedback across pages
  const isFeedbackPage = pageSlug === "feedback";
  let query = publicSupabase
    .from("feedback")
    .select("name,comment,page_slug,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!isFeedbackPage) {
    query = query.eq("page_slug", pageSlug);
  }

  const { data, error } = await query;

  if (error || !Array.isArray(data) || !data.length) {
    feedbackList.innerHTML = "<p>No feedback yet. Be the first to share your thoughts.</p>";
    return;
  }

  feedbackList.innerHTML = data
    .map(
      (item) => `
        <div class="feedback-item">
          <p><strong>${escapeHtml(item.name || "Guest")}</strong>${isFeedbackPage ? ` &mdash; <em>${escapeHtml(item.page_slug || "general")}</em>` : ""}</p>
          <p>${escapeHtml(item.comment || "")}</p>
        </div>
      `
    )
    .join("");
}

function setupFeedbackForm(pageSlug) {
  const form = document.getElementById("feedbackForm");
  const status = document.getElementById("feedbackStatus");

  if (!form || !status || !publicSupabase) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = String(document.getElementById("feedbackName")?.value || "").trim();
    const email = String(document.getElementById("feedbackEmail")?.value || "").trim();
    const comment = String(document.getElementById("feedbackComment")?.value || "").trim();

    // On feedback.html, the user picks a page from the dropdown
    const pageSelect = document.getElementById("feedbackPage");
    const targetSlug = pageSelect ? pageSelect.value : pageSlug;

    if (!name || !comment) {
      status.className = "error";
      status.textContent = "Please enter your name and feedback.";
      return;
    }

    const { error } = await publicSupabase.from("feedback").insert({
      page_slug: targetSlug,
      name,
      email: email || null,
      comment,
      created_at: new Date().toISOString()
    });

    if (error) {
      status.className = "error";
      status.textContent = `Could not save feedback: ${error.message}`;
      return;
    }

    status.className = "success";
    status.textContent = "Thank you! Your feedback has been submitted.";
    form.reset();
    loadFeedback(pageSlug);
  });
}

async function initPublicPortal() {
  if (!window.supabase) {
    return;
  }

  publicSupabase = window.supabase.createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  const pageSlug = getPageSlug();
  const content = await loadPageContent(pageSlug);

  applyPageContent(content);
  await loadTeamMembers();
  await loadFeedback(pageSlug);
  setupFeedbackForm(pageSlug);
  trackVisit(pageSlug);
}

initPublicPortal();
