import PageShell from "../components/PageShell";
import RouteLoading from "../components/RouteLoading";
import { usePortalPage } from "../hooks/usePortalPage";
import { useTrackVisit } from "../hooks/useTrackVisit";

export default function SchedulePage() {
  const page = usePortalPage("schedule");
  useTrackVisit("schedule");

  if (page.loading) {
    return <RouteLoading />;
  }

  return <PageShell title={page.title} subtitle={page.subtitle} body={page.body} />;
}
