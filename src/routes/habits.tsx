import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/habits")({
  head: () => ({ meta: [{ title: "Habits — Feit" }, { name: "description", content: "Track your habits in Feit." }, { property: "og:title", content: "Habits — Feit" }, { property: "og:description", content: "Track your habits in Feit." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="habits" />,
});
