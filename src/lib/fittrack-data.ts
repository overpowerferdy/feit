export type StrengthEntry = { date: string; pushups: number; pullups: number; chinups: number };
export type SleepEntry = { date: string; bedtime: string; wakeTime: string; minutes: number };
export type WeightEntry = { date: string; kg: number };
export type MealEntry = { id: string; date: string; type: string; food: string; portion: string; protein: number };
export type PurchaseEntry = { id: string; date: string; item: string; amount: number };
export type CodingEntry = { id: string; date: string; minutes: number; note: string };
export type ReadingEntry = { id: string; date: string; pages: number; minutes: number; note: string };
export type WorkoutEntry = { date: string; name: string; completed: string[]; coreDone: boolean };

export interface FitTrackData {
  version: 1;
  habits: Record<string, string[]>;
  workouts: WorkoutEntry[];
  strength: StrengthEntry[];
  sleep: SleepEntry[];
  weight: WeightEntry[];
  meals: MealEntry[];
  purchases: PurchaseEntry[];
  coding: CodingEntry[];
  reading: ReadingEntry[];
  readingPage: number;
  bookPages: number;
  readingNotes: string;
  roadmap: Record<string, string[]>;
  rescheduledWorkouts?: Record<string, string>;
}

export const STORAGE_KEY = "fittrack-data-v1";
export const WEEKLY_FOOD_LIMIT = 100;
export const SLEEP_TARGET_MINUTES = 480;
export const CODING_TARGET_MINUTES = 240;

export const workoutSchedule = [
  { day: "Monday", title: "Rest & reset", type: "Rest", exercises: ["Recovery day", "Existing commitment · 10 AM–1 PM"] },
  { day: "Tuesday", title: "Workout A · Full body", type: "Workout A", exercises: ["Goblet Squat · 3 × 10–12", "Dumbbell Floor Press · 3 × 8–12", "One-Arm Dumbbell Row · 3 × 10–12 each", "Romanian Deadlift · 3 × 10–12", "Bicep Curl · 2 × 10–15", "Push-ups · 2 × 10–15"] },
  { day: "Wednesday", title: "Active recovery", type: "Recovery", exercises: ["Walk · 20–30 minutes", "Light stretching if needed"] },
  { day: "Thursday", title: "Workout B · Upper + legs", type: "Workout B", exercises: ["Pull-ups · 3 × 3", "Dumbbell Shoulder Press · 3 × 8–12", "Reverse Lunges · 3 × 8–10 each leg", "Push-ups · 3 × 10–15", "Hammer Curls · 2 × 10–12"] },
  { day: "Friday", title: "Rest & reset", type: "Rest", exercises: ["Recovery day", "Existing commitment · 5–10 PM"] },
  { day: "Saturday", title: "Workout C · Full body", type: "Workout C", exercises: ["Dumbbell Split Squats · 3 × 8–10 each", "Chin-ups · 3 × 4–5", "Dumbbell Floor Press · 3 × 10–12", "Dumbbell Lateral Raises · 2 × 12–15", "Plank · 3 × 30–45 sec"] },
  { day: "Sunday", title: "Rest & weekly review", type: "Review", exercises: ["Review workout progress", "Check strength improvements", "Prepare for the next week"] },
];

export const coreFinisher = ["Plank · 2–3 × 30–45 seconds", "Reverse Crunches · 2 × 12–15", "Dead Bugs · 2 × 10 each side"];

export const roadmapDays = [
  { date: "2026-11-16", title: "JavaScript Fundamentals", topics: ["Variables", "Data types", "Operators", "Conditions", "Loops", "Functions", "Arrays", "Objects"] },
  { date: "2026-11-17", title: "Modern JavaScript", topics: ["Array methods", "DOM", "Events", "Arrow functions", "Destructuring", "Spread and rest", "Promises", "Async/await", "Fetch API"] },
  { date: "2026-11-18", title: "Vue Basics", topics: ["Setup", "Components", "Template syntax", "Reactivity", "ref and reactive", "v-if and v-for", "v-model", "Events"] },
  { date: "2026-11-19", title: "React Basics", topics: ["Components", "JSX", "Props", "useState", "Events", "Conditional rendering", "Lists"] },
  { date: "2026-11-20", title: "PHP Fundamentals", topics: ["Syntax", "Variables", "Conditions", "Loops", "Functions", "Arrays", "GET and POST", "Forms"] },
  { date: "2026-11-21", title: "PHP and MySQL", topics: ["PDO", "CRUD", "Prepared statements", "Validation", "Basic security"] },
  { date: "2026-11-22", title: "Review and Mini Project", topics: ["Review the week's topics", "Compare Vue and React", "Identify weak topics", "Build a small practice project"] },
];

export function createEmptyData(): FitTrackData {
  return { version: 1, habits: {}, workouts: [], strength: [], sleep: [], weight: [], meals: [], purchases: [], coding: [], reading: [], readingPage: 0, bookPages: 320, readingNotes: "", roadmap: {} };
}

export function isFitTrackData(value: unknown): value is FitTrackData {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const arrays = ["workouts", "strength", "sleep", "weight", "meals", "purchases", "coding", "reading"];
  const objects = ["habits", "roadmap"];
  return record["version"] === 1 && arrays.every((key) => Array.isArray(record[key])) && objects.every((key) => record[key] !== null && typeof record[key] === "object" && !Array.isArray(record[key])) && typeof record["readingPage"] === "number" && Number.isFinite(record["readingPage"]) && typeof record["bookPages"] === "number" && Number.isFinite(record["bookPages"]) && record["bookPages"] > 0 && typeof record["readingNotes"] === "string";
}

export function mondayOf(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  const weekday = date.getDay();
  date.setDate(date.getDate() - ((weekday + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export function canRescheduleWorkout(originalDate: string, targetDate: string, today: string) {
  return originalDate < today && targetDate > today && mondayOf(originalDate) === mondayOf(targetDate) && mondayOf(targetDate) === mondayOf(today);
}

export function workoutForDate(date: string, reschedules: Record<string, string> = {}) {
  const weekdayIndex = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
  const regularDay = workoutSchedule[weekdayIndex] ?? workoutSchedule[0];
  if (!regularDay) return workoutSchedule[0];

  const movedFrom = Object.entries(reschedules).find(([, target]) => target === date)?.[0];
  if (movedFrom) {
    const sourceIndex = (new Date(`${movedFrom}T12:00:00`).getDay() + 6) % 7;
    return workoutSchedule[sourceIndex] ?? regularDay;
  }

  if (reschedules[date]) {
    const targetDate = reschedules[date];
    const targetLabel = targetDate ? new Date(`${targetDate}T12:00:00`).toLocaleDateString("en", { weekday: "long" }) : "another day";
    return { ...regularDay, title: `Workout moved to ${targetLabel}`, type: "Moved", exercises: ["This session is on its new day."] };
  }

  return regularDay;
}

export function weeklySpending(entries: PurchaseEntry[], date: string) {
  const monday = mondayOf(date);
  return entries.filter((entry) => entry.date >= monday && entry.date <= date).reduce((total, entry) => total + entry.amount, 0);
}

export function canAddPurchase(entries: PurchaseEntry[], date: string, amount: number) {
  return Number.isFinite(amount) && amount >= 0 && weeklySpending(entries, date) + amount <= WEEKLY_FOOD_LIMIT;
}

export function sleepMinutes(bedtime: string, wakeTime: string) {
  const [bedHour = 0, bedMinute = 0] = bedtime.split(":").map(Number);
  const [wakeHour = 0, wakeMinute = 0] = wakeTime.split(":").map(Number);
  let minutes = wakeHour * 60 + wakeMinute - (bedHour * 60 + bedMinute);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
}

export function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}