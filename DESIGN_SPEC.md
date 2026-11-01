# GyroRush design specification

## Concept

GyroRush is a motion arcade game presented as an elegant floating isometric
maze. The mood combines calm geometric architecture with fast cyan motion,
violet collectibles, and a warm goal. It may evoke the clarity of architectural
puzzle games, but it must have its own arcade identity and must not copy any
existing game's assets, characters, levels, or branding.

Tagline: `Tilt the world. Find the way.`

Design priorities, in order:

1. The route, ball, crystals, and goal are readable at a glance.
2. Motion feedback is clear without visually overwhelming the board.
3. HUD information remains legible while the phone is moving.
4. Effects remain lightweight enough for smooth physical-device play.

## Visual tokens

### Color palette

| Role | Color | Usage |
| --- | --- | --- |
| Background | `#F5F7FC` | Main screen background |
| Background glow | `#E4E9FF` | Restrained ambient radial shapes |
| Surface | `#FFFFFF` | Cards, overlays, inactive controls |
| Surface border | `#DDE4F0` | One-pixel card and HUD borders |
| Architecture top | `#FFFFFF` | Walkable maze surface |
| Maze wall | `#4F5DFF` | Raised walls and primary buttons |
| Maze wall edge | `#3540C0` | Wall and button front face |
| Architecture edge | `#C9D4EA` | Front/side face creating depth |
| Architecture shadow | `#E3E9F5` | Short projected maze shadow |
| Player | `#12B5EA` | Ball and active motion trail |
| Crystal | `#8B5CF6` | Collectibles and crystal counter |
| Goal | `#FF9F1C` | Exit portal and completion feedback |
| Text primary | `#172033` | Titles and important values |
| Text secondary | `#5F6C85` | Instructions and labels |
| Danger | `#E5484D` | Collision warning only |

Use color semantically. Do not use the player, crystal, or goal colors as
general decoration because they communicate gameplay state.

### Typography

Use the system font to avoid introducing another loading dependency.

- Display: 34-42 pt, weight 900, tight line height, moderate letter spacing
- Screen title: 22-28 pt, weight 800
- HUD value: 18-22 pt, weight 800, tabular numerals where available
- Button: 14-16 pt, weight 800, uppercase, 1-1.5 letter spacing
- Supporting text: 13-15 pt, weight 500, comfortable line height
- Micro label: 9-11 pt, weight 700, uppercase, 1-1.5 letter spacing

Avoid long paragraphs. The user must understand each screen while holding and
moving the phone.

### Shape and spacing

- Base spacing unit: 4 pt
- Screen horizontal inset: 20-24 pt
- Card radius: 18 pt
- Primary button radius: 16 pt
- Small control radius: 12 pt
- Minimum touch target: 44 x 44 pt
- Borders: one physical-looking thin line; avoid stacked outlines
- Shadows: short and opaque enough to imply depth; avoid large blurred shadows

## Global composition

The app is portrait only. Keep the safe areas clear. Flat screen UI and the
isometric world are separate layers:

1. Ambient background layer
2. Isometric scene layer
3. Player/effect layer attached to the scene
4. Flat HUD/control layer attached to the screen
5. Modal/overlay layer

Never rotate or skew HUD text with the game board.

## Home screen

### Layout

Top region:

- Small `MOTION ARCADE / 01` label
- `GYRORUSH` display title
- Tagline below it

Center region:

- A simplified floating isometric maze occupying roughly 42% of screen height
- The cyan ball follows a short looping route or gently reacts to tilt
- Two violet crystals and one closed gold goal are enough for the hero scene
- Add a small shadow below the floating structure to separate it from the dark
  background

Bottom region:

- Full-width gold/mint-accented `START RUN` primary button
- Two half-width secondary buttons: `HOW TO PLAY` and `SENSOR LAB`
- Optional `BEST 00:18.42` micro-label above the primary button

### Motion

- Very subtle scene parallax based on tilt, capped to a few pixels
- Slow idle pulse on the goal and crystals
- Do not start a new spring for every sensor event
- Stop or reduce nonessential animation when the screen loses focus

## How to Play

Use a bottom sheet or centered card over a dimmed home screen. Keep it on one
screen with three horizontal instruction rows:

1. Cyan tilted-phone icon: `TILT` / Steer the ball
2. Violet crystal icon: `COLLECT` / Unlock the exit
3. Gold motion streak icon: `DASH` / Twist quickly for a boost

End with one full-width `GOT IT` button. Remove the current four-step technical
language and keep each description to one short line.

## Calibration and countdown

Calibration appears as a focused overlay above a visible but inactive maze.

- Large cyan ball centered inside two thin rings
- Title: `HOLD STEADY`
- Supporting line: `Keep the phone in a comfortable position`
- A one-second circular progress indication
- On completion, give one short haptic and transition to countdown

Countdown uses the same center position:

- Large `3`, `2`, `1` in primary text
- `GO` changes to cyan and briefly scales up
- Fade the calibration rings out as control becomes active

Avoid a separate navigation screen for calibration; it should feel like part
of entering the maze.

## Gameplay screen

### HUD

Use a compact top HUD occupying no more than 12-14% of usable height.

- Left: time with `TIME` micro-label
- Center: crystal icon and `0/3`
- Right: 44 pt pause button
- Directly below or beside these: a thin dash meter labeled `DASH`

The HUD sits on either a translucent dark capsule/card or separate minimal
chips. Do not cover the active path.

### Maze

- Center the board within the remaining vertical space
- Prefer a tall diamond/stepped composition designed for portrait, not the wide
  reference image's landscape proportions
- Use a consistent visible side-face depth of approximately 8-12 visual pixels
- Show the top walkable surface in lime/mint, side faces in darker green, and a
  short deep-green shadow underneath
- Keep passages at least 2.5-3 player diameters wide on the smallest target
  phone
- Use one level of elevation visually; multiple real height levels are outside
  scope
- Walls and corners must visually match the existing collision geometry

### Player ball

- Cyan circle with a small white highlight at the upper-left
- Compact dark/cyan shadow beneath it
- Normal movement: no continuous expensive blur
- Dash: 2-3 fading trail copies or a short simple streak, lasting under 250 ms
- Collision: brief squash/flash and throttled haptic; do not shake the whole
  screen repeatedly

### Crystals

- Violet diamond made from a rotated square or similarly lightweight shape
- Short scale/fade animation on collection
- Small ring or sparkle that disappears quickly
- Update the HUD once per collected item, not every animation frame

### Goal

- Closed state: dark center, subdued gold outline, tiny lock marker if readable
- Unlocked state: warm gold center with a slow pulse
- When the last crystal is collected, send one clear gold pulse from the goal
- Finishing should stop gameplay input immediately before result animation

### Dash readiness

The thin dash meter fills cyan while cooling down. When ready, show `READY`
briefly or brighten its outline. Avoid flashing continuously.

## Pause overlay

Freeze simulation and elapsed time before showing the overlay.

- Dim the board without removing it
- Centered dark card with `PAUSED`
- Primary: `RESUME`
- Secondary: `RESTART RUN`
- Text action: `QUIT TO HOME`

The Resume action must not accidentally trigger movement from a stale sensor
sample; reset the frame timestamp and preserve or safely reset velocity.

## Result overlay

Keep the completed maze visible and darkened behind the result card.

- Gold micro-label: `RUN COMPLETE`
- Large completion time
- Two compact stats: crystals and wall hits or dash count
- `NEW BEST` badge only when applicable
- Primary: `RUN AGAIN`
- Secondary: `BACK HOME`

Use a restrained success animation: one expanding gold ring and a success
haptic. Do not add confetti or a new reward system.

## Sensor Lab

Sensor Lab is a presentation/support screen, not part of the main game loop.
Restyle it using the same dark surfaces and semantic colors, but keep the raw
X/Y/Z readings easy to explain in class. Include a clear Back action and avoid
decorative isometric elements that compete with telemetry.

## Pseudo-isometric implementation rules

- Keep authoritative physics coordinates in the existing flat 2D board space.
- Treat isometric presentation as a rendering projection, not new physics.
- Apply the same deterministic projection to the board, player, crystals, goal,
  and collision-aligned visuals.
- Do not manually position projected objects using unrelated magic numbers.
- If a global transform makes collision visuals hard to align, use a simpler
  top-down 2.5D treatment with side faces rather than compromising gameplay.
- Prefer existing React Native primitives and installed animation tooling.
- Do not add a 3D engine, Skia, or another large dependency without explicit
  user approval and a measured reason.

## Responsive rules

- Small-phone readability is the baseline.
- Derive board dimensions from the measured layout, not fixed device pixels.
- Keep HUD and primary actions inside safe areas.
- Ensure the maze path, ball, and crystals never become smaller than their
  useful gameplay size merely to fit decoration.
- On short screens, reduce ambient empty space and hero decoration before
  reducing controls or gameplay readability.

## Performance budget

- Physics can update per animation frame using refs.
- Position painting should avoid causing the entire screen to re-render.
- HUD time may update 5-10 times per second; it does not need 60 updates per
  second.
- Decorative parallax can update at a lower rate than game physics.
- Haptic/collision events must be debounced.
- Prefer opacity and transform animations, which are cheaper than layout-heavy
  animation.
- Evaluate final smoothness in a physical-device Release build.

## Acceptance checklist

- The new screen is recognizably GyroRush, not a copy of another game.
- Home communicates tilt control before the user reads instructions.
- The active path remains readable while the phone is moving.
- Player, crystal, and goal colors never become ambiguous.
- HUD stays flat, legible, and outside the critical route.
- Visual depth aligns with collision boundaries.
- Animations communicate state and do not create input latency.
- The smallest tested iPhone has no clipped text or unreachable controls.
- Android portrait layout preserves the same hierarchy.
