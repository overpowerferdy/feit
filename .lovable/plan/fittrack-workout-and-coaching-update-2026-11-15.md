# FitTrack workout and coaching update

## Experience
- Rework Workouts into a calm, responsive week view with selectable days, clear session details, progress checkmarks, and an uncluttered phone/laptop layout.
- Add an exercise reference image for every movement, with concise form cues and accessible labels.
- Let the user move a missed workout to another day in the same week and confirm the change before it affects the schedule.
- Add focused AI reviews for workout logs, reading, and roadmap progress. Show practical feedback and missed-session schedule suggestions; keep schedule changes user-confirmed.

## Data and safety
- Continue using the existing local saved tracker records; store rescheduling selections alongside them and keep existing records readable.
- Send only the relevant recent logs for an explicitly requested review, handle failures clearly, and do not invent activity or provide medical diagnoses.
- Keep AI calls server-side through Lovable AI Gateway; do not expose credentials in the browser.

## Verification
- Add a focused test for moving a missed session within the same week.
- Verify workout day selection, completion, rescheduling, AI review states, and phone/laptop layouts; inspect current build diagnostics.

## Technical details
- Keep TanStack Start and React; use `createServerFn` for AI review RPCs and retain the Cloud-provided auth middleware.
- Add any new schedule data as optional/validated persisted fields so earlier FitTrack backups remain compatible.
