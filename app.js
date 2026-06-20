// Kids can customize the menu by editing this list.
const NAV_ITEMS = [
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

// Demo users for a static site. For real security, use Firebase Auth.
const DEMO_USERS = [
  { username: "driver1", password: "goFTC", displayName: "Driver 1" },
  { username: "builder1", password: "goFTC", displayName: "Builder 1" }
];

const SESSION_KEY = "ftc_team_portal_session";

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const navList = document.getElementById("navList");
const contentArea = document.getElementById("contentArea");
const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");

function findUser(username, password) {
  return DEMO_USERS.find(
    (user) => user.username === username.trim() && user.password === password
  );
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function renderContent(itemId) {
  const item = NAV_ITEMS.find((x) => x.id === itemId) || NAV_ITEMS[0];
  contentArea.innerHTML = `<h3>${item.title}</h3><p>${item.content}</p>`;

  const navButtons = navList.querySelectorAll("button");
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === item.id);
  });
}

function buildNav() {
  navList.innerHTML = "";
  NAV_ITEMS.forEach((item, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.title;
    button.dataset.id = item.id;
    button.addEventListener("click", () => renderContent(item.id));

    li.appendChild(button);
    navList.appendChild(li);

    if (index === 0) {
      renderContent(item.id);
    }
  });
}

function showApp(user) {
  welcomeText.textContent = `Welcome, ${user.displayName}`;
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  buildNav();
}

function showLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  const user = findUser(username, password);
  if (!user) {
    loginError.textContent = "Incorrect username or password.";
    return;
  }

  loginError.textContent = "";
  setSession(user);
  showApp(user);
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  loginForm.reset();
  showLogin();
});

const existingUser = getSession();
if (existingUser) {
  showApp(existingUser);
}
