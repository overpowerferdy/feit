import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FoodAnalysis = {
  isFood: boolean;
  food: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  nutrients: string[];
  benefits: string[];
  tips: string[];
  confidence: "high" | "medium" | "low";
};

const num = { type: "number" };
const strArr = { type: "array", items: { type: "string" } };
const schema = {
  type: "object", additionalProperties: false,
  required: ["isFood", "food", "portion", "calories", "protein", "carbs", "fat", "fiber", "nutrients", "benefits", "tips", "confidence"],
  properties: {
    isFood: { type: "boolean", description: "false when the photo shows no food or drink" },
    food: { type: "string", description: "Short name of the dish(es), e.g. 'Chicken adobo with rice'" },
    portion: { type: "string", description: "Estimated amount, e.g. '1 cup rice + 2 pieces chicken'" },
    calories: { ...num, description: "Estimated kcal for the whole portion shown" },
    protein: { ...num, description: "grams" }, carbs: { ...num, description: "grams" }, fat: { ...num, description: "grams" }, fiber: { ...num, description: "grams" },
    nutrients: { ...strArr, description: "2-5 notable vitamins/minerals, e.g. 'Iron — from the liver'" },
    benefits: { ...strArr, description: "2-4 short benefits for strength training, recovery, energy or focus" },
    tips: { ...strArr, description: "1-3 short, practical, budget-friendly tips to make this meal better" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
};

export const analyzeFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    image: z.string().max(4_000_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
    note: z.string().max(200).optional(),
  }).parse(v))
  .handler(async ({ data }): Promise<FoodAnalysis> => {
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    let res;
    try {
      res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: "You are a friendly nutrition helper inside Feit, a personal fitness tracker for a young adult in the Philippines who does dumbbell and bodyweight strength training and is watching protein on a small food budget. Look at the photo, identify the food (Filipino dishes are common), estimate the portion and its nutrition for what is visible. Numbers are rough estimates; round calories to the nearest 10 and grams to whole numbers. Benefits and tips are one short sentence each, plain words, no medical claims or diagnoses. If there is no food, set isFood=false, zeros for numbers and empty lists.",
        input: [{ role: "user", content: [
          { type: "input_text", text: data.note ? `The user says: ${data.note}` : "What is this food and what does it give me?" },
          { type: "input_image", image_url: data.image, detail: "auto" },
        ] }],
        max_output_tokens: 3000,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "food_analysis", strict: true, schema } },
      });
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 402) throw new Error("AI credits have run out. Add credits in your workspace, then try again.");
      if (status === 429) throw new Error("Too many requests right now. Wait a minute and try again.");
      throw new Error("The food check didn't work this time. Please try again.");
    }
    let text = "";
    for (const item of res.output) if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
    try { return JSON.parse(text) as FoodAnalysis; } catch { throw new Error("The food check couldn't finish. Please try another photo."); }
  });
