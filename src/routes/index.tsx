import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Feit — Daily dashboard" }, { name: "description", content: "Your fitness, sleep, food, coding, and reading dashboard." }, { property: "og:title", content: "Feit — Daily dashboard" }, { property: "og:description", content: "Your fitness, sleep, food, coding, and reading dashboard." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="home" />,
});
