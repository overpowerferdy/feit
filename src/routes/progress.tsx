import { createFileRoute } from "@tanstack/react-router";
import { Shell, SubTabs } from "@/components/feit/shell";
import { Dumbbell, TrendingUp } from "lucide-react";
import { ProgressView } from "@/components/feit/progress-view";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Strength & photos — Feit" }, { name: "description", content: "Strength check-ins, milestones and after-workout photos." }, { property: "og:title", content: "Strength & photos — Feit" }, { property: "og:description", content: "Strength check-ins, milestones and after-workout photos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><SubTabs items={[{ to: "/workouts", label: "Workout plan", icon: Dumbbell }, { to: "/progress", label: "Strength & photos", icon: TrendingUp }]} /><ProgressView /></Shell>,
});
