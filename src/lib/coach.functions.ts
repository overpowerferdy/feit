import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({
  area: z.enum(["workout", "reading", "roadmap"]),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  logs: z.string().max(12000),
});

export type CoachReview = { summary: string; wins: string[]; tips: string[]; moveSuggestion: { from: string; to: string; reason: string } | null };

export const reviewLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => input.parse(value))
  .handler(async ({ data }): Promise<CoachReview> => {
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    const focus = {
      workout: "workout logs and weekly schedule. If a planned workout this week (before today) was missed, suggest moving it to a free rest or recovery day later this same week (after today). Never suggest dates in another week.",
      reading: "Atomic Habits reading logs (pages, minutes, notes). Daily target is 10-20 pages or 15-30 minutes.",
      roadmap: "programming roadmap topic checklist and coding time. Daily coding target is about 4 hours.",
    }[data.area];
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: `You are a friendly, non-judgmental coach inside Feit. Evaluate only the real logs given; never invent activity. No medical diagnoses. Keep each item to one short sentence. Focus: ${focus} Set moveSuggestion to null unless area is workout and a move is truly useful.`,
      input: `Today is ${data.today}. Logs (JSON):\n${data.logs}`,
      max_output_tokens: 4000,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "review", strict: true, schema: {
        type: "object", additionalProperties: false, required: ["summary", "wins", "tips", "moveSuggestion"],
        properties: {
          summary: { type: "string" },
          wins: { type: "array", items: { type: "string" } },
          tips: { type: "array", items: { type: "string" } },
          moveSuggestion: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["from", "to", "reason"], properties: { from: { type: "string", description: "YYYY-MM-DD missed date" }, to: { type: "string", description: "YYYY-MM-DD new date" }, reason: { type: "string" } } }] },
        } } } },
    });
    let text = "";
    for (const item of res.output) if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
    try { return JSON.parse(text) as CoachReview; } catch { throw new Error("The coach could not finish this review. Please try again."); }
  });
