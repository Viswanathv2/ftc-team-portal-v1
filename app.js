// Kids can customize starter menu defaults in this list.
const DEFAULT_NAV_ITEMS = [
  {
    id: "announcements",
    title: "Announcements",
    content: "Coach notes, meeting reminders, and tournament updates go here."
  },
  {
    id: "schedule",
    title: "Build Schedule",
    content: "Add this week's goals and who is working on each task."
  },
  {
    id: "resources",
    title: "Learning Resources",
    content: "Put links to tutorial videos, docs, and checklists here."
  },
  {
    id: "checklist",
    title: "Competition Checklist",
    content: "List what to pack before leaving: battery charger, spare parts, and notebook."
  }
];

// Replace these with your Supabase project URL and anon public key.
const SUPABASE_URL = "https://hurchbtvwjrdxovkswjd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tZEFxppT7q0kC0JpJo_wYw_-WIKPJCm";
const AUTH_REGISTER_COOLDOWN_SECONDS = 45;
const AUTH_LOGIN_COOLDOWN_SECONDS = 10;
const TEAM_ASSETS_BUCKET = "team-assets";
const PORTAL_PAGE_DEFS = [
  {
    slug: "home",
    label: "Home",
    defaultTitle: "FTC Team Portal",
    defaultSubtitle: "Welcome to Team 25795 - Architechs",
    defaultBody: "We are Team 25795 Architechs from Mechanicsburg, Pennsylvania."
  },
  {
    slug: "about",
    label: "Team Story",
    defaultTitle: "Our Journey",
    defaultSubtitle: "How Architechs grew through robotics",
    defaultBody: "Share your team story and milestones here."
  },
  {
    slug: "team",
    label: "Meet the Team",
    defaultTitle: "Team Members",
    defaultSubtitle: "Team 25795 - Architechs",
    defaultBody: "Introduce your team members here."
  },
  {
    slug: "schedule",
    label: "Schedule",
    defaultTitle: "Current Plan",
    defaultSubtitle: "Upcoming plans for Team 25795",
    defaultBody: "Add your meeting schedule, competitions, and build sessions."
  },
  {
    slug: "resources",
    label: "Resources",
    defaultTitle: "Latest Updates",
    defaultSubtitle: "Helpful materials for our team and visitors",
    defaultBody: "Post announcements and learning resources here."
  },
  {
    slug: "sponsorship",
    label: "Sponsorship Needed",
    defaultTitle: "Sponsorship Opportunities",
    defaultSubtitle: "Partner with Team 25795 - Architechs",
    defaultBody: "Architechs is actively seeking sponsorship from local businesses and community organizations.",
    defaultContactEmail: "ftc25795@gmail.com"
  }
];

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const landingView = document.getElementById("landingView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginSuccess = document.getElementById("loginSuccess");
const navList = document.getElementById("navList");
const contentArea = document.getElementById("contentArea");
const welcomeText = document.getElementById("welcomeText");
const contentSubtitle = document.getElementById("contentSubtitle");
const logoutBtn = document.getElementById("logoutBtn");
const coachAdminBtn = document.getElementById("coachAdminBtn");
const modeLoginBtn = document.getElementById("modeLoginBtn");
const modeRegisterBtn = document.getElementById("modeRegisterBtn");
const submitBtn = document.getElementById("submitBtn");
const retryBtn = document.getElementById("retryBtn");
const displayNameWrap = document.getElementById("displayNameWrap");
const displayNameInput = document.getElementById("displayName");
const goToLoginBtn = document.getElementById("goToLoginBtn");
const goToRegisterBtn = document.getElementById("goToRegisterBtn");
const backToLandingBtn = document.getElementById("backToLandingBtn");

let authMode = "login";
let supabaseClient = null;
let navItems = [...DEFAULT_NAV_ITEMS];
let selectedMenuId = DEFAULT_NAV_ITEMS[0].id;
let currentUser = null;
let currentProfile = { displayName: "Member", isCoach: false, isPortalAdmin: false };
let authCooldownUntil = 0;
let authCooldownMode = "login";
let cooldownIntervalId = null;
let isSubmitInFlight = false;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clearMessages() {
  if (loginError) {
    loginError.textContent = "";
  }
  if (loginSuccess) {
    loginSuccess.textContent = "";
  }
}

function setMode(mode) {
  if (!modeLoginBtn || !modeRegisterBtn || !displayNameWrap || !displayNameInput || !submitBtn) {
    return;
  }

  authMode = mode;
  const isRegister = mode === "register";
  modeLoginBtn.classList.toggle("active", !isRegister);
  modeRegisterBtn.classList.toggle("active", isRegister);
  displayNameWrap.classList.toggle("hidden", !isRegister);
  displayNameInput.required = isRegister;
  submitBtn.textContent = isRegister ? "Create Account" : "Log In";
  clearMessages();
  updateCooldownUi();
}

function setSubmitEnabled(enabled) {
  if (!submitBtn) {
    return;
  }

  submitBtn.disabled = !enabled;
  submitBtn.style.opacity = enabled ? "1" : "0.7";
  submitBtn.style.cursor = enabled ? "pointer" : "not-allowed";
}

function isRateLimitError(error) {
  const status = Number(error?.status || 0);
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return (
    status === 429 ||
    code.includes("rate_limit") ||
    message.includes("email rate limit") ||
    message.includes("rate limit exceeded")
  );
}

function getDefaultSubmitText() {
  return authMode === "register" ? "Create Account" : "Log In";
}

function getCooldownSecondsForMode(mode) {
  return mode === "register"
    ? AUTH_REGISTER_COOLDOWN_SECONDS
    : AUTH_LOGIN_COOLDOWN_SECONDS;
}

function setRetryButtonVisible(visible) {
  if (!retryBtn) {
    return;
  }

  retryBtn.classList.toggle("hidden", !visible);
}

function updateRetryButton(remainingSeconds) {
  if (!retryBtn) {
    return;
  }

  setRetryButtonVisible(true);

  if (remainingSeconds > 0) {
    retryBtn.disabled = true;
    retryBtn.textContent = `Try again in ${remainingSeconds}s`;
    return;
  }

  retryBtn.disabled = false;
  retryBtn.textContent = "Try Again";
}

function setCooldownMessage(remainingSeconds) {
  if (!loginError || !loginSuccess) {
    return;
  }

  if (remainingSeconds > 0) {
    loginSuccess.textContent = "";
    loginError.textContent = `Too many attempts in ${authCooldownMode} mode. Please wait ${remainingSeconds} seconds.`;
    return;
  }

  loginError.textContent = "";
  loginSuccess.textContent = "You can try again now.";
}

function isCooldownActiveForCurrentMode() {
  return Date.now() < authCooldownUntil && authMode === authCooldownMode;
}

function updateCooldownUi() {
  if (!submitBtn) {
    return;
  }

  if (Date.now() < authCooldownUntil && authMode !== authCooldownMode) {
    submitBtn.textContent = getDefaultSubmitText();
    if (!isSubmitInFlight) {
      setSubmitEnabled(true);
    }
    clearMessages();
    setRetryButtonVisible(false);
    return;
  }

  const remainingSeconds = Math.ceil((authCooldownUntil - Date.now()) / 1000);
  if (remainingSeconds <= 0) {
    authCooldownUntil = 0;
    submitBtn.textContent = getDefaultSubmitText();
    if (!isSubmitInFlight) {
      setSubmitEnabled(true);
    }
    updateRetryButton(0);
    setCooldownMessage(0);
    if (cooldownIntervalId) {
      clearInterval(cooldownIntervalId);
      cooldownIntervalId = null;
    }
    return;
  }

  setSubmitEnabled(false);
  submitBtn.textContent = `Wait ${remainingSeconds}s`;
  updateRetryButton(remainingSeconds);
  setCooldownMessage(remainingSeconds);
}

function startAuthCooldown(mode) {
  const seconds = getCooldownSecondsForMode(mode);
  authCooldownMode = mode;
  authCooldownUntil = Date.now() + seconds * 1000;
  updateCooldownUi();

  if (cooldownIntervalId) {
    clearInterval(cooldownIntervalId);
  }

  cooldownIntervalId = setInterval(updateCooldownUi, 1000);
}

function setCoachAdminButtonVisible(isCoach) {
  if (!coachAdminBtn) {
    return;
  }

  coachAdminBtn.classList.toggle("hidden", !isCoach);
}

function setPortalAdminButtonVisible(isPortalAdmin) {
  const portalAdminBtn = document.getElementById("portalAdminBtn");
  if (!portalAdminBtn) {
    return;
  }

  portalAdminBtn.classList.toggle("hidden", !isPortalAdmin);
}

function clearSelectionStyles() {
  if (!navList || !coachAdminBtn) {
    return;
  }

  navList.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
  coachAdminBtn.classList.remove("active");
  const portalAdminBtn = document.getElementById("portalAdminBtn");
  if (portalAdminBtn) {
    portalAdminBtn.classList.remove("active");
  }
}

function renderContent(itemId) {
  if (!contentSubtitle || !contentArea || !navList) {
    return;
  }

  const item = navItems.find((x) => x.id === itemId) || navItems[0];
  if (!item) {
    return;
  }

  selectedMenuId = item.id;
  contentSubtitle.textContent = "Pick an item from the left menu.";
  contentArea.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.content)}</p>`;

  clearSelectionStyles();
  navList.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === item.id);
  });
}

function buildNav() {
  if (!navList) {
    return;
  }

  navList.innerHTML = "";

  navItems.forEach((item) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.title;
    button.dataset.id = item.id;
    button.addEventListener("click", () => renderContent(item.id));
    li.appendChild(button);
    navList.appendChild(li);
  });

  renderContent(selectedMenuId);
}

function showApp(displayName, isCoach, isPortalAdmin = false) {
  if (!welcomeText || !loginView || !appView) {
    return;
  }

  welcomeText.textContent = `Welcome, ${displayName}`;
  if (landingView) {
    landingView.classList.add("hidden");
  }
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  setCoachAdminButtonVisible(isCoach);
  setPortalAdminButtonVisible(isPortalAdmin);
  buildNav();
}

function showLogin(mode = "login") {
  setMode(mode);
  if (landingView) {
    landingView.classList.add("hidden");
  }
  if (loginView) {
    loginView.classList.remove("hidden");
  }
  if (appView) {
    appView.classList.add("hidden");
  }
}

function showLanding() {
  if (landingView) {
    landingView.classList.remove("hidden");
    if (loginView) {
      loginView.classList.add("hidden");
    }
    if (appView) {
      appView.classList.add("hidden");
    }
    return;
  }

  showLogin("login");
}

function safeNameFromEmail(email) {
  return String(email || "Member").split("@")[0] || "Member";
}

function mapPortalPageRows(rows) {
  const bySlug = new Map((rows || []).map((row) => [row.slug, row]));
  return PORTAL_PAGE_DEFS.map((def) => {
    const row = bySlug.get(def.slug) || {};
    return {
      slug: def.slug,
      label: def.label,
      title: row.title || def.defaultTitle,
      subtitle: row.subtitle || def.defaultSubtitle,
      body: row.body || def.defaultBody,
      contactEmail: row.contact_email || def.defaultContactEmail || ""
    };
  });
}

async function loadPortalPages() {
  const { data, error } = await supabaseClient
    .from("portal_pages")
    .select("slug,title,subtitle,body,contact_email");

  if (error) {
    return mapPortalPageRows([]);
  }

  return mapPortalPageRows(data);
}

async function savePortalPages(items) {
  const payload = items.map((item) => ({
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle,
    body: item.body,
    contact_email: item.contactEmail || null
  }));

  const { error } = await supabaseClient.from("portal_pages").upsert(payload, {
    onConflict: "slug"
  });

  return error;
}

async function loadTeamMembers() {
  const { data, error } = await supabaseClient
    .from("team_members")
    .select("id,name,role,image_url,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

async function uploadTeamMemberImage(file) {
  if (!file) {
    return null;
  }

  const fileName = `${Date.now()}-${String(file.name || "member").replace(/[^a-zA-Z0-9_.-]/g, "-")}`;
  const filePath = `members/${fileName}`;
  const { error } = await supabaseClient.storage
    .from(TEAM_ASSETS_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabaseClient.storage.from(TEAM_ASSETS_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

async function createTeamMember(member) {
  const { error } = await supabaseClient.from("team_members").insert(member);
  return error;
}

async function deleteTeamMember(memberId) {
  const { error } = await supabaseClient.from("team_members").delete().eq("id", memberId);
  return error;
}

async function loadVisitSummary() {
  const { data, error } = await supabaseClient
    .from("page_visits")
    .select("page_slug,visitor_id");

  if (error) {
    return [];
  }

  // Count unique visitor_ids per page
  const uniqueVisitors = {};
  (data || []).forEach((row) => {
    const slug = row.page_slug || "unknown";
    const vid = row.visitor_id || "anon";
    if (!uniqueVisitors[slug]) {
      uniqueVisitors[slug] = new Set();
    }
    uniqueVisitors[slug].add(vid);
  });

  return Object.entries(uniqueVisitors)
    .sort((a, b) => b[1].size - a[1].size)
    .map(([slug, visitors]) => ({ slug, count: visitors.size }));
}

async function loadFeedback() {
  const { data, error } = await supabaseClient
    .from("feedback")
    .select("id,page_slug,name,email,comment,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  return data || [];
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function downloadCsv(fileName, headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  const csvContent = [headerLine, ...rowLines].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function mergeMenuItemsFromDb(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [...DEFAULT_NAV_ITEMS];
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  return DEFAULT_NAV_ITEMS.map((defaultItem) => {
    const dbItem = byId.get(defaultItem.id);
    if (!dbItem) {
      return defaultItem;
    }

    return {
      id: defaultItem.id,
      title: dbItem.title || defaultItem.title,
      content: dbItem.content || defaultItem.content
    };
  });
}

async function loadMenuItems() {
  const { data, error } = await supabaseClient
    .from("menu_items")
    .select("id,title,content");

  if (error) {
    navItems = [...DEFAULT_NAV_ITEMS];
    return;
  }

  navItems = mergeMenuItemsFromDb(data);
}

async function fetchProfile(user) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("display_name,is_coach,is_portal_admin")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return {
      displayName: safeNameFromEmail(user.email),
      isCoach: false,
      isPortalAdmin: false
    };
  }

  return {
    displayName: data.display_name || safeNameFromEmail(user.email),
    isCoach: Boolean(data.is_coach),
    isPortalAdmin: Boolean(data.is_portal_admin)
  };
}

async function registerUser(email, password, displayName) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Registration failed. Try again.");
  }

  const { error: profileError } = await supabaseClient.from("profiles").upsert({
    user_id: data.user.id,
    display_name: displayName,
    is_coach: false,
    is_portal_admin: false
  });

  if (profileError) {
    throw profileError;
  }
}

async function loginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Login failed. Check your credentials.");
  }

  return data.user;
}

function renderCoachAdmin() {
  if (!currentProfile.isCoach) {
    return;
  }

  contentSubtitle.textContent = "Coach-only editor: update menu labels and text for all users.";
  clearSelectionStyles();
  coachAdminBtn.classList.add("active");

  const itemsMarkup = navItems
    .map(
      (item) => `
      <section class="admin-item" data-id="${escapeHtml(item.id)}">
        <h3>${escapeHtml(item.id)}</h3>
        <label for="title-${escapeHtml(item.id)}">Menu Title</label>
        <input id="title-${escapeHtml(item.id)}" type="text" data-id="${escapeHtml(item.id)}" data-field="title" value="${escapeHtml(item.title)}" required />
        <label for="content-${escapeHtml(item.id)}">Menu Text</label>
        <textarea id="content-${escapeHtml(item.id)}" data-id="${escapeHtml(item.id)}" data-field="content" required>${escapeHtml(item.content)}</textarea>
      </section>
    `
    )
    .join("");

  contentArea.innerHTML = `
    <h3>Coach Admin</h3>
    <p>Edit menu titles and text, then save.</p>
    <form id="coachAdminForm" class="admin-form">
      ${itemsMarkup}
      <button type="submit" class="admin-save-btn">Save Changes</button>
      <p id="adminStatus" class="success" aria-live="polite"></p>
    </form>
  `;

  const coachAdminForm = document.getElementById("coachAdminForm");
  const adminStatus = document.getElementById("adminStatus");

  coachAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentProfile.isCoach) {
      adminStatus.className = "error";
      adminStatus.textContent = "Only coaches can save changes.";
      return;
    }

    const updated = navItems.map((item) => {
      const titleInput = coachAdminForm.querySelector(
        `input[data-id="${item.id}"][data-field="title"]`
      );
      const contentInput = coachAdminForm.querySelector(
        `textarea[data-id="${item.id}"][data-field="content"]`
      );

      return {
        id: item.id,
        title: String(titleInput?.value || "").trim() || item.title,
        content: String(contentInput?.value || "").trim() || item.content
      };
    });

    const { error } = await supabaseClient.from("menu_items").upsert(updated, {
      onConflict: "id"
    });

    if (error) {
      adminStatus.className = "error";
      adminStatus.textContent = `Save failed: ${error.message}`;
      return;
    }

    navItems = updated;
    adminStatus.className = "success";
    adminStatus.textContent = "Saved. Team members will now see the updated menu text.";
    buildNav();
    renderCoachAdmin();
  });
}

function renderPortalAdmin(activeTab = "pages") {
  if (!currentProfile.isPortalAdmin) {
    return;
  }

  contentSubtitle.textContent = "Portal Admin";
  clearSelectionStyles();

  const portalAdminBtn = document.getElementById("portalAdminBtn");
  if (portalAdminBtn) {
    portalAdminBtn.classList.add("active");
  }

  contentArea.innerHTML = `
    <h3>Portal Admin</h3>

    <div class="portal-admin-tabs" role="tablist" aria-label="Admin sections">
      <button class="portal-admin-tab${activeTab === "pages" ? " active" : ""}" data-tab="pages" type="button">Public Pages</button>
      <button class="portal-admin-tab${activeTab === "members" ? " active" : ""}" data-tab="members" type="button">Team Members</button>
      <button class="portal-admin-tab${activeTab === "insights" ? " active" : ""}" data-tab="insights" type="button">Portal Insights</button>
    </div>

    <!-- TAB: Public Pages -->
    <div id="adminTab-pages" class="portal-admin-panel${activeTab === "pages" ? "" : " hidden"}">
      <p>Edit the title, subtitle, and body text for each public page. Click a section to expand it.</p>
      <form id="portalAdminForm" class="admin-form">
        ${PORTAL_PAGE_DEFS.map((def) => `
          <details class="admin-collapsible" id="collapse-${escapeHtml(def.slug)}">
            <summary class="admin-collapsible-summary">${escapeHtml(def.label)}</summary>
            <div class="admin-collapsible-body">
              <label for="page-title-${escapeHtml(def.slug)}">Page Title</label>
              <input id="page-title-${escapeHtml(def.slug)}" type="text" data-page="${escapeHtml(def.slug)}" data-field="title" value="${escapeHtml(def.defaultTitle)}" />
              <label for="page-subtitle-${escapeHtml(def.slug)}">Subtitle</label>
              <input id="page-subtitle-${escapeHtml(def.slug)}" type="text" data-page="${escapeHtml(def.slug)}" data-field="subtitle" value="${escapeHtml(def.defaultSubtitle)}" />
              <label for="page-body-${escapeHtml(def.slug)}">Body Text</label>
              <textarea id="page-body-${escapeHtml(def.slug)}" data-page="${escapeHtml(def.slug)}" data-field="body">${escapeHtml(def.defaultBody)}</textarea>
              ${def.slug === "sponsorship" ? `
                <label for="page-contact-${escapeHtml(def.slug)}">Contact Email</label>
                <input id="page-contact-${escapeHtml(def.slug)}" type="email" data-page="${escapeHtml(def.slug)}" data-field="contactEmail" value="${escapeHtml(def.defaultContactEmail || "")}" />
              ` : ""}
            </div>
          </details>
        `).join("")}
        <button type="submit" class="admin-save-btn">Save All Pages</button>
        <p id="portalAdminStatus" class="success" aria-live="polite"></p>
      </form>
    </div>

    <!-- TAB: Team Members -->
    <div id="adminTab-members" class="portal-admin-panel${activeTab === "members" ? "" : " hidden"}">
      <details class="admin-collapsible" open>
        <summary class="admin-collapsible-summary">Add New Team Member</summary>
        <div class="admin-collapsible-body">
          <form id="teamMemberForm" class="admin-form">
            <label for="memberName">Name</label>
            <input id="memberName" type="text" required placeholder="Member name" />
            <label for="memberRole">Role</label>
            <input id="memberRole" type="text" required placeholder="Driver / Programmer / Builder" />
            <label for="memberSort">Sort Order (1 = first)</label>
            <input id="memberSort" type="number" min="1" value="1" />
            <label for="memberImage">Upload Photo</label>
            <input id="memberImage" type="file" accept="image/*" />
            <label for="memberImageUrl">Or paste Image URL</label>
            <input id="memberImageUrl" type="url" placeholder="https://..." />
            <button type="submit" class="admin-save-btn">Add Team Member</button>
            <p id="teamMemberStatus" class="success" aria-live="polite"></p>
          </form>
        </div>
      </details>
      <details class="admin-collapsible" open>
        <summary class="admin-collapsible-summary">Current Members</summary>
        <div class="admin-collapsible-body">
          <div id="teamMemberList"><p>Loading…</p></div>
        </div>
      </details>
    </div>

    <!-- TAB: Portal Insights -->
    <div id="adminTab-insights" class="portal-admin-panel${activeTab === "insights" ? "" : " hidden"}">
      <details class="admin-collapsible" open>
        <summary class="admin-collapsible-summary">Page Visit Counts</summary>
        <div class="admin-collapsible-body">
          <div id="visitSummary"><p>Loading…</p></div>
          <button id="exportVisitsCsvBtn" type="button" class="retry-btn">Export Visits CSV</button>
        </div>
      </details>
      <details class="admin-collapsible" open>
        <summary class="admin-collapsible-summary">Recent Feedback</summary>
        <div class="admin-collapsible-body">
          <div id="feedbackSummary"><p>Loading…</p></div>
          <button id="exportFeedbackCsvBtn" type="button" class="retry-btn">Export Feedback CSV</button>
        </div>
      </details>
    </div>
  `;

  // Tab switching
  contentArea.querySelectorAll(".portal-admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      renderPortalAdmin(btn.getAttribute("data-tab"));
    });
  });

  // Shared state
  let latestVisits = [];
  let latestFeedback = [];

  // ── Pages tab ────────────────────────────────────────────────
  const portalAdminForm = document.getElementById("portalAdminForm");
  const portalAdminStatus = document.getElementById("portalAdminStatus");

  const fillPageForm = async () => {
    const pages = await loadPortalPages();
    pages.forEach((page) => {
      const titleEl = document.getElementById(`page-title-${page.slug}`);
      const subtitleEl = document.getElementById(`page-subtitle-${page.slug}`);
      const bodyEl = document.getElementById(`page-body-${page.slug}`);
      const contactEl = document.getElementById(`page-contact-${page.slug}`);
      if (titleEl) titleEl.value = page.title;
      if (subtitleEl) subtitleEl.value = page.subtitle;
      if (bodyEl) bodyEl.value = page.body;
      if (contactEl) contactEl.value = page.contactEmail || "";
    });
  };

  if (portalAdminForm) {
    fillPageForm();
    portalAdminForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!currentProfile.isPortalAdmin) {
        portalAdminStatus.className = "error";
        portalAdminStatus.textContent = "Only Portal Admins can save changes.";
        return;
      }
      const updates = PORTAL_PAGE_DEFS.map((def) => ({
        slug: def.slug,
        title: String(document.getElementById(`page-title-${def.slug}`)?.value || "").trim() || def.defaultTitle,
        subtitle: String(document.getElementById(`page-subtitle-${def.slug}`)?.value || "").trim() || def.defaultSubtitle,
        body: String(document.getElementById(`page-body-${def.slug}`)?.value || "").trim() || def.defaultBody,
        contactEmail: String(document.getElementById(`page-contact-${def.slug}`)?.value || "").trim() || null
      }));
      const error = await savePortalPages(updates);
      if (error) {
        portalAdminStatus.className = "error";
        portalAdminStatus.textContent = `Save failed: ${error.message}`;
        return;
      }
      portalAdminStatus.className = "success";
      portalAdminStatus.textContent = "All pages saved successfully.";
    });
  }

  // ── Members tab ───────────────────────────────────────────────
  const teamMemberForm = document.getElementById("teamMemberForm");
  const teamMemberStatus = document.getElementById("teamMemberStatus");
  const teamMemberList = document.getElementById("teamMemberList");

  const refreshMemberList = async () => {
    if (!teamMemberList) return;
    const members = await loadTeamMembers();
    teamMemberList.innerHTML = members.length
      ? `<ul>${members.map((m) => `
          <li class="admin-item">
            <strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.role || "")}
            <button type="button" class="logout-btn" data-remove-member="${escapeHtml(m.id)}" style="float:right">Remove</button>
          </li>`).join("")}</ul>`
      : "<p>No team members yet.</p>";
    teamMemberList.querySelectorAll("button[data-remove-member]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const err = await deleteTeamMember(btn.getAttribute("data-remove-member"));
        if (err) {
          if (teamMemberStatus) {
            teamMemberStatus.className = "error";
            teamMemberStatus.textContent = `Remove failed: ${err.message}`;
          }
          return;
        }
        if (teamMemberStatus) {
          teamMemberStatus.className = "success";
          teamMemberStatus.textContent = "Member removed.";
        }
        refreshMemberList();
      });
    });
  };

  if (teamMemberList) refreshMemberList();

  if (teamMemberForm) {
    teamMemberForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const memberName = String(document.getElementById("memberName")?.value || "").trim();
      const memberRole = String(document.getElementById("memberRole")?.value || "").trim();
      const memberSort = Number(document.getElementById("memberSort")?.value || 1);
      const memberImageFile = document.getElementById("memberImage")?.files?.[0] || null;
      const memberImageUrlInput = String(document.getElementById("memberImageUrl")?.value || "").trim();
      if (!memberName || !memberRole) {
        if (teamMemberStatus) {
          teamMemberStatus.className = "error";
          teamMemberStatus.textContent = "Name and role are required.";
        }
        return;
      }
      try {
        let finalImageUrl = memberImageUrlInput;
        if (memberImageFile) finalImageUrl = await uploadTeamMemberImage(memberImageFile);
        const insertError = await createTeamMember({
          name: memberName,
          role: memberRole,
          image_url: finalImageUrl || null,
          sort_order: Number.isFinite(memberSort) ? memberSort : 1,
          is_active: true
        });
        if (insertError) {
          if (teamMemberStatus) {
            teamMemberStatus.className = "error";
            teamMemberStatus.textContent = `Add failed: ${insertError.message}`;
          }
          return;
        }
        teamMemberForm.reset();
        if (teamMemberStatus) {
          teamMemberStatus.className = "success";
          teamMemberStatus.textContent = "Team member added.";
        }
        refreshMemberList();
      } catch (err) {
        if (teamMemberStatus) {
          teamMemberStatus.className = "error";
          teamMemberStatus.textContent = `Upload failed: ${err.message || "Unknown error"}`;
        }
      }
    });
  }

  // ── Insights tab ─────────────────────────────────────────────
  const visitSummary = document.getElementById("visitSummary");
  const feedbackSummary = document.getElementById("feedbackSummary");
  const exportVisitsCsvBtn = document.getElementById("exportVisitsCsvBtn");
  const exportFeedbackCsvBtn = document.getElementById("exportFeedbackCsvBtn");

  const loadInsights = async () => {
    if (visitSummary) {
      const visits = await loadVisitSummary();
      latestVisits = visits;
      visitSummary.innerHTML = visits.length
        ? `<ul>${visits.map((x) => `<li><strong>${escapeHtml(x.slug)}</strong>: ${x.count} unique visitor${x.count !== 1 ? "s" : ""}</li>`).join("")}</ul>`
        : "<p>No visits tracked yet.</p>";
    }
    if (feedbackSummary) {
      const feedback = await loadFeedback();
      latestFeedback = feedback;
      feedbackSummary.innerHTML = feedback.length
        ? `<ul>${feedback.map((item) => `
            <li>
              <strong>${escapeHtml(item.page_slug || "general")}</strong>
              — <em>${escapeHtml(item.name || "Guest")}</em>:
              ${escapeHtml(item.comment || "")}
            </li>`).join("")}</ul>`
        : "<p>No feedback yet.</p>";
    }
  };

  if (activeTab === "insights") loadInsights();

  if (exportVisitsCsvBtn) {
    exportVisitsCsvBtn.addEventListener("click", async () => {
      if (!latestVisits.length) await loadInsights();
      downloadCsv("portal-visits.csv", ["page_slug", "unique_visitors"], latestVisits.map((x) => [x.slug, String(x.count)]));
    });
  }

  if (exportFeedbackCsvBtn) {
    exportFeedbackCsvBtn.addEventListener("click", async () => {
      if (!latestFeedback.length) await loadInsights();
      downloadCsv(
        "portal-feedback.csv",
        ["id", "page_slug", "name", "email", "comment", "created_at"],
        latestFeedback.map((item) => [item.id, item.page_slug, item.name, item.email || "", item.comment, item.created_at])
      );
    });
  }

  // Pre-load insights if that tab is active, pages/members load on demand above
  if (activeTab === "insights" && !visitSummary?.textContent.includes("visits")) {
    loadInsights();
  }
}

async function restoreSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session?.user) {
    showLogin("login");
    return;
  }

  currentUser = data.session.user;
  currentProfile = await fetchProfile(currentUser);
  await loadMenuItems();
  showApp(currentProfile.displayName, currentProfile.isCoach, currentProfile.isPortalAdmin);
}

async function onSubmit(event) {
  if (!loginForm || !loginError || !submitBtn) {
    return;
  }

  event.preventDefault();
  clearMessages();

  if (isCooldownActiveForCurrentMode()) {
    const remainingSeconds = Math.ceil((authCooldownUntil - Date.now()) / 1000);
    setCooldownMessage(remainingSeconds);
    updateCooldownUi();
    return;
  }

  if (isSubmitInFlight) {
    return;
  }

  isSubmitInFlight = true;
  setSubmitEnabled(false);

  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();

  if (!supabaseClient) {
    loginError.textContent = "Supabase is not configured yet. See README setup steps.";
    isSubmitInFlight = false;
    setSubmitEnabled(true);
    return;
  }

  try {
    if (authMode === "register") {
      await registerUser(email, password, displayName);
      loginSuccess.textContent = "Account created. Now log in with the same email and password.";
      setMode("login");
      loginForm.reset();
      return;
    }

    currentUser = await loginUser(email, password);
    currentProfile = await fetchProfile(currentUser);
    await loadMenuItems();
    showApp(currentProfile.displayName, currentProfile.isCoach, currentProfile.isPortalAdmin);
  } catch (error) {
    loginError.textContent = error.message || "Something went wrong. Please try again.";

    if (isRateLimitError(error)) {
      startAuthCooldown(authMode);
    }
  } finally {
    isSubmitInFlight = false;
    if (Date.now() < authCooldownUntil) {
      updateCooldownUi();
    } else {
      submitBtn.textContent = getDefaultSubmitText();
      setSubmitEnabled(true);
    }
  }
}

async function onLogout() {
  if (!supabaseClient || !loginForm) {
    return;
  }

  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = { displayName: "Member", isCoach: false, isPortalAdmin: false };
  navItems = [...DEFAULT_NAV_ITEMS];
  selectedMenuId = DEFAULT_NAV_ITEMS[0].id;
  loginForm.reset();
  clearMessages();
  setMode("login");
  showLogin("login");
}

function initSupabase() {
  const hasPlaceholders =
    SUPABASE_URL.includes("YOUR-PROJECT-ID") ||
    SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

  if (hasPlaceholders || !window.supabase) {
    if (loginError) {
      loginError.textContent = "Set SUPABASE_URL and SUPABASE_ANON_KEY in app.js before using login.";
    }
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

if (modeLoginBtn) {
  modeLoginBtn.addEventListener("click", () => setMode("login"));
}
if (modeRegisterBtn) {
  modeRegisterBtn.addEventListener("click", () => setMode("register"));
}
if (loginForm) {
  loginForm.addEventListener("submit", onSubmit);
}
if (logoutBtn) {
  logoutBtn.addEventListener("click", onLogout);
}
if (coachAdminBtn) {
  coachAdminBtn.addEventListener("click", renderCoachAdmin);
}
if (document.getElementById("portalAdminBtn")) {
  document.getElementById("portalAdminBtn").addEventListener("click", renderPortalAdmin);
}
if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    clearMessages();
    if (isCooldownActiveForCurrentMode()) {
      updateCooldownUi();
      return;
    }

    setSubmitEnabled(true);
    if (submitBtn) {
      submitBtn.textContent = getDefaultSubmitText();
    }
    setRetryButtonVisible(false);
  });
}

if (goToLoginBtn) {
  goToLoginBtn.addEventListener("click", () => showLogin("login"));
}
if (goToRegisterBtn) {
  goToRegisterBtn.addEventListener("click", () => showLogin("register"));
}
if (backToLandingBtn) {
  backToLandingBtn.addEventListener("click", showLanding);
}

if (loginForm) {
  setMode("login");
  setRetryButtonVisible(false);
  initSupabase();
  restoreSession();
}
