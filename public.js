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
let _accountDocListenerAdded = false;
let _globalTeamCardListenerAdded = false;
let _loginScriptLoadPromise = null;

const PUBLIC_ROUTE_BY_SLUG = {
  home: "index.html",
  about: "about.html",
  team: "team.html",
  schedule: "schedule.html",
  sponsorship: "sponsorship.html",
  resources: "resources.html",
  feedback: "feedback.html",
  login: "login.html"
};

const PUBLIC_SLUG_BY_FILE = Object.entries(PUBLIC_ROUTE_BY_SLUG).reduce((acc, [slug, fileName]) => {
  acc[fileName] = slug;
  return acc;
}, {});

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

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") {
    return "index.html";
  }
  const parts = pathname.split("/");
  return parts[parts.length - 1] || "index.html";
}

function getSlugFromPathname(pathname) {
  const fileName = normalizePathname(pathname);
  return PUBLIC_SLUG_BY_FILE[fileName] || null;
}

function getCurrentPublicFileName() {
  return PUBLIC_ROUTE_BY_SLUG[getPageSlug()] || normalizePathname(window.location.pathname);
}

function updateActiveNavLink(pageSlug) {
  const targetFile = PUBLIC_ROUTE_BY_SLUG[pageSlug];
  if (!targetFile) {
    return;
  }

  document.querySelectorAll(".top-nav-list a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href.endsWith(".html")) {
      return;
    }
    link.classList.toggle("active", href === targetFile);
  });
}

function shouldHandleAsSpaNavigation(anchor) {
  if (!anchor) {
    return false;
  }

  const href = anchor.getAttribute("href") || "";
  if (!href || href.startsWith("#") || anchor.hasAttribute("download")) {
    return false;
  }

  if (anchor.target && anchor.target.toLowerCase() === "_blank") {
    return false;
  }

  const [pathOnly] = href.split("#");
  return Boolean(PUBLIC_SLUG_BY_FILE[pathOnly]);
}

async function ensureLoginScriptLoaded() {
  if (window.__teamPortalAppLoaded) {
    return;
  }

  if (!_loginScriptLoadPromise) {
    _loginScriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "app.js";
      script.onload = () => {
        window.__teamPortalAppLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load app.js"));
      document.body.appendChild(script);
    });
  }

  await _loginScriptLoadPromise;
}

function setMainTransitionState(isTransitioning) {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  main.classList.toggle("spa-transitioning", Boolean(isTransitioning));
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
    .select("name,roles,grade,image_url,bio")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data) || !data.length) {
    return;
  }

  teamGrid.innerHTML = data
    .map(
      (member) => {
        const rolesRaw = member.roles || "";
        const rolesArr = rolesRaw ? rolesRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
        const roleDisplay = formatRolesForDisplay(rolesArr);
        return `
        <div class="team-member-card" data-name="${escapeHtml(member.name)}" data-roles="${escapeHtml(rolesRaw||"")}" data-grade="${escapeHtml(member.grade||"")}" data-bio="${escapeHtml(member.bio||"")}" data-image="${escapeHtml(member.image_url||"")}">
          ${member.image_url ? `<img src="${escapeHtml(member.image_url)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none'" />` : "<div style=\"width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,0.03);margin-bottom:12px;\"></div>"}
          <h3>${escapeHtml(member.name)}</h3>
          ${member.grade ? `<div class="member-grade">Grade: ${escapeHtml(member.grade)}</div>` : ''}
          <p>${escapeHtml(roleDisplay)}</p>
        </div>
      `}
    )
    .join("");

  // Use event delegation for clicks to open member modal
  if (teamGrid.dataset.modalBound !== "1") {
    teamGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".team-member-card");
      if (!card) return;
      let name = card.getAttribute("data-name");
      let rolesRaw = card.getAttribute("data-roles") || "";
      let grade = card.getAttribute("data-grade") || "";
      let bio = card.getAttribute("data-bio");
      let image = card.getAttribute("data-image");
      if (!name) {
        const h3 = card.querySelector("h3");
        name = h3 ? h3.textContent.trim() : "";
      }
      if (!rolesRaw) {
        const p = card.querySelector("p");
        rolesRaw = p ? p.textContent.trim() : "";
      }
      if (!image) {
        const img = card.querySelector("img");
        image = img ? img.getAttribute("src") : "";
      }
      const rolesArr = rolesRaw ? rolesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const roleDisplay = formatRolesForDisplay(rolesArr);
      showMemberModal({ name, role: roleDisplay, grade, bio, image, isEditable: false });
    });
    teamGrid.dataset.modalBound = "1";
  }
}

function formatRolesForDisplay(rolesArr) {
  if (!Array.isArray(rolesArr) || rolesArr.length === 0) return "";
  const sorted = rolesArr.slice().sort((a,b)=>a.localeCompare(b));
  if (sorted.length === 1) return sorted[0];
  if (sorted.length === 2) return `${sorted[0]} and ${sorted[1]}`;
  return `${sorted.slice(0, -1).join(', ')}, and ${sorted[sorted.length - 1]}`;
}

async function loadAlumni() {
  const alumniGrid = document.getElementById("publicAlumniGrid");
  if (!alumniGrid || !publicSupabase) {
    return;
  }

  const { data, error } = await publicSupabase
    .from("alumni")
    .select("name,role,year,image_url,bio")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data) || !data.length) {
    return;
  }

  alumniGrid.innerHTML = data
    .map(
      (a) => `
        <div class="team-member-card" data-name="${escapeHtml(a.name)}" data-role="${escapeHtml(a.role||"")}" data-bio="${escapeHtml(a.bio||"")}" data-image="${escapeHtml(a.image_url||"")}">
          ${a.image_url ? `<img src="${escapeHtml(a.image_url)}" alt="${escapeHtml(a.name)}" onerror="this.style.display='none'" />` : "<div style=\"width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,0.03);margin-bottom:12px;\"></div>"}
          <h3>${escapeHtml(a.name)}</h3>
          <p>${escapeHtml(a.role || "")} ${a.year ? `— ${escapeHtml(String(a.year))}` : ""}</p>
        </div>
      `
    )
    .join("");

  // delegation for alumni clicks
  if (alumniGrid.dataset.modalBound !== "1") {
    alumniGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".team-member-card");
      if (!card) return;
      let name = card.getAttribute("data-name");
      let role = card.getAttribute("data-role");
      let bio = card.getAttribute("data-bio");
      let image = card.getAttribute("data-image");
      if (!name) {
        const h3 = card.querySelector("h3");
        name = h3 ? h3.textContent.trim() : "";
      }
      if (!role) {
        const p = card.querySelector("p");
        role = p ? p.textContent.trim() : "";
      }
      if (!image) {
        const img = card.querySelector("img");
        image = img ? img.getAttribute("src") : "";
      }
      showMemberModal({ name, role, bio, image, isEditable: false });
    });
    alumniGrid.dataset.modalBound = "1";
  }

  if (!_globalTeamCardListenerAdded) {
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".team-member-card");
      if (!card) return;
      const inTeam = card.closest("#publicTeamGrid");
      const inAlumni = card.closest("#publicAlumniGrid");
      if (inTeam || inAlumni) return;
      if (document.getElementById("memberModalOverlay")?.classList.contains("is-open")) return;
      let name = card.getAttribute("data-name");
      let rolesRaw = card.getAttribute("data-roles") || "";
      let grade = card.getAttribute("data-grade") || "";
      let bio = card.getAttribute("data-bio");
      let image = card.getAttribute("data-image");
      if (!name) {
        const h3 = card.querySelector("h3");
        name = h3 ? h3.textContent.trim() : "";
      }
      if (!rolesRaw) {
        const p = card.querySelector("p");
        rolesRaw = p ? p.textContent.trim() : "";
      }
      if (!image) {
        const img = card.querySelector("img");
        image = img ? img.getAttribute("src") : "";
      }
      const rolesArr = rolesRaw ? rolesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const roleDisplay = formatRolesForDisplay(rolesArr);
      showMemberModal({ name, role: roleDisplay, grade, bio, image, isEditable: false });
    });
    _globalTeamCardListenerAdded = true;
  }
}

// Simple reusable modal for member details
function showMemberModal({ name, role, bio, image, isEditable = false, onSave }) {
  let overlay = document.getElementById('memberModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'memberModalOverlay';
    overlay.className = 'member-modal-overlay';
    overlay.innerHTML = `
      <div class="member-modal" role="dialog" aria-modal="true">
        <div class="member-media"><img id="modalMemberImage" src="" alt=""/></div>
        <div class="member-body">
          <h3 id="modalMemberName"></h3>
          <div class="meta"><span id="modalMemberRole"></span> <span id="modalMemberGrade"></span></div>
          <div class="bio" id="modalMemberBio"></div>
          <div class="modal-actions">
            <button id="modalCloseBtn" type="button">Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#modalCloseBtn').addEventListener('click', () => {
      overlay.classList.remove('is-open');
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('is-open');
    });
  }

  const img = overlay.querySelector('#modalMemberImage');
  const nm = overlay.querySelector('#modalMemberName');
  const rl = overlay.querySelector('#modalMemberRole');
  const gr = overlay.querySelector('#modalMemberGrade');
  const bioEl = overlay.querySelector('#modalMemberBio');

  img.src = image || '';
  img.alt = name || 'Member image';
  nm.textContent = name || '';
  rl.textContent = role || '';
  gr.textContent = grade ? `Grade: ${grade}` : '';
  bioEl.textContent = bio || '';

  overlay.classList.add('is-open');
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

  if (form.dataset.boundSubmit === "1") {
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

  form.dataset.boundSubmit = "1";
}

async function hydrateCurrentPage() {
  const pageSlug = getPageSlug();

  updateActiveNavLink(pageSlug);

  if (pageSlug === "login") {
    await ensureLoginScriptLoaded();
    return;
  }

  const content = await loadPageContent(pageSlug);

  applyPageContent(content);
  await loadTeamMembers();
  await loadAlumni();

  document.querySelectorAll(".section-toggle").forEach((btn) => {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const el = document.getElementById(targetId);
      if (!el) return;
      const isCollapsed = el.classList.toggle("collapsed");
      btn.setAttribute("aria-pressed", isCollapsed ? "true" : "false");
    });
  });

  await loadFeedback(pageSlug);
  setupFeedbackForm(pageSlug);
  trackVisit(pageSlug);
}

async function navigateToPublicPage(pathname, { replaceHistory = false } = {}) {
  const targetSlug = getSlugFromPathname(pathname);
  if (!targetSlug) {
    window.location.href = pathname;
    return;
  }

  const currentFile = getCurrentPublicFileName();
  const targetFile = PUBLIC_ROUTE_BY_SLUG[targetSlug];
  if (currentFile === targetFile) {
    return;
  }

  setMainTransitionState(true);

  try {
    const response = await fetch(targetFile, {
      headers: { "X-Requested-With": "spa" }
    });

    if (!response.ok) {
      window.location.href = targetFile;
      return;
    }

    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const nextMain = parsed.querySelector("main");
    const currentMain = document.querySelector("main");
    if (!nextMain || !currentMain) {
      window.location.href = targetFile;
      return;
    }

    currentMain.replaceWith(nextMain);
    document.body.setAttribute("data-page", targetSlug);
    document.title = parsed.title || document.title;

    const navUrl = targetFile;
    if (replaceHistory) {
      window.history.replaceState({ page: targetSlug }, "", navUrl);
    } else {
      window.history.pushState({ page: targetSlug }, "", navUrl);
    }

    await hydrateCurrentPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    window.location.href = pathname;
  } finally {
    setMainTransitionState(false);
  }
}

function setupSpaNavigation() {
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");
    if (!shouldHandleAsSpaNavigation(anchor)) {
      return;
    }

    const href = anchor.getAttribute("href");
    if (!href) {
      return;
    }

    event.preventDefault();
    navigateToPublicPage(href);
  });

  window.addEventListener("popstate", () => {
    const slug = getSlugFromPathname(window.location.pathname);
    if (!slug) {
      return;
    }
    navigateToPublicPage(PUBLIC_ROUTE_BY_SLUG[slug], { replaceHistory: true });
  });
}

async function initPublicPortal() {
  if (!window.supabase) {
    return;
  }

  publicSupabase = window.supabase.createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  initAccountNavPublic();
  setupSpaNavigation();

  const slugFromPath = getSlugFromPathname(window.location.pathname);
  if (slugFromPath) {
    document.body.setAttribute("data-page", slugFromPath);
  }
  await hydrateCurrentPage();
}

async function updateAccountUiPublic() {
  const accountBtn = document.getElementById("accountBtn");
  const accountDropdown = document.getElementById("accountDropdown");
  const teamMenuBtn = document.getElementById("teamMenuBtn");
  const accountLogoutBtn = document.getElementById("accountLogoutBtn");

  if (!publicSupabase || !accountBtn) {
    return;
  }

  const { data } = await publicSupabase.auth.getUser();
  const user = data?.user || null;

  if (user) {
    accountBtn.textContent = "My Account";
    accountBtn.onclick = (e) => {
      e.stopPropagation();
      if (accountDropdown) accountDropdown.classList.toggle("hidden");
    };

    if (teamMenuBtn) {
      teamMenuBtn.onclick = () => {
        navigateToPublicPage("login.html");
      };
    }

    if (accountLogoutBtn) {
      accountLogoutBtn.onclick = async () => {
        await publicSupabase.auth.signOut();
        if (accountDropdown) accountDropdown.classList.add("hidden");
        accountBtn.textContent = "Login";
        navigateToPublicPage("index.html", { replaceHistory: true });
      };
    }
  } else {
    accountBtn.textContent = "Login";
    accountBtn.onclick = (e) => {
      e.preventDefault();
      navigateToPublicPage("login.html");
    };
    if (accountDropdown) {
      accountDropdown.classList.add("hidden");
    }
  }

  // Close dropdown when clicking outside — only add one global handler
  if (!_accountDocListenerAdded) {
    document.addEventListener("click", () => {
      const dd = document.getElementById("accountDropdown");
      if (dd && !dd.classList.contains("hidden")) {
        dd.classList.add("hidden");
      }
    });
    _accountDocListenerAdded = true;
  }
}

function initAccountNavPublic() {
  // Replace existing login link in nav with account button + dropdown
  const loginLink = document.querySelector('.top-nav-list a[href="login.html"]');
  if (!loginLink) return;

  const li = loginLink.closest('li');
  if (!li) return;

  const wrapper = document.createElement('li');
  wrapper.className = 'account-nav';
  wrapper.innerHTML = `
    <a id="accountBtn" class="account-btn" href="#">Login</a>
    <div id="accountDropdown" class="account-dropdown hidden" aria-hidden="true">
      <button id="teamMenuBtn" type="button">Team Menu</button>
      <button id="accountLogoutBtn" type="button">Log Out</button>
    </div>
  `;

  li.parentElement.replaceChild(wrapper, li);
  // insert theme toggle before account wrapper
  const ul = wrapper.parentElement;
  const themeLi = document.createElement('li');
  themeLi.innerHTML = `<a id="themeToggleBtn" class="theme-toggle" href="#" aria-label="Toggle theme"><span class="toggle-switch"><svg class="icon sun" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4"/></svg><svg class="icon moon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg><span class="toggle-knob" aria-hidden="true"></span></span></a>`;
  ul.insertBefore(themeLi, wrapper);

  // wire theme toggle
  const themeToggle = document.getElementById('themeToggleBtn');
  function applyStoredTheme() {
    const t = localStorage.getItem('site-theme') || 'light';
    const isDark = t === 'dark';
    if (isDark) document.documentElement.classList.add('dark-theme');
    else document.documentElement.classList.remove('dark-theme');
    if (themeToggle) themeToggle.classList.toggle('is-dark', isDark);
  }
  applyStoredTheme();
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isDark = document.documentElement.classList.toggle('dark-theme');
      localStorage.setItem('site-theme', isDark ? 'dark' : 'light');
      themeToggle.classList.toggle('is-dark', isDark);
    });
  }

  updateAccountUiPublic();

  // Listen for auth state changes
  if (publicSupabase && publicSupabase.auth && publicSupabase.auth.onAuthStateChange) {
    publicSupabase.auth.onAuthStateChange(() => {
      updateAccountUiPublic();
    });
  }
}

initPublicPortal();
