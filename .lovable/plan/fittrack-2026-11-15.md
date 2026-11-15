# FitTrack

Build a personal fitness and learning tracker using the supplied FitTrack brief as the source of truth.

## Experience
- Replace the placeholder home page with a responsive dashboard and clear navigation to focused tracker views.
- Show today's planned activity and concise summaries for workouts, weight, sleep, meals/protein, coding, reading, habits, and weekly progress.
- Use the requested green-and-white palette, light neutral backgrounds, simple icons, readable charts, and an approachable mobile layout.

## Trackers and actions
- Add the supplied weekly workout schedule, exercise guidance, core finisher, form reminders, workout completion, and history.
- Track weekly push-up, pull-up, and chin-up tests against the supplied milestones, with progress charts.
- Add editable sleep logs using the midnight-to-8 AM default and an eight-hour target; weight entries; meal and estimated protein logs; and food purchases with a ₱100 weekly cap and Monday reset.
- Add daily routine/habit checklists, coding sessions with a four-hour daily target, Atomic Habits page/time progress and notes, and the Nov 16–22, 2026 learning roadmap with topic checklists and notes.
- Make logging, editing, completion, charts, and progress summaries work with real user-entered records; do not invent historical activity.

## Data and safeguards
- Persist records in localStorage as requested, with safe defaults and validation when loading or importing data.
- Provide JSON export/import and a clearly confirmed action to clear saved data.
- Preserve the specified personal profile, schedule, budget limit, and non-judgmental nutrition guidance. Avoid requiring extra food purchases or a strict protein target.

## Technical approach
- Keep the existing TanStack Start, React, TypeScript, and Tailwind v4 stack; replace `/` and add focused content routes for the tracker areas.
- Use the existing design tokens and installed chart/icon libraries. Add route-specific metadata and focused tests for the weekly budget cap and sleep schedule defaults.
