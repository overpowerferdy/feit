import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/wellness")({
  head: () => ({ meta: [{ title: "Wellness — Feit" }, { name: "description", content: "Track your wellness in Feit." }, { property: "og:title", content: "Wellness — Feit" }, { property: "og:description", content: "Track your wellness in Feit." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="wellness" />,
});
