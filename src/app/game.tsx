import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../components/primaryButton";
import {
  calibratedFeedback,
  countdownFeedback,
  crystalFeedback,
  dashFeedback,
  goalUnlockedFeedback,
  goFeedback,
  loadSounds,
  wallHitFeedback,
  winFeedback,
} from "../utils/feedback";
import { formatTime, getBestTime, saveBestTime } from "../utils/progress";

type Point = { x: number; y: number };
type BoardSize = { width: number; height: number };
type GameStatus = "calibrating" | "countdown" | "playing" | "paused" | "won";

type NormalizedRect = Point & {
  width: number;
  height: number;
};

type Level = {
  start: Point;
  goal: Point;
  crystals: Point[];
  walls: NormalizedRect[];
};

const BALL_RADIUS = 12;
const CRYSTAL_RADIUS = 15;
const GOAL_RADIUS = 24;
const BOARD_SIDE_DEPTH = 10;
const BOARD_SHADOW_DEPTH = 6;
const WALL_EDGE_DEPTH = 6;
const START_ZONE_WIDTH = 44;
const TILT_SENSOR_INTERVAL = 16;
const SPIN_SENSOR_INTERVAL = 32;
const MAX_SPEED = 260;
const ACCELERATION = 1500;
const COUNTER_STEER_BOOST = 1.8;
const FRICTION = 0.955;
const DEAD_ZONE = 0.03;
const REST_SPEED = 4;
const TILT_SMOOTHING_MS = 30;
const HUD_INTERVAL_MS = 100;
const DASH_COOLDOWN_MS = 1400;
const CALIBRATION_MS = 1000;
const COUNTDOWN_START = 3;
const COUNTDOWN_STEP_MS = 700;
const RING_SIZE = 168;
const MIN_IMPACT_SPEED = 40;
const TRAIL_COPIES = 3;
const TRAIL_STEP_MS = 50;
const TRAIL_FADE_MS = 150;
const LEVELS: Level[] = [
  {
    start: { x: 0.0833, y: 0.9375 },
    goal: { x: 0.9167, y: 0.0625 },
    crystals: [
      { x: 0.4167, y: 0.3125 },
      { x: 0.4167, y: 0.9375 },
      { x: 0.9167, y: 0.9375 },
    ],
    walls: [
      { x: 0.1517, y: 0.366, width: 0.03, height: 0.143 },
      { x: 0.1517, y: 0.616, width: 0.03, height: 0.143 },
      { x: 0.3183, y: 0.116, width: 0.03, height: 0.268 },
      { x: 0.3183, y: 0.491, width: 0.03, height: 0.143 },
      { x: 0.3183, y: 0.741, width: 0.03, height: 0.268 },
      { x: 0.485, y: 0.116, width: 0.03, height: 0.268 },
      { x: 0.485, y: 0.491, width: 0.03, height: 0.268 },
      { x: 0.6517, y: 0.241, width: 0.03, height: 0.268 },
      { x: 0.6517, y: 0.741, width: 0.03, height: 0.143 },
      { x: 0.8183, y: 0.116, width: 0.03, height: 0.143 },
      { x: 0.8183, y: 0.491, width: 0.03, height: 0.143 },
      { x: 0.8183, y: 0.866, width: 0.03, height: 0.143 },
      { x: -0.015, y: 0.116, width: 0.1967, height: 0.018 },
      { x: 0.485, y: 0.116, width: 0.3633, height: 0.018 },
      { x: 0.1517, y: 0.241, width: 0.1967, height: 0.018 },
      { x: 0.8183, y: 0.241, width: 0.1967, height: 0.018 },
      { x: 0.3183, y: 0.366, width: 0.1967, height: 0.018 },
      { x: 0.6517, y: 0.366, width: 0.1967, height: 0.018 },
      { x: -0.015, y: 0.491, width: 0.3633, height: 0.018 },
      { x: 0.485, y: 0.491, width: 0.1967, height: 0.018 },
      { x: 0.3183, y: 0.616, width: 0.1967, height: 0.018 },
      { x: 0.6517, y: 0.616, width: 0.3633, height: 0.018 },
      { x: 0.1517, y: 0.741, width: 0.1967, height: 0.018 },
      { x: 0.485, y: 0.741, width: 0.3633, height: 0.018 },
      { x: -0.015, y: 0.866, width: 0.1967, height: 0.018 },
      { x: 0.3183, y: 0.866, width: 0.1967, height: 0.018 },
    ],
  },
  {
    start: { x: 0.9286, y: 0.9444 },
    goal: { x: 0.0714, y: 0.0556 },
    crystals: [
      { x: 0.7857, y: 0.0556 },
      { x: 0.6429, y: 0.2778 },
      { x: 0.2143, y: 0.6111 },
      { x: 0.7857, y: 0.9444 },
    ],
    walls: [
      { x: 0.1299, y: 0.1031, width: 0.026, height: 0.1271 },
      { x: 0.1299, y: 0.3253, width: 0.026, height: 0.1271 },
      { x: 0.1299, y: 0.8809, width: 0.026, height: 0.1271 },
      { x: 0.2727, y: 0.2142, width: 0.026, height: 0.1271 },
      { x: 0.2727, y: 0.4364, width: 0.026, height: 0.2382 },
      { x: 0.2727, y: 0.7698, width: 0.026, height: 0.1271 },
      { x: 0.4156, y: 0.1031, width: 0.026, height: 0.1271 },
      { x: 0.4156, y: 0.3253, width: 0.026, height: 0.1271 },
      { x: 0.4156, y: 0.6587, width: 0.026, height: 0.1271 },
      { x: 0.4156, y: 0.8809, width: 0.026, height: 0.1271 },
      { x: 0.5584, y: 0.1031, width: 0.026, height: 0.2382 },
      { x: 0.5584, y: 0.4364, width: 0.026, height: 0.2382 },
      { x: 0.5584, y: 0.7698, width: 0.026, height: 0.1271 },
      { x: 0.7013, y: -0.008, width: 0.026, height: 0.1271 },
      { x: 0.7013, y: 0.3253, width: 0.026, height: 0.1271 },
      { x: 0.7013, y: 0.6587, width: 0.026, height: 0.1271 },
      { x: 0.8441, y: 0.1031, width: 0.026, height: 0.2382 },
      { x: 0.8441, y: 0.5476, width: 0.026, height: 0.1271 },
      { x: 0.8441, y: 0.8809, width: 0.026, height: 0.1271 },
      { x: 0.1299, y: 0.1031, width: 0.3117, height: 0.016 },
      { x: 0.7013, y: 0.1031, width: 0.1689, height: 0.016 },
      { x: -0.013, y: 0.2142, width: 0.1689, height: 0.016 },
      { x: 0.5584, y: 0.2142, width: 0.1689, height: 0.016 },
      { x: 0.1299, y: 0.3253, width: 0.5974, height: 0.016 },
      { x: 0.7013, y: 0.4364, width: 0.3117, height: 0.016 },
      { x: 0.1299, y: 0.5476, width: 0.7403, height: 0.016 },
      { x: -0.013, y: 0.6587, width: 0.3117, height: 0.016 },
      { x: 0.1299, y: 0.7698, width: 0.8831, height: 0.016 },
      { x: 0.7013, y: 0.8809, width: 0.1689, height: 0.016 },
    ],
  },
];

// Kept for the current app session only; there is no persistent storage dependency.

export default function GameScreen() {
  const router = useRouter();
  const [boardSize, setBoardSize] = useState<BoardSize>({ width: 0, height: 0 });
  const [levelIndex, setLevelIndex] = useState(0);
  const [collected, setCollected] = useState<number[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hits, setHits] = useState(0);
  const [status, setStatus] = useState<GameStatus>("calibrating");
  const [countdown, setCountdown] = useState<string | null>(null);
  const [dashReady, setDashReady] = useState(true);
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);
  const [newBest, setNewBest] = useState(false);

  const positionRef = useRef<Point>({ x: 0, y: 0 });
  const velocityRef = useRef<Point>({ x: 0, y: 0 });
  const sensorRef = useRef<Point>({ x: 0, y: 0 });
  const smoothedRef = useRef<Point>({ x: 0, y: 0 });
  const tiltRef = useRef<Point>({ x: 0, y: 0 });
  const baselineRef = useRef<Point>({ x: 0, y: 0 });
  const ballPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dashMeter = useRef(new Animated.Value(1)).current;
  const calibrationProgress = useRef(new Animated.Value(0)).current;
  const sequenceOpacity = useRef(new Animated.Value(1)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;
  const successRing = useRef(new Animated.Value(0)).current;
  const ballScaleX = useRef(new Animated.Value(1)).current;
  const ballScaleY = useRef(new Animated.Value(1)).current;
  const ballFlash = useRef(new Animated.Value(0)).current;
  const goalPulse = useRef(new Animated.Value(0)).current;
  const goalBreath = useRef(new Animated.Value(0)).current;
  const crystalBursts = useRef(
    Array.from({ length: Math.max(...LEVELS.map((level) => level.crystals.length)) }, () => new Animated.Value(0)),
  ).current;
  const levelRef = useRef(0);
  const pixelWallsRef = useRef<NormalizedRect[]>([]);
  const trailGhosts = useRef(
    Array.from({ length: TRAIL_COPIES }, () => ({
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(0),
    })),
  ).current;
  const dashTrailRef = useRef({ dropped: TRAIL_COPIES, nextDropMs: 0 });
  const calibrationSampleRef = useRef({ x: 0, y: 0, count: 0 });
  const collectedRef = useRef(new Set<number>());
  const boardSizeRef = useRef(boardSize);
  const statusRef = useRef<GameStatus>("calibrating");
  const elapsedRef = useRef(0);
  const hitsRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastPaintRef = useRef(0);
  const lastHitRef = useRef(0);
  const dashCooldownRef = useRef(0);
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateStatus = useCallback((nextStatus: GameStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const resetGame = useCallback((size = boardSizeRef.current) => {
    if (!size.width || !size.height) return;

    const level = LEVELS[levelRef.current];
    const start = { x: size.width * level.start.x, y: size.height * level.start.y };
    pixelWallsRef.current = getPixelWalls(size, level.walls);
    positionRef.current = start;
    velocityRef.current = { x: 0, y: 0 };
    collectedRef.current = new Set();
    elapsedRef.current = 0;
    hitsRef.current = 0;
    lastFrameRef.current = 0;
    lastHitRef.current = 0;
    lastPaintRef.current = 0;
    dashCooldownRef.current = 0;
    dashTrailRef.current = { dropped: TRAIL_COPIES, nextDropMs: 0 };
    dashMeter.setValue(1);
    setDashReady(true);
    ballPosition.setValue({ x: start.x - BALL_RADIUS, y: start.y - BALL_RADIUS });
    ballScaleX.setValue(1);
    ballScaleY.setValue(1);
    ballFlash.setValue(0);
    goalPulse.setValue(0);
    trailGhosts.forEach((ghost) => ghost.opacity.setValue(0));
    setCollected([]);
    setElapsedMs(0);
    setHits(0);
    setNewBest(false);
  }, [ballFlash, ballPosition, ballScaleX, ballScaleY, dashMeter, goalPulse, trailGhosts]);

  const flashBall = useCallback((strength: number) => {
    ballFlash.setValue(strength);
    Animated.timing(ballFlash, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [ballFlash]);

  const squashBall = useCallback((horizontal: boolean) => {
    const squash = (value: Animated.Value, toValue: number) => Animated.sequence([
      Animated.timing(value, { toValue, duration: 60, useNativeDriver: true }),
      Animated.timing(value, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]);

    Animated.parallel([
      squash(ballScaleX, horizontal ? 0.76 : 1.16),
      squash(ballScaleY, horizontal ? 1.16 : 0.76),
    ]).start();
    flashBall(0.45);
  }, [ballScaleX, ballScaleY, flashBall]);

  const startRun = useCallback((size = boardSizeRef.current, nextLevel = levelRef.current) => {
    if (!size.width || !size.height) return;

    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    levelRef.current = nextLevel;
    setLevelIndex(nextLevel);
    resetGame(size);
    sequenceOpacity.stopAnimation();
    sequenceOpacity.setValue(1);
    countdownScale.stopAnimation();
    countdownScale.setValue(1);
    setCountdown(null);
    calibrationSampleRef.current = { x: 0, y: 0, count: 0 };
    updateStatus("calibrating");

    calibrationProgress.setValue(0);
    Animated.timing(calibrationProgress, {
      toValue: 1,
      duration: CALIBRATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const showCountdown = (value: number) => {
      if (value > 0) {
        setCountdown(String(value));
        countdownFeedback();
        sequenceTimerRef.current = setTimeout(() => showCountdown(value - 1), COUNTDOWN_STEP_MS);
        return;
      }

      setCountdown("GO");
      goFeedback();
      updateStatus("playing");
      Animated.parallel([
        Animated.timing(countdownScale, { toValue: 1.35, duration: 280, useNativeDriver: true }),
        Animated.timing(sequenceOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setCountdown(null);
      });
    };

    sequenceTimerRef.current = setTimeout(() => {
      const { x, y, count } = calibrationSampleRef.current;
      const baseline = count > 0 ? { x: x / count, y: y / count } : { ...sensorRef.current };
      baselineRef.current = baseline;
      smoothedRef.current = { ...baseline };
      tiltRef.current = { x: 0, y: 0 };
      calibratedFeedback();
      updateStatus("countdown");
      showCountdown(COUNTDOWN_START);
    }, CALIBRATION_MS);
  }, [calibrationProgress, countdownScale, resetGame, sequenceOpacity, updateStatus]);

  const handleBoardLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (Math.abs(width - boardSizeRef.current.width) < 1 && Math.abs(height - boardSizeRef.current.height) < 1) {
      return;
    }

    const nextSize = { width, height };
    boardSizeRef.current = nextSize;
    setBoardSize(nextSize);
    startRun(nextSize);
  }, [startRun]);

  useEffect(() => {
    if (Platform.OS === "web") {
      setSensorAvailable(false);
      return;
    }

    let active = true;
    let accelerometerSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
    let gyroscopeSubscription: ReturnType<typeof Gyroscope.addListener> | null = null;

    const connectSensors = async () => {
      const [accelerometerIsAvailable, gyroscopeIsAvailable] = await Promise.all([
        Accelerometer.isAvailableAsync(),
        Gyroscope.isAvailableAsync(),
      ]);

      if (!active) return;
      setSensorAvailable(accelerometerIsAvailable);
      Accelerometer.setUpdateInterval(TILT_SENSOR_INTERVAL);
      Gyroscope.setUpdateInterval(SPIN_SENSOR_INTERVAL);

      if (accelerometerIsAvailable) {
        accelerometerSubscription = Accelerometer.addListener(({ x, y }) => {
          sensorRef.current = { x, y };
          if (statusRef.current === "calibrating") {
            const sample = calibrationSampleRef.current;
            sample.x += x;
            sample.y += y;
            sample.count += 1;
          }
        });
      }

      if (gyroscopeIsAvailable) {
        gyroscopeSubscription = Gyroscope.addListener(({ x, y, z }) => {
          const spin = Math.sqrt(x * x + y * y + z * z);
          if (spin < 4.2 || dashCooldownRef.current > 0 || statusRef.current !== "playing") return;

          const velocity = velocityRef.current;
          const inputX = tiltRef.current.x;
          const inputY = tiltRef.current.y;
          const inputMagnitude = Math.hypot(inputX, inputY);
          const velocityMagnitude = Math.hypot(velocity.x, velocity.y);
          const direction = velocityMagnitude > 18
            ? { x: velocity.x / velocityMagnitude, y: velocity.y / velocityMagnitude }
            : inputMagnitude > 0.04
              ? { x: inputX / inputMagnitude, y: inputY / inputMagnitude }
              : { x: 0, y: -1 };

          velocityRef.current = {
            x: direction.x * MAX_SPEED,
            y: direction.y * MAX_SPEED,
          };
          dashCooldownRef.current = DASH_COOLDOWN_MS;
          dashTrailRef.current = { dropped: 0, nextDropMs: 0 };
          flashBall(0.8);
          setDashReady(false);
          dashFeedback();
        });
      }
    };

    connectSensors();

    return () => {
      active = false;
      accelerometerSubscription?.remove();
      gyroscopeSubscription?.remove();
    };
  }, [flashBall]);

  useEffect(() => {
    let animationFrame = 0;

    const update = (timestamp: number) => {
      animationFrame = requestAnimationFrame(update);
      const size = boardSizeRef.current;
      if (!size.width || !size.height || statusRef.current !== "playing") {
        lastFrameRef.current = timestamp;
        return;
      }

      if (!lastFrameRef.current) {
        lastFrameRef.current = timestamp;
        return;
      }

      const deltaMs = Math.min(timestamp - lastFrameRef.current, 34);
      const deltaSeconds = deltaMs / 1000;
      lastFrameRef.current = timestamp;
      elapsedRef.current += deltaMs;

      if (dashCooldownRef.current > 0) {
        dashCooldownRef.current = Math.max(0, dashCooldownRef.current - deltaMs);
        dashMeter.setValue(1 - dashCooldownRef.current / DASH_COOLDOWN_MS);
        if (dashCooldownRef.current === 0) setDashReady(true);
      }

      const smoothing = 1 - Math.exp(-deltaMs / TILT_SMOOTHING_MS);
      const smoothed = smoothedRef.current;
      smoothed.x += (sensorRef.current.x - smoothed.x) * smoothing;
      smoothed.y += (sensorRef.current.y - smoothed.y) * smoothing;
      const tilt = tiltRef.current;
      tilt.x = smoothed.x - baselineRef.current.x;
      tilt.y = -(smoothed.y - baselineRef.current.y);

      const inputX = clamp(applyDeadZone(tilt.x), -0.8, 0.8);
      const inputY = clamp(applyDeadZone(tilt.y), -0.8, 0.8);
      const friction = Math.pow(FRICTION, deltaMs / 16.67);
      const velocity = velocityRef.current;
      // Steering against the current motion brakes harder, so the ball follows a change of tilt quickly.
      const accelerationX = ACCELERATION * (inputX * velocity.x < 0 ? COUNTER_STEER_BOOST : 1);
      const accelerationY = ACCELERATION * (inputY * velocity.y < 0 ? COUNTER_STEER_BOOST : 1);

      velocity.x = clamp((velocity.x + inputX * accelerationX * deltaSeconds) * friction, -MAX_SPEED, MAX_SPEED);
      velocity.y = clamp((velocity.y + inputY * accelerationY * deltaSeconds) * friction, -MAX_SPEED, MAX_SPEED);
      if (inputX === 0 && inputY === 0 && Math.hypot(velocity.x, velocity.y) < REST_SPEED) {
        velocity.x = 0;
        velocity.y = 0;
      }

      const level = LEVELS[levelRef.current];
      const walls = pixelWallsRef.current;
      const position = positionRef.current;
      let nextX = position.x + velocity.x * deltaSeconds;
      let nextY = position.y + velocity.y * deltaSeconds;
      let impactX = 0;
      let impactY = 0;

      if (nextX < BALL_RADIUS || nextX > size.width - BALL_RADIUS) {
        nextX = clamp(nextX, BALL_RADIUS, size.width - BALL_RADIUS);
        impactX = Math.abs(velocity.x);
        velocity.x *= -0.34;
      }

      if (walls.some((wall) => circleIntersectsRect(nextX, position.y, BALL_RADIUS, wall))) {
        nextX = position.x;
        impactX = Math.max(impactX, Math.abs(velocity.x));
        velocity.x *= -0.34;
      }

      if (nextY < BALL_RADIUS || nextY > size.height - BALL_RADIUS) {
        nextY = clamp(nextY, BALL_RADIUS, size.height - BALL_RADIUS);
        impactY = Math.abs(velocity.y);
        velocity.y *= -0.34;
      }

      if (walls.some((wall) => circleIntersectsRect(nextX, nextY, BALL_RADIUS, wall))) {
        nextY = position.y;
        impactY = Math.max(impactY, Math.abs(velocity.y));
        velocity.y *= -0.34;
      }

      // Leaning on a wall produces tiny rebounds every frame; only real impacts give feedback.
      const impactSpeed = Math.max(impactX, impactY);
      if (impactSpeed > MIN_IMPACT_SPEED && timestamp - lastHitRef.current > 360) {
        lastHitRef.current = timestamp;
        hitsRef.current += 1;
        setHits(hitsRef.current);
        squashBall(impactX >= impactY);
        wallHitFeedback(impactSpeed);
      }

      positionRef.current = { x: nextX, y: nextY };

      const trail = dashTrailRef.current;
      if (trail.dropped < TRAIL_COPIES) {
        trail.nextDropMs -= deltaMs;
        if (trail.nextDropMs <= 0) {
          const ghost = trailGhosts[trail.dropped];
          ghost.position.setValue({ x: nextX - BALL_RADIUS, y: nextY - BALL_RADIUS });
          ghost.opacity.setValue(0.55);
          Animated.timing(ghost.opacity, { toValue: 0, duration: TRAIL_FADE_MS, useNativeDriver: true }).start();
          trail.dropped += 1;
          trail.nextDropMs = TRAIL_STEP_MS;
        }
      }

      level.crystals.forEach((crystal, index) => {
        if (collectedRef.current.has(index)) return;
        const crystalX = crystal.x * size.width;
        const crystalY = crystal.y * size.height;
        if (distance(nextX, nextY, crystalX, crystalY) < BALL_RADIUS + CRYSTAL_RADIUS) {
          collectedRef.current.add(index);
          setCollected(Array.from(collectedRef.current));
          crystalBursts[index].setValue(0);
          Animated.timing(crystalBursts[index], { toValue: 1, duration: 320, useNativeDriver: true }).start();
          crystalFeedback(collectedRef.current.size);
          if (collectedRef.current.size === level.crystals.length) {
            goalPulse.setValue(0);
            Animated.timing(goalPulse, { toValue: 1, duration: 720, useNativeDriver: true }).start();
            goalUnlockedFeedback();
          }
        }
      });

      const goalX = size.width * level.goal.x;
      const goalY = size.height * level.goal.y;
      const allCrystalsCollected = collectedRef.current.size === level.crystals.length;
      if (allCrystalsCollected && distance(nextX, nextY, goalX, goalY) < BALL_RADIUS + GOAL_RADIUS - 5) {
        const finalTime = elapsedRef.current;
        setElapsedMs(finalTime);
        const bestTime = getBestTime(levelRef.current);
        setNewBest(bestTime !== null && finalTime < bestTime);
        if (bestTime === null || finalTime < bestTime) saveBestTime(levelRef.current, finalTime);
        updateStatus("won");
        velocityRef.current = { x: 0, y: 0 };
        winFeedback();
        successRing.setValue(0);
        Animated.timing(successRing, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      }

      ballPosition.setValue({ x: nextX - BALL_RADIUS, y: nextY - BALL_RADIUS });

      if (timestamp - lastPaintRef.current > HUD_INTERVAL_MS) {
        lastPaintRef.current = timestamp;
        setElapsedMs(elapsedRef.current);
      }
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [ballPosition, crystalBursts, dashMeter, goalPulse, squashBall, successRing, trailGhosts, updateStatus]);

  useEffect(() => {
    loadSounds();

    return () => {
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, []);

  const togglePause = () => {
    if (statusRef.current === "playing") {
      updateStatus("paused");
    } else if (statusRef.current === "paused") {
      smoothedRef.current = { ...sensorRef.current };
      velocityRef.current = { x: 0, y: 0 };
      updateStatus("playing");
    }
  };

  const level = LEVELS[levelIndex];
  const hasNextLevel = levelIndex < LEVELS.length - 1;
  const walls = getPixelWalls(boardSize, level.walls);
  const goalUnlocked = collected.length === level.crystals.length;
  const sequenceActive = status === "calibrating" || countdown !== null;
  const goalBreathing = goalUnlocked && status === "playing";
  const goalRingPosition = {
    left: boardSize.width * level.goal.x - GOAL_RADIUS,
    top: boardSize.height * level.goal.y - GOAL_RADIUS,
  };

  useEffect(() => {
    if (!goalBreathing) return;

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(goalBreath, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(goalBreath, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    breathing.start();

    return () => {
      breathing.stop();
      goalBreath.setValue(0);
    };
  }, [goalBreath, goalBreathing]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <View style={styles.hudTime}>
            <Text style={styles.microLabel}>TIME</Text>
            <Text style={styles.hudValue}>{formatTime(elapsedMs)}</Text>
          </View>
          <View style={styles.hudCrystals}>
            <View style={styles.hudCrystalIcon} />
            <Text style={[styles.hudValue, styles.hudCrystalValue]}>{`${collected.length}/${level.crystals.length}`}</Text>
          </View>
          <View style={styles.hudPause}>
            <Pressable
              accessibilityLabel="Pause"
              accessibilityRole="button"
              disabled={status !== "playing"}
              onPress={togglePause}
              style={({ pressed }) => [styles.pauseButton, pressed && styles.buttonPressed]}
            >
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </Pressable>
          </View>
        </View>
        <View style={styles.dashRow}>
          <Text style={styles.microLabel}>DASH</Text>
          <View style={[styles.dashTrack, dashReady && styles.dashTrackReady]}>
            <Animated.View style={[styles.dashFill, { transform: [{ scaleX: dashMeter }] }]} />
          </View>
          {sensorAvailable === false && <Text style={styles.sensorNotice}>NO MOTION SENSOR</Text>}
          <Text style={styles.microLabel}>{`LEVEL ${levelIndex + 1}/${LEVELS.length}`}</Text>
        </View>
      </View>

      <View style={styles.boardShell}>
        <View style={styles.boardShadow} />
        <View style={styles.boardSide} />
        <View style={styles.board} onLayout={handleBoardLayout}>
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <View key={`v-${ratio}`} style={[styles.gridVertical, { left: `${ratio * 100}%` }]} />
          ))}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <View key={`h-${ratio}`} style={[styles.gridHorizontal, { top: `${ratio * 100}%` }]} />
          ))}

          <View style={[styles.startZone, { left: boardSize.width * level.start.x - START_ZONE_WIDTH / 2 }]}>
            <Text style={styles.zoneLabel}>START</Text>
          </View>

          {walls.map((wall, index) => (
            <View
              key={index}
              style={[
                styles.wall,
                { left: wall.x, top: wall.y, width: wall.width, height: wall.height },
              ]}
            >
              <View style={[styles.wallEdge, { height: Math.min(WALL_EDGE_DEPTH, wall.height / 2) }]} />
            </View>
          ))}

          {level.crystals.map((crystal, index) => {
            const burst = crystalBursts[index];
            return (
              <View
                key={index}
                style={[
                  styles.crystalGlow,
                  {
                    left: crystal.x * boardSize.width - CRYSTAL_RADIUS,
                    top: crystal.y * boardSize.height - CRYSTAL_RADIUS,
                  },
                ]}
              >
                {collected.includes(index) ? (
                  <>
                    <Animated.View
                      style={[
                        styles.crystalRing,
                        {
                          opacity: burst.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
                          transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] }) }],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.crystal,
                        {
                          opacity: burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                          transform: [
                            { rotate: "45deg" },
                            { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
                          ],
                        },
                      ]}
                    />
                  </>
                ) : (
                  <View style={styles.crystal}>
                    <LinearGradient colors={["#C4A2FF", "#6D28D9"]} style={StyleSheet.absoluteFill} />
                  </View>
                )}
              </View>
            );
          })}

          {goalUnlocked && (
            <>
              <Animated.View
                style={[
                  styles.successRing,
                  goalRingPosition,
                  {
                    opacity: goalPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                    transform: [{ scale: goalPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }) }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.successRing,
                  goalRingPosition,
                  {
                    opacity: goalBreath.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.15] }),
                    transform: [{ scale: goalBreath.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.28] }) }],
                  },
                ]}
              />
            </>
          )}

          <View
            style={[
              styles.goal,
              goalUnlocked && styles.goalUnlocked,
              goalRingPosition,
            ]}
          >
            <View style={[styles.goalCore, goalUnlocked && styles.goalCoreUnlocked]} />
            <Text style={[styles.goalIcon, goalUnlocked && styles.goalIconUnlocked]}>{goalUnlocked ? "◇" : "×"}</Text>
          </View>

          {boardSize.width > 0 && (
            <>
              <Animated.View style={[styles.ballShadow, { transform: ballPosition.getTranslateTransform() }]} />
              {trailGhosts.map((ghost, index) => (
                <Animated.View
                  key={index}
                  style={[styles.ballMount, { transform: ghost.position.getTranslateTransform() }]}
                >
                  <Animated.View style={[styles.ball, { opacity: ghost.opacity }]} />
                </Animated.View>
              ))}
              {/* Position is set from JS and the squash runs natively, so they stay on separate views. */}
              <Animated.View style={[styles.ballMount, { transform: ballPosition.getTranslateTransform() }]}>
                <Animated.View style={[styles.ball, { transform: [{ scaleX: ballScaleX }, { scaleY: ballScaleY }] }]}>
                  <LinearGradient colors={["#6FE3FF", "#0A74F0"]} style={StyleSheet.absoluteFill} />
                  <View style={styles.ballHighlight} />
                  <Animated.View style={[styles.ballFlash, { opacity: ballFlash }]} />
                </Animated.View>
              </Animated.View>
            </>
          )}
        </View>

        {sequenceActive && (
          <Animated.View pointerEvents="none" style={[styles.boardOverlay, { opacity: sequenceOpacity }]}>
            <View style={styles.sequenceCenter}>
              <View style={styles.ringOuter} />
              <View style={styles.ringInner} />
              {status === "calibrating" && (
                <Animated.View
                  style={[
                    styles.ringProgress,
                    {
                      transform: [
                        {
                          rotate: calibrationProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
              {countdown === null ? (
                <View style={styles.calibrationBall}>
                  <View style={styles.calibrationHighlight} />
                </View>
              ) : (
                <Animated.Text
                  style={[
                    styles.countdownText,
                    countdown === "GO" && styles.countdownGo,
                    { transform: [{ scale: countdownScale }] },
                  ]}
                >
                  {countdown}
                </Animated.Text>
              )}
            </View>
            <View style={styles.sequenceCopy}>
              {status === "calibrating" && (
                <>
                  <Text style={styles.screenTitle}>HOLD STEADY</Text>
                  <Text style={styles.supportingText}>Keep the phone in a comfortable position</Text>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {status === "paused" && (
          <View style={styles.boardOverlay}>
            <View style={styles.overlayCard}>
              <Text style={[styles.screenTitle, styles.overlayTitle]}>PAUSED</Text>
              <PrimaryButton label="RESUME" onPress={togglePause} />
              <Pressable
                accessibilityRole="button"
                onPress={() => startRun()}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>RESTART RUN</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.dismissTo("/")} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>QUIT TO HOME</Text>
              </Pressable>
            </View>
          </View>
        )}

        {status === "won" && (
          <View style={styles.boardOverlay}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.successRing,
                goalRingPosition,
                {
                  opacity: successRing.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                  transform: [{ scale: successRing.interpolate({ inputRange: [0, 1], outputRange: [0.6, 4] }) }],
                },
              ]}
            />
            <View style={styles.overlayCard}>
              <Text style={styles.resultLabel}>{`LEVEL ${levelIndex + 1} COMPLETE`}</Text>
              <Text style={styles.resultTime}>{formatTime(elapsedMs)}</Text>
              {newBest && (
                <View style={styles.newBestBadge}>
                  <Text style={styles.newBestText}>NEW BEST</Text>
                </View>
              )}
              <View style={styles.resultStats}>
                <ResultStat label="CRYSTALS" value={`${collected.length}/${level.crystals.length}`} />
                <ResultStat label="WALL HITS" value={String(hits)} />
              </View>
              <PrimaryButton
                label={hasNextLevel ? "NEXT LEVEL" : "RUN AGAIN"}
                onPress={() => startRun(undefined, hasNextLevel ? levelIndex + 1 : levelIndex)}
              />
              {hasNextLevel && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => startRun()}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.secondaryButtonText}>RUN AGAIN</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.dismissTo("/")}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>BACK HOME</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultStat}>
      <Text style={styles.microLabel}>{label}</Text>
      <Text style={styles.hudValue}>{value}</Text>
    </View>
  );
}

function getPixelWalls(size: BoardSize, levelWalls: NormalizedRect[]) {
  return levelWalls.map((wall) => ({
    x: wall.x * size.width,
    y: wall.y * size.height,
    width: wall.width * size.width,
    height: wall.height * size.height,
  }));
}

function circleIntersectsRect(
  circleX: number,
  circleY: number,
  radius: number,
  rect: NormalizedRect,
) {
  const closestX = clamp(circleX, rect.x, rect.x + rect.width);
  const closestY = clamp(circleY, rect.y, rect.y + rect.height);
  return distance(circleX, circleY, closestX, closestY) < radius;
}

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function applyDeadZone(value: number) {
  return Math.sign(value) * Math.max(0, Math.abs(value) - DEAD_ZONE);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FC", paddingHorizontal: 20 },
  hud: {
    borderRadius: 18, borderWidth: 1, borderColor: "#DDE4F0", backgroundColor: "#FFFFFF",
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 4, marginBottom: 12, gap: 6,
  },
  hudRow: { flexDirection: "row", alignItems: "center" },
  hudTime: { flex: 1 },
  hudCrystals: { flexDirection: "row", alignItems: "center", gap: 10 },
  hudCrystalIcon: {
    width: 13, height: 13, borderRadius: 2, backgroundColor: "#8B5CF6", transform: [{ rotate: "45deg" }],
  },
  hudCrystalValue: { color: "#8B5CF6" },
  hudPause: { flex: 1, alignItems: "flex-end" },
  pauseButton: {
    width: 44, height: 44, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, borderWidth: 1, borderColor: "#DDE4F0", backgroundColor: "#F5F7FC",
  },
  pauseBar: { width: 5, height: 17, borderRadius: 2, backgroundColor: "#172033" },
  microLabel: { color: "#5F6C85", fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  hudValue: { color: "#172033", fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  dashRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 14 },
  dashTrack: {
    flex: 1, height: 6, borderRadius: 3, overflow: "hidden", borderWidth: 1,
    borderColor: "#DDE4F0", backgroundColor: "#F5F7FC",
  },
  dashTrackReady: { borderColor: "#12B5EA" },
  dashFill: { flex: 1, backgroundColor: "#12B5EA", transformOrigin: "left" },
  sensorNotice: { color: "#E5484D", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  boardShell: { flex: 1, minHeight: 360, marginBottom: 8, paddingBottom: BOARD_SIDE_DEPTH + BOARD_SHADOW_DEPTH },
  boardShadow: {
    position: "absolute", left: 6, right: 6, top: 40, bottom: 0, borderRadius: 12, backgroundColor: "#E3E9F5",
  },
  boardSide: {
    position: "absolute", left: 0, right: 0, top: 20, bottom: BOARD_SHADOW_DEPTH, borderRadius: 12,
    backgroundColor: "#C9D4EA",
  },
  board: { flex: 1, overflow: "hidden", borderRadius: 12, backgroundColor: "#FFFFFF" },
  gridVertical: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(79, 93, 255, 0.06)" },
  gridHorizontal: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(79, 93, 255, 0.06)" },
  startZone: {
    position: "absolute", bottom: 7, width: START_ZONE_WIDTH, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: "#C9D4EA", alignItems: "center", justifyContent: "flex-end",
    paddingBottom: 4,
  },
  zoneLabel: { color: "#5F6C85", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  wall: { position: "absolute", overflow: "hidden", backgroundColor: "#4F5DFF", borderRadius: 3 },
  wallEdge: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#3540C0" },
  crystalGlow: {
    position: "absolute", width: CRYSTAL_RADIUS * 2, height: CRYSTAL_RADIUS * 2,
    alignItems: "center", justifyContent: "center",
  },
  crystal: {
    width: 17, height: 17, transform: [{ rotate: "45deg" }], borderRadius: 2, overflow: "hidden",
    backgroundColor: "#8B5CF6", borderWidth: 2, borderColor: "#5B21B6",
  },
  crystalRing: {
    position: "absolute", width: CRYSTAL_RADIUS * 2, height: CRYSTAL_RADIUS * 2, borderRadius: CRYSTAL_RADIUS,
    borderWidth: 2, borderColor: "#8B5CF6",
  },
  goal: {
    position: "absolute", width: GOAL_RADIUS * 2, height: GOAL_RADIUS * 2, borderRadius: GOAL_RADIUS,
    alignItems: "center", justifyContent: "center", borderWidth: 2,
    borderColor: "rgba(255, 159, 28, 0.6)", backgroundColor: "#FFFFFF",
  },
  goalUnlocked: { borderColor: "#FFFFFF", backgroundColor: "#FF9F1C" },
  goalCore: { width: 29, height: 29, borderRadius: 15, borderWidth: 1, borderColor: "rgba(255, 159, 28, 0.45)" },
  goalCoreUnlocked: { borderColor: "#FFFFFF" },
  goalIcon: { position: "absolute", color: "#FF9F1C", fontSize: 17, fontWeight: "900" },
  goalIconUnlocked: { color: "#FFFFFF" },
  ballShadow: {
    position: "absolute", left: 3, top: 5, width: BALL_RADIUS * 2, height: BALL_RADIUS * 2, borderRadius: BALL_RADIUS,
    backgroundColor: "rgba(23, 32, 51, 0.18)",
  },
  ballMount: { position: "absolute", left: 0, top: 0, width: BALL_RADIUS * 2, height: BALL_RADIUS * 2 },
  ball: {
    width: BALL_RADIUS * 2, height: BALL_RADIUS * 2, borderRadius: BALL_RADIUS, overflow: "hidden",
    backgroundColor: "#12B5EA", borderWidth: 2, borderColor: "#075985",
  },
  ballFlash: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#FFFFFF" },
  ballHighlight: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF", opacity: 0.84, marginLeft: 5, marginTop: 4 },
  boardOverlay: {
    position: "absolute", top: 0, right: 0, left: 0, bottom: BOARD_SIDE_DEPTH + BOARD_SHADOW_DEPTH,
    overflow: "hidden", alignItems: "center", justifyContent: "center", borderRadius: 12,
    padding: 16, backgroundColor: "rgba(245, 247, 252, 0.84)",
  },
  sequenceCenter: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ringOuter: {
    position: "absolute", width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2,
    borderWidth: 1, borderColor: "#DDE4F0",
  },
  ringInner: {
    position: "absolute", width: RING_SIZE * 0.72, height: RING_SIZE * 0.72, borderRadius: RING_SIZE * 0.36,
    borderWidth: 1, borderColor: "#DDE4F0",
  },
  ringProgress: {
    position: "absolute", width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 3,
    borderColor: "transparent", borderTopColor: "#12B5EA",
  },
  calibrationBall: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#12B5EA" },
  calibrationHighlight: {
    width: 13, height: 13, borderRadius: 7, backgroundColor: "#FFFFFF", opacity: 0.84, marginLeft: 12, marginTop: 10,
  },
  countdownText: { color: "#172033", fontSize: 72, lineHeight: 84, fontWeight: "900", fontVariant: ["tabular-nums"] },
  countdownGo: { color: "#12B5EA" },
  sequenceCopy: { minHeight: 76, alignItems: "center", marginTop: 16 },
  screenTitle: { color: "#172033", fontSize: 26, fontWeight: "800", letterSpacing: 1 },
  supportingText: { color: "#5F6C85", fontSize: 14, fontWeight: "500", marginTop: 6, textAlign: "center" },
  overlayCard: {
    width: "100%", maxWidth: 300, borderRadius: 18, borderWidth: 1, borderColor: "#DDE4F0",
    backgroundColor: "#FFFFFF", padding: 20, alignItems: "center", gap: 12,
  },
  overlayTitle: { marginBottom: 4 },
  secondaryButton: {
    width: "100%", minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#DDE4F0", borderBottomWidth: 3, borderBottomColor: "#C9D4EA", backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: { color: "#172033", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  textButton: { minHeight: 44, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  textButtonLabel: { color: "#5F6C85", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  buttonPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  successRing: {
    position: "absolute", width: GOAL_RADIUS * 2, height: GOAL_RADIUS * 2, borderRadius: GOAL_RADIUS,
    borderWidth: 3, borderColor: "#FF9F1C",
  },
  resultLabel: { color: "#FF9F1C", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  resultTime: { color: "#172033", fontSize: 42, fontWeight: "900", fontVariant: ["tabular-nums"] },
  newBestBadge: { borderRadius: 12, backgroundColor: "#FF9F1C", paddingHorizontal: 12, paddingVertical: 4 },
  newBestText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  resultStats: { flexDirection: "row", width: "100%", paddingVertical: 4 },
  resultStat: { flex: 1, alignItems: "center", gap: 2 },
});
