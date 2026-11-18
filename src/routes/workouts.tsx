import { createFileRoute } from "@tanstack/react-router";
import { Shell, SubTabs } from "@/components/feit/shell";
import { Dumbbell, TrendingUp } from "lucide-react";
import { WorkoutView } from "@/components/workout-view";

export const Route = createFileRoute("/workouts")({
  head: () => ({ meta: [{ title: "Workouts — Feit" }, { name: "description", content: "Your weekly workouts with pictures and tutorial videos." }, { property: "og:title", content: "Workouts — Feit" }, { property: "og:description", content: "Your weekly workouts with pictures and tutorial videos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><SubTabs items={[{ to: "/workouts", label: "Workout plan", icon: Dumbbell }, { to: "/progress", label: "Strength & photos", icon: TrendingUp }]} /><WorkoutView /></Shell>,
});
