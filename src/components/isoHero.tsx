import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { ReactNode, useCallback, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from "react-native";

const ISO_SQUASH = 0.57;
const BLOCK_EDGE = 6;
const BALL_SIZE = 22;
const BALL_CONTACT = 3;
const CRYSTAL_SIZE = 14;
const CRYSTAL_HOVER = 16;
const SHADOW_SIZE = 0.09;
const GOAL_SIZE = 0.15;
const TILT_INTERVAL_MS = 100;
const TILT_RANGE = 6;
const TILT_MIN_STEP = 0.4;
const SCENE_PARALLAX = 0.4;
const BALL_PARALLAX = 0.6;
const BASE_SIDES = [
  { offset: 12, color: "#3F52F2" },
  { offset: 9, color: "#7C8CFF" },
  { offset: 6, color: "#DDE4F0" },
  { offset: 3, color: "#EEF2FB" },
];
const BOARD_RADIUS = 18;
const ORBIT_DURATION_MS = 14000;
const BASE_SHADOW_OFFSET = 18;
const BLOCKS = [
  { x: 0.08, y: 0.08, width: 0.62, height: 0.14 },
  { x: 0.08, y: 0.22, width: 0.14, height: 0.42 },
  { x: 0.42, y: 0.42, width: 0.14, height: 0.5 },
  { x: 0.78, y: 0.3, width: 0.14, height: 0.44 },
];
const BALL = { x: 0.31, y: 0.55 };
const CRYSTALS = [
  { x: 0.67, y: 0.6 },
  { x: 0.31, y: 0.3 },
];
const GOAL = { x: 0.85, y: 0.13 };

export default function IsoHero({ size }: { size: number }) {
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const float = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
      let neutral: { x: number; y: number } | null = null;
      let last = { x: 0, y: 0 };

      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      floatLoop.start();

      const orbitLoop = Animated.loop(
        Animated.timing(orbit, {
          toValue: 1,
          duration: ORBIT_DURATION_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      orbitLoop.start();

      const connectSensor = async () => {
        if (Platform.OS === "web" || !(await Accelerometer.isAvailableAsync()) || !active) return;

        Accelerometer.setUpdateInterval(TILT_INTERVAL_MS);
        subscription = Accelerometer.addListener(({ x, y }) => {
          neutral ??= { x, y };
          const next = {
            x: clamp(x - neutral.x) * TILT_RANGE,
            y: clamp(neutral.y - y) * TILT_RANGE,
          };
          if (Math.hypot(next.x - last.x, next.y - last.y) < TILT_MIN_STEP) return;

          last = next;
          Animated.timing(tilt, {
            toValue: next,
            duration: TILT_INTERVAL_MS + 40,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        });
      };

      connectSensor();

      return () => {
        active = false;
        subscription?.remove();
        floatLoop.stop();
        orbitLoop.stop();
      };
    }, [float, orbit, tilt]),
  );

  const stageWidth = size * Math.SQRT2;
  const stageHeight = stageWidth * ISO_SQUASH + BASE_SHADOW_OFFSET * 2;
  const centerX = stageWidth / 2;
  const centerY = stageHeight / 2;
  const ball = project(BALL, size);
  const shadowSize = size * SHADOW_SIZE;
  const planeProps = { centerX, centerY, size };

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: stageWidth,
        height: stageHeight,
        transform: [
          { translateX: Animated.multiply(tilt.x, SCENE_PARALLAX) },
          { translateY: Animated.multiply(tilt.y, SCENE_PARALLAX) },
        ],
      }}
    >
      <View style={[styles.orbitFrame, { width: stageWidth, height: stageWidth, top: centerY - stageWidth / 2 }]}>
        <Animated.View
          style={[
            styles.orbit,
            {
              borderRadius: stageWidth / 2,
              transform: [{ rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }],
            },
          ]}
        />
      </View>
      <Plane {...planeProps} offsetY={BASE_SHADOW_OFFSET} style={styles.baseShadow} />
      {BASE_SIDES.map(({ offset, color }) => (
        <Plane key={offset} {...planeProps} offsetY={offset} style={{ ...styles.baseSide, backgroundColor: color }} />
      ))}
      <Plane {...planeProps} offsetY={0} style={styles.baseTop}>
        {BLOCKS.map((block, index) => (
          <View key={index} style={[styles.blockEdge, blockBox(block)]}>
            <LinearGradient colors={["#2F4CF0", "#6A35F0"]} style={styles.blockVoid} />
          </View>
        ))}
        <View style={[styles.goalPad, ratioBox(GOAL, GOAL_SIZE)]}>
          <Animated.View
            style={[
              styles.goalCore,
              { opacity: float.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) },
            ]}
          />
        </View>
        {[BALL, ...CRYSTALS].map((point, index) => (
          <View
            key={index}
            style={[styles.shadow, ratioBox(point, SHADOW_SIZE), { borderRadius: shadowSize / 2 }]}
          />
        ))}
      </Plane>

      {CRYSTALS.map((point, index) => {
        const crystal = project(point, size);
        return (
          <Animated.View
            key={index}
            style={[
              styles.crystal,
              {
                left: centerX + crystal.x - CRYSTAL_SIZE / 2,
                top: centerY + crystal.y - CRYSTAL_SIZE - CRYSTAL_HOVER,
                transform: [
                  { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                  { rotate: "45deg" },
                ],
              },
            ]}
          >
            <LinearGradient colors={["#C4A2FF", "#6D28D9"]} style={StyleSheet.absoluteFill} />
          </Animated.View>
        );
      })}
      <Animated.View
        style={[
          styles.ball,
          {
            left: centerX + ball.x - BALL_SIZE / 2,
            top: centerY + ball.y - BALL_SIZE + BALL_CONTACT,
            transform: [
              { translateX: Animated.multiply(tilt.x, BALL_PARALLAX) },
              { translateY: Animated.multiply(tilt.y, BALL_PARALLAX) },
            ],
          },
        ]}
      >
        <LinearGradient colors={["#6FE3FF", "#0A74F0"]} style={StyleSheet.absoluteFill} />
        <View style={styles.ballHighlight} />
      </Animated.View>
    </Animated.View>
  );
}

// Scale and rotation stay on separate views: Android cannot apply the skew of a combined matrix.
function Plane({
  centerX,
  centerY,
  size,
  offsetY,
  style,
  children,
}: {
  centerX: number;
  centerY: number;
  size: number;
  offsetY: number;
  style?: ViewStyle;
  children?: ReactNode;
}) {
  return (
    <View
      style={[
        styles.plane,
        {
          left: centerX - size / 2,
          top: centerY - size / 2,
          width: size,
          height: size,
          transform: [{ translateY: offsetY }, { scaleY: ISO_SQUASH }],
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, styles.planeRotation, style]}>{children}</View>
    </View>
  );
}

function project(point: { x: number; y: number }, size: number) {
  const planeX = (point.x - 0.5) * size;
  const planeY = (point.y - 0.5) * size;
  return {
    x: (planeX - planeY) * Math.SQRT1_2,
    y: (planeX + planeY) * Math.SQRT1_2 * ISO_SQUASH,
  };
}

function blockBox(block: (typeof BLOCKS)[number]) {
  return {
    left: `${block.x * 100}%`,
    top: `${block.y * 100}%`,
    width: `${block.width * 100}%`,
    height: `${block.height * 100}%`,
  } as const;
}

function ratioBox(center: { x: number; y: number }, ratio: number) {
  return blockBox({
    x: center.x - ratio / 2,
    y: center.y - ratio / 2,
    width: ratio,
    height: ratio,
  });
}

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}

const styles = StyleSheet.create({
  plane: { position: "absolute" },
  planeRotation: { borderRadius: BOARD_RADIUS, overflow: "hidden", transform: [{ rotate: "45deg" }] },
  orbitFrame: { position: "absolute", left: 0, transform: [{ scaleY: ISO_SQUASH }] },
  orbit: {
    flex: 1, borderWidth: 3, borderColor: "transparent", borderTopColor: "rgba(18, 181, 234, 0.45)",
    borderBottomColor: "rgba(79, 93, 255, 0.35)",
  },
  baseShadow: { backgroundColor: "rgba(63, 82, 242, 0.18)" },
  baseSide: {},
  baseTop: { backgroundColor: "#FFFFFF" },
  blockEdge: { position: "absolute", backgroundColor: "#3540C0" },
  blockVoid: {
    position: "absolute", left: BLOCK_EDGE, top: BLOCK_EDGE, right: 0, bottom: 0,
    backgroundColor: "#4F5DFF",
  },
  goalPad: {
    position: "absolute", alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#FF9F1C",
  },
  goalCore: { width: "36%", height: "36%", backgroundColor: "#FF9F1C" },
  shadow: { position: "absolute", backgroundColor: "rgba(23, 32, 51, 0.18)" },
  crystal: {
    position: "absolute", width: CRYSTAL_SIZE, height: CRYSTAL_SIZE, borderRadius: 2, overflow: "hidden",
    backgroundColor: "#8B5CF6", borderWidth: 2, borderColor: "#5B21B6",
  },
  ball: {
    position: "absolute", width: BALL_SIZE, height: BALL_SIZE, borderRadius: BALL_SIZE / 2, overflow: "hidden",
    backgroundColor: "#12B5EA", borderWidth: 2, borderColor: "#075985",
  },
  ballHighlight: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: "#FFFFFF", opacity: 0.85,
    marginLeft: 4, marginTop: 3,
  },
});
