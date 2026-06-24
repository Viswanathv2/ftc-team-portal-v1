import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { portalDefaults } from "../config/portalPages";

export function usePortalPage(slug) {
  const [state, setState] = useState(() => ({
    loading: true,
    title: portalDefaults[slug]?.title || "",
    subtitle: portalDefaults[slug]?.subtitle || "",
    body: portalDefaults[slug]?.body || "",
    contactEmail: portalDefaults[slug]?.contactEmail || ""
  }));

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const defaults = portalDefaults[slug] || {};
      const { data, error } = await supabase
        .from("portal_pages")
        .select("title,subtitle,body,contact_email")
        .eq("slug", slug)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error || !data) {
        setState({
          loading: false,
          title: defaults.title || "",
          subtitle: defaults.subtitle || "",
          body: defaults.body || "",
          contactEmail: defaults.contactEmail || ""
        });
        return;
      }

      setState({
        loading: false,
        title: data.title || defaults.title || "",
        subtitle: data.subtitle || defaults.subtitle || "",
        body: data.body || defaults.body || "",
        contactEmail: data.contact_email || defaults.contactEmail || ""
      });
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return state;
}
