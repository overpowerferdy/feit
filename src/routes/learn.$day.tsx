import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/feit/shell";
import { LessonView } from "@/components/feit/lesson-view";

export const Route = createFileRoute("/learn/$day")({
  head: () => ({ meta: [{ title: "Lesson — Feit" }, { name: "description", content: "Learn a roadmap day: lessons, quizzes, practice and a build task." }, { property: "og:title", content: "Lesson — Feit" }, { property: "og:description", content: "Learn a roadmap day: lessons, quizzes, practice and a build task." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: LessonPage,
});

function LessonPage() {
  const { day } = Route.useParams();
  return <Shell><LessonView day={day} /></Shell>;
}
