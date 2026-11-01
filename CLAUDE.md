@AGENTS.md

# GyroRush handoff

## Project state

GyroRush is an Expo SDK 57 / React Native motion-controlled mini game. It has
already been tested on a physical iPhone using a development build. The core
features work: accelerometer steering, gyroscope dash, collision, crystals,
goal, pause/restart, scoring, calibration, and vibration/haptics.

Important current files:

- `src/app/index.tsx` - home screen and How to Play modal
- `src/app/game.tsx` - game loop, sensors, collision, scoring, and game UI
- `src/app/sensor-lab.tsx` - live sensor demonstration for the presentation
- `src/app/_layout.tsx` - Expo Router stack
- `src/components/sensorCard.tsx` - sensor telemetry card
- `app.json` - GyroRush app metadata and native configuration

There are intentional uncommitted changes. Treat them as user-owned work. Do
not reset, discard, or replace them wholesale.

## Non-negotiable technical constraint

Before changing application code, read the exact Expo SDK 57 documentation at:

https://docs.expo.dev/versions/v57.0.0/

Do not use advice or APIs from a different Expo version. Keep
`expo-build-properties` with `ios.enableSceneSupport: true`; this is required
for the current Xcode/iOS 27 build and fixed an immediate launch crash.

## Product direction

Do not add more than the two current levels or new product systems. The remaining work is visual polish,
control tuning, performance, testing, and submission packaging.

GyroRush should look like a fast arcade interpretation of an isometric,
Monument-Valley-like architectural maze. Take inspiration from clean geometric
composition only; do not copy Monument Valley assets, characters, layouts, or
branding.

Keep the name and tagline:

- `GYRORUSH`
- `Tilt the world. Find the way.`

The game should appear 2.5D/isometric, but its physics and collision should
remain 2D. Avoid a real 3D engine. The goal is a distinctive visual result with
low implementation risk and good performance.

## Locked scope

Keep:

- Two portrait-oriented maze levels, played in order
- Accelerometer steering
- Gyroscope-triggered dash with cooldown
- Crystals that unlock the goal
- Calibration, pause, restart, result, and Sensor Lab
- Offline play

Do not add:

- More than two levels, or other game modes
- Accounts, API integration, cloud data, or online leaderboards
- A 3D engine or heavyweight rendering dependency
- Complex progression, inventory, shops, achievements, or story content

## Target user flow

1. Home
   - Isometric hero scene with subtle motion
   - Logo, tagline, `START RUN`, `HOW TO PLAY`, and `SENSOR LAB`
   - Optional local best time only; no backend
2. How to Play
   - Three concise instructions: Tilt, Collect, Dash
   - Show automatically only on first play if this can be done cheaply; a
     manual button must remain available
3. Calibration
   - Ask the user to hold the phone steady
   - Sample a neutral baseline for about one second
   - Give short haptic confirmation
4. Countdown
   - `3`, `2`, `1`, `GO`
5. Gameplay
   - Tilt through the maze, collect all crystals, unlock the goal, finish
   - HUD: elapsed time, crystal count, dash cooldown, pause
6. Pause overlay
   - Resume, restart, return home
   - Stop elapsed time and motion updates while paused
7. Result overlay/screen
   - Completion time, collected crystals, dash count or wall hits
   - Local `NEW BEST` when applicable
   - Run again or return home

## Visual direction

The concrete screen layouts, palette, component treatment, and pseudo-isometric
construction rules are defined in `DESIGN_SPEC.md`. Read that file before any
UI implementation and treat it as the visual source of truth.

- Portrait isometric maze with clean, readable paths
- Clean white background and surfaces
- White maze floor with raised indigo walls and darker front faces for depth
- Blue player ball, violet crystals, warm orange goal
- HUD remains flat and screen-aligned; never tilt it with the board
- Use short shadows, restrained glow, and subtle parallax
- Use a short trail/flash for dash and clear feedback for crystal collection
- Preserve strong contrast and large touch targets
- Prefer lightweight React Native views/transforms and existing dependencies
- Avoid expensive blur, excessive shadows, continuous React state updates, and
  decoration that makes the route hard to read

## Performance and control workflow

Preserve simulation values in refs and keep the animation loop independent
from React renders. React state should update only when UI data must repaint.

Tune in this order:

1. Add/calibrate a small dead zone so the ball rests when the phone is steady.
2. Smooth accelerometer input without making steering feel delayed.
3. Tune acceleration, friction, maximum speed, and wall rebound together.
4. Throttle HUD values such as elapsed time rather than updating every frame.
5. Prevent repeated collision vibration and repeated dash triggers.
6. Profile the Release build before judging final performance; Metro/dev mode
   is expected to feel slower.

Avoid recreating `Animated.spring` on every sensor event on the home screen.
Prefer one persistent animation or a throttled/native-driven update.

## Recommended implementation order

Work in small, independently testable changes:

1. Inspect the existing code and report the intended file-level changes.
2. Refactor only where needed to separate game simulation from visual/HUD
   updates; preserve working behavior.
3. Tune sensor input, dead zone, smoothing, and render frequency.
4. Restyle Home and How to Play using the new isometric visual language.
5. Restyle the existing game board into a lightweight pseudo-isometric scene
   while keeping 2D collision coordinates reliable.
6. Finish calibration/countdown, pause, and result presentation.
7. Test on multiple portrait sizes and handle unavailable sensors safely.
8. Test a physical iPhone development build, then a Release build.
9. Prepare the Android APK only after iOS gameplay and layout are stable.

Do not redesign every screen in one large patch. After each stage, run the
checks below and summarize behavior that must be tested on the phone.

## Definition of done

- The ball remains still after calibration when the phone is held steady.
- Steering feels responsive and visibly smoother than the current build.
- Gameplay does not depend on a React render for every physics frame.
- Dash and collision haptics cannot spam continuously.
- The maze, player, crystals, and goal remain readable on a small iPhone.
- Pause/resume does not advance the timer or create a velocity jump.
- Restart fully resets timers, refs, collected items, and dash state.
- App handles unavailable sensors without crashing.
- TypeScript and Expo dependency checks pass.
- A physical-device Release test is completed before creating the final APK.

## Validation commands

The normal shell on this machine may not expose Node on `PATH`. If `node` is
not found, use the Node runtime already installed for Codex or locate the local
Node executable before running commands. Do not change package versions merely
to work around PATH configuration.

Run at minimum:

```sh
npx tsc --noEmit
npx expo install --check
git diff --check
```

Before native builds, verify the exact Expo SDK 57 commands in the versioned
documentation. Do not delete or regenerate native projects without first
explaining why it is necessary and preserving native configuration.
