import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { defaultNavItems } from "../config/dashboardDefaults";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function mergeMenuItems(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [...defaultNavItems];
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  return defaultNavItems.map((defaultItem) => {
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

export default function DashboardPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState(defaultNavItems);
  const [selectedId, setSelectedId] = useState(defaultNavItems[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase.from("menu_items").select("id,title,content");
      if (!active) return;

      if (error) {
        setItems(defaultNavItems);
      } else {
        setItems(mergeMenuItems(data));
      }
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0] || defaultNavItems[0],
    [items, selectedId]
  );

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <section className="app-shell-page">
      <div className="app-shell">
        <aside className="sidebar">
          <h2>Team Menu</h2>
          <ul id="navList">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={selectedId === item.id ? "active" : ""}
                  onClick={() => setSelectedId(item.id)}
                >
                  {item.title}
                </button>
              </li>
            ))}
            {(profile.isCoach || profile.isPortalAdmin) && (
              <li>
                <Link to="/admin" className="admin-link">
                  ⚙️ Admin Settings
                </Link>
              </li>
            )}
          </ul>
        </aside>
        <section className="content">
          <header>
            <h1>Welcome, {profile.displayName}</h1>
            <p id="contentSubtitle">Pick an item from the left menu.</p>
          </header>
          <article className="content-card">
            <h3>{selectedItem.title}</h3>
            <p>{selectedItem.content}</p>
            {(profile.isCoach || profile.isPortalAdmin) ? (
              <p className="success">Coach/Portal Admin tools migration is next. Your role is detected.</p>
            ) : null}
          </article>
        </section>
      </div>
    </section>
  );
}
