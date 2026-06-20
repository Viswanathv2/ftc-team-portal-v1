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
const AUTH_RETRY_COOLDOWN_SECONDS = 45;

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
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
const displayNameWrap = document.getElementById("displayNameWrap");
const displayNameInput = document.getElementById("displayName");

let authMode = "login";
let supabaseClient = null;
let navItems = [...DEFAULT_NAV_ITEMS];
let selectedMenuId = DEFAULT_NAV_ITEMS[0].id;
let currentUser = null;
let currentProfile = { displayName: "Member", isCoach: false };
let authCooldownUntil = 0;
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
  loginError.textContent = "";
  loginSuccess.textContent = "";
}

function setMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  modeLoginBtn.classList.toggle("active", !isRegister);
  modeRegisterBtn.classList.toggle("active", isRegister);
  displayNameWrap.classList.toggle("hidden", !isRegister);
  displayNameInput.required = isRegister;
  submitBtn.textContent = isRegister ? "Create Account" : "Log In";
  updateCooldownUi();
  clearMessages();
}

function setSubmitEnabled(enabled) {
  submitBtn.disabled = !enabled;
  submitBtn.style.opacity = enabled ? "1" : "0.7";
  submitBtn.style.cursor = enabled ? "pointer" : "not-allowed";
}

function isRateLimitError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("rate limit") || message.includes("too many requests");
}

function getDefaultSubmitText() {
  return authMode === "register" ? "Create Account" : "Log In";
}

function updateCooldownUi() {
  const remainingSeconds = Math.ceil((authCooldownUntil - Date.now()) / 1000);
  if (remainingSeconds <= 0) {
    authCooldownUntil = 0;
    submitBtn.textContent = getDefaultSubmitText();
    if (!isSubmitInFlight) {
      setSubmitEnabled(true);
    }
    if (cooldownIntervalId) {
      clearInterval(cooldownIntervalId);
      cooldownIntervalId = null;
    }
    return;
  }

  setSubmitEnabled(false);
  submitBtn.textContent = `Wait ${remainingSeconds}s`;
}

function startAuthCooldown(seconds) {
  authCooldownUntil = Date.now() + seconds * 1000;
  updateCooldownUi();

  if (cooldownIntervalId) {
    clearInterval(cooldownIntervalId);
  }

  cooldownIntervalId = setInterval(updateCooldownUi, 1000);
}

function setCoachAdminButtonVisible(isCoach) {
  coachAdminBtn.classList.toggle("hidden", !isCoach);
}

function clearSelectionStyles() {
  navList.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
  coachAdminBtn.classList.remove("active");
}

function renderContent(itemId) {
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

function showApp(displayName, isCoach) {
  welcomeText.textContent = `Welcome, ${displayName}`;
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  setCoachAdminButtonVisible(isCoach);
  buildNav();
}

function showLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function safeNameFromEmail(email) {
  return String(email || "Member").split("@")[0] || "Member";
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
    .select("display_name,is_coach")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return {
      displayName: safeNameFromEmail(user.email),
      isCoach: false
    };
  }

  return {
    displayName: data.display_name || safeNameFromEmail(user.email),
    isCoach: Boolean(data.is_coach)
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
    is_coach: false
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

async function restoreSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session?.user) {
    return;
  }

  currentUser = data.session.user;
  currentProfile = await fetchProfile(currentUser);
  await loadMenuItems();
  showApp(currentProfile.displayName, currentProfile.isCoach);
}

async function onSubmit(event) {
  event.preventDefault();
  clearMessages();

  if (Date.now() < authCooldownUntil) {
    const remainingSeconds = Math.ceil((authCooldownUntil - Date.now()) / 1000);
    loginError.textContent = `Please wait ${remainingSeconds} seconds before trying again.`;
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
    showApp(currentProfile.displayName, currentProfile.isCoach);
  } catch (error) {
    loginError.textContent = error.message || "Something went wrong. Please try again.";

    if (isRateLimitError(error)) {
      startAuthCooldown(AUTH_RETRY_COOLDOWN_SECONDS);
      loginError.textContent = `Too many attempts. Please wait ${AUTH_RETRY_COOLDOWN_SECONDS} seconds and try again.`;
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
  if (!supabaseClient) {
    return;
  }

  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = { displayName: "Member", isCoach: false };
  navItems = [...DEFAULT_NAV_ITEMS];
  selectedMenuId = DEFAULT_NAV_ITEMS[0].id;
  loginForm.reset();
  clearMessages();
  setMode("login");
  showLogin();
}

function initSupabase() {
  const hasPlaceholders =
    SUPABASE_URL.includes("YOUR-PROJECT-ID") ||
    SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

  if (hasPlaceholders || !window.supabase) {
    loginError.textContent = "Set SUPABASE_URL and SUPABASE_ANON_KEY in app.js before using login.";
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

modeLoginBtn.addEventListener("click", () => setMode("login"));
modeRegisterBtn.addEventListener("click", () => setMode("register"));
loginForm.addEventListener("submit", onSubmit);
logoutBtn.addEventListener("click", onLogout);
coachAdminBtn.addEventListener("click", renderCoachAdmin);

setMode("login");
initSupabase();
restoreSession();
