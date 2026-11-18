import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CodeReview, Lesson } from "@/lib/fittrack-data";

const MODEL = "openai/gpt-6-astra";

async function askJson<T>(instructions: string, input: string, schema: Record<string, unknown>, name: string): Promise<T> {
  const { generateResponse } = await import("@lovable.dev/ai-gateway");
  const res = await generateResponse({
    model: MODEL,
    instructions,
    input,
    max_output_tokens: 6000,
    reasoning: { effort: "low" },
    text: { format: { type: "json_schema", name, strict: true, schema } },
  });
  let text = "";
  for (const item of res.output) if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
  try { return JSON.parse(text) as T; } catch { throw new Error("The AI could not finish. Please try again."); }
}

const str = { type: "string" };
const strArr = { type: "array", items: str };

const lessonSchema = {
  type: "object", additionalProperties: false, required: ["summary", "sections", "example", "quiz", "problem"],
  properties: {
    summary: str,
    sections: { type: "array", items: { type: "object", additionalProperties: false, required: ["heading", "body"], properties: { heading: str, body: str } } },
    example: { type: "string", description: "A short, runnable code example with comments" },
    quiz: { type: "array", items: { type: "object", additionalProperties: false, required: ["question", "options", "answer", "explain"], properties: { question: str, options: strArr, answer: { type: "integer", description: "0-based index of the correct option" }, explain: str } } },
    problem: { type: "object", additionalProperties: false, required: ["title", "prompt", "starter"], properties: { title: str, prompt: str, starter: { type: "string", description: "Starter code with TODO comments; may be empty" } } },
  },
};

export const generateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ dayTitle: z.string().min(1).max(80), topic: z.string().min(1).max(80), language: z.string().min(1).max(30) }).parse(v))
  .handler(async ({ data }) => askJson<Lesson>(
    "You are a patient programming teacher for a beginner-to-intermediate learner. Write clear, friendly, plain-English lessons. Keep each section body to 2-5 short sentences; no markdown symbols. Give exactly 3 sections, exactly 3 multiple-choice quiz questions with 4 options each, and one small practice problem the learner can solve by typing 5-25 lines of code.",
    `Week theme: ${data.dayTitle}. Topic: ${data.topic}. Language: ${data.language}.`,
    lessonSchema, "lesson",
  ));

const reviewSchema = {
  type: "object", additionalProperties: false, required: ["score", "passed", "summary", "strengths", "fixes"],
  properties: { score: { type: "integer", description: "0-100" }, passed: { type: "boolean" }, summary: str, strengths: strArr, fixes: strArr },
};

export const reviewCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ task: z.string().min(1).max(4000), code: z.string().min(1).max(20000), language: z.string().min(1).max(30) }).parse(v))
  .handler(async ({ data }) => askJson<CodeReview>(
    "You grade a learner's code like a kind but honest teacher. Read the code carefully and mentally run it. passed=true only if it reasonably solves the task (small style issues are fine). Score 0-100. Give at most 3 strengths and at most 4 concrete fixes, each one short sentence. Never rewrite the full solution for them.",
    `Language: ${data.language}\nTask:\n${data.task}\n\nLearner's code:\n${data.code}`,
    reviewSchema, "review",
  ));

const projectSchema = {
  type: "object", additionalProperties: false, required: ["title", "brief", "requirements"],
  properties: { title: str, brief: str, requirements: strArr },
};

export const generateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ dayTitle: z.string().min(1).max(80), topics: z.array(z.string().max(80)).min(1).max(12), language: z.string().min(1).max(30) }).parse(v))
  .handler(async ({ data }) => askJson<{ title: string; brief: string; requirements: string[] }>(
    "Design one small hands-on build task that combines the day's topics. It must be doable in 30-90 minutes in a single file, typed by hand. Give a catchy title, a 2-3 sentence brief, and 4-6 checkable requirements.",
    `Theme: ${data.dayTitle}. Topics: ${data.topics.join(", ")}. Language: ${data.language}.`,
    projectSchema, "project",
  ));
