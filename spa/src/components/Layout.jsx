import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { navItems } from "../config/portalPages";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const [dark, setDark] = useState(() => localStorage.getItem("site-theme") !== "light");
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", dark);
    localStorage.setItem("site-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <>
      <div className="background-art" aria-hidden="true" />
      <nav className="top-nav" aria-label="Main navigation">
        <ul className="top-nav-list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? "active" : undefined)}
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to={user ? "/dashboard" : "/login"}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {loading ? "Account" : user ? "My Account" : "Login"}
            </NavLink>
          </li>
          {user ? (
            <li>
              <button
                type="button"
                className="theme-btn"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Log Out
              </button>
            </li>
          ) : null}
          <li>
            <button
              type="button"
              className="theme-btn"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle theme"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </li>
        </ul>
      </nav>
      <main>
        <div className="route-fade">
          <Outlet />
        </div>
      </main>
    </>
  );
}
