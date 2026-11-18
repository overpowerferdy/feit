import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/feit/shell";
import { JournalView } from "@/components/feit/journal-view";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Journal — Feit" }, { name: "description", content: "Write a short daily journal with your mood." }, { property: "og:title", content: "Journal — Feit" }, { property: "og:description", content: "Write a short daily journal with your mood." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><JournalView /></Shell>,
});
