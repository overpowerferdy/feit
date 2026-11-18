import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/feit/shell";
import { RoutineView } from "@/components/feit/routine-view";

export const Route = createFileRoute("/habits")({
  head: () => ({ meta: [{ title: "Daily routine — Feit" }, { name: "description", content: "Check off, move or skip routine steps and edit your times." }, { property: "og:title", content: "Daily routine — Feit" }, { property: "og:description", content: "Check off, move or skip routine steps and edit your times." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><RoutineView /></Shell>,
});
