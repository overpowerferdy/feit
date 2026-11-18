import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/feit/shell";
import { TodayView } from "@/components/feit/today-view";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Feit — Today" }, { name: "description", content: "Your routine, steps, sleep, food, coding and reading at a glance." }, { property: "og:title", content: "Feit — Today" }, { property: "og:description", content: "Your routine, steps, sleep, food, coding and reading at a glance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><TodayView /></Shell>,
});
