import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { SFSymbol, SymbolView } from "expo-symbols";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IsoHero from "../components/isoHero";
import PrimaryButton from "../components/primaryButton";
import { formatTime, getBestTime, hasSeenHowTo, markHowToSeen } from "../utils/progress";

const LEVEL_COUNT = 2;

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [showHowTo, setShowHowTo] = useState(false);
  const [sensorsReady, setSensorsReady] = useState<boolean | null>(null);
  const [bestTimes, setBestTimes] = useState<(number | null)[]>([]);
  const heroSize = Math.min((width - 40) / Math.SQRT2, height * 0.34);
  const bestLabel = bestTimes
    .map((time, level) => (time === null ? null : `L${level + 1} ${formatTime(time)}`))
    .filter(Boolean)
    .join("  ·  ");

  useEffect(() => {
    if (!hasSeenHowTo()) setShowHowTo(true);

    if (Platform.OS === "web") {
      setSensorsReady(false);
      return;
    }

    Promise.all([Accelerometer.isAvailableAsync(), Gyroscope.isAvailableAsync()])
      .then(([accelerometer, gyroscope]) => setSensorsReady(accelerometer && gyroscope))
      .catch(() => setSensorsReady(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setBestTimes(Array.from({ length: LEVEL_COUNT }, (_, level) => getBestTime(level)));
    }, []),
  );

  const closeHowTo = () => {
    markHowToSeen();
    setShowHowTo(false);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#FBFCFF", "#E6ECFC"]} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.ambientGlow} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandBlock}>
          <View style={styles.microRow}>
            <View style={styles.microLine} />
            <Text style={styles.microLabel}>MOTION ARCADE / 01</Text>
            <View style={styles.microLine} />
          </View>
          <Text style={styles.brand}>GYRO<Text style={styles.brandAccent}>RUSH</Text></Text>
          <Text style={styles.tagline}>Tilt the world. Find the way.</Text>
        </View>

        <View style={styles.hero}>
          <IsoHero size={heroSize} />
        </View>

        <View style={styles.statusBlock}>
          <View style={[styles.statusChip, sensorsReady === false && styles.statusChipOff]}>
            <SymbolView name="gyroscope" size={16} tintColor="#7FE3FF" fallback={null} />
            <Text style={styles.statusText}>
              {sensorsReady === null ? "CHECKING" : sensorsReady ? "GYRO READY" : "NO MOTION SENSOR"}
            </Text>
            <View style={[styles.statusDot, sensorsReady === false && styles.statusDotOff]} />
          </View>
          {bestLabel !== "" && <Text style={styles.bestText}>{`BEST  ${bestLabel}`}</Text>}
        </View>

        <View style={styles.actions}>
          <PrimaryButton height={64} label="START RUN" onPress={() => router.push("/game")}>
            <SymbolView
              name="arrow.right"
              size={24}
              tintColor="#FFFFFF"
              weight="bold"
              fallback={<Text style={styles.playArrow}>→</Text>}
            />
          </PrimaryButton>

          <View style={styles.secondaryActions}>
            <SecondaryButton icon="book" label="HOW TO PLAY" onPress={() => setShowHowTo(true)} />
            <SecondaryButton
              icon="dot.radiowaves.left.and.right"
              label="SENSOR LAB"
              onPress={() => router.push("/sensor-lab")}
            />
          </View>
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={closeHowTo}
        transparent
        visible={showHowTo}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeHowTo}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>How to play</Text>
            <Instruction color="#12B5EA" label="TILT" text="Steer the ball" icon={<View style={styles.phoneIcon} />} />
            <Instruction color="#8B5CF6" label="COLLECT" text="Unlock the exit" icon={<View style={styles.crystalIcon} />} />
            <Instruction
              color="#FF9F1C"
              label="DASH"
              text="Twist quickly for a boost"
              icon={(
                <View style={styles.streakIcon}>
                  <View style={[styles.streakLine, styles.streakLong]} />
                  <View style={[styles.streakLine, styles.streakMedium]} />
                  <View style={[styles.streakLine, styles.streakShort]} />
                </View>
              )}
            />
            <PrimaryButton label="GOT IT" onPress={closeHowTo} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SecondaryButton({ icon, label, onPress }: { icon: SFSymbol; label: string; onPress: () => void }) {
  return (
    <GlassView glassEffectStyle="regular" style={styles.secondaryGlass}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      >
        <SymbolView name={icon} size={20} tintColor="#4F5DFF" fallback={null} />
        <Text style={styles.secondaryTitle}>{label}</Text>
      </Pressable>
    </GlassView>
  );
}

function Instruction({
  color,
  icon,
  label,
  text,
}: {
  color: string;
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <View style={styles.instruction}>
      <View style={styles.instructionIcon}>{icon}</View>
      <View>
        <Text style={[styles.instructionLabel, { color }]}>{label}</Text>
        <Text style={styles.instructionText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FC" },
  ambientGlow: {
    position: "absolute", alignSelf: "center", top: "24%", width: 360, height: 360,
    borderRadius: 180, backgroundColor: "#D5DEFC", opacity: 0.7,
  },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  brandBlock: { alignItems: "center", paddingTop: 12 },
  microRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  microLine: { width: 32, height: 1, backgroundColor: "#8C99B3" },
  microLabel: { color: "#5F6C85", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  brand: {
    color: "#172033", fontSize: 46, lineHeight: 54, fontWeight: "900", fontStyle: "italic",
    letterSpacing: 0.5, marginTop: 4,
  },
  brandAccent: { color: "#4150F5" },
  tagline: { color: "#5F6C85", fontSize: 17, fontWeight: "600", marginTop: 2 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusBlock: { alignItems: "center", gap: 8, marginBottom: 16 },
  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, height: 34,
    borderRadius: 17, backgroundColor: "#35509F",
  },
  statusChipOff: { backgroundColor: "#5F6C85" },
  statusText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#2EE59D" },
  statusDotOff: { backgroundColor: "#E5484D" },
  bestText: {
    color: "#5F6C85", fontSize: 11, fontWeight: "700", letterSpacing: 1, fontVariant: ["tabular-nums"],
  },
  actions: { gap: 14, paddingBottom: 12 },
  playArrow: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginTop: -2 },
  secondaryActions: { flexDirection: "row", gap: 12 },
  secondaryGlass: {
    flex: 1, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  secondaryButton: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryTitle: { color: "#172033", fontSize: 13, fontWeight: "800", letterSpacing: 0.8 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  modalBackdrop: {
    flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(23, 32, 51, 0.45)", padding: 16,
  },
  modalCard: {
    borderRadius: 18, borderWidth: 1, borderColor: "#DDE4F0", backgroundColor: "#FFFFFF", padding: 20,
  },
  modalTitle: { color: "#172033", fontSize: 24, fontWeight: "800", marginBottom: 16 },
  instruction: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  instructionIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  phoneIcon: {
    width: 18, height: 32, borderRadius: 4, borderWidth: 3, borderColor: "#12B5EA",
    transform: [{ rotate: "24deg" }],
  },
  crystalIcon: {
    width: 22, height: 22, borderRadius: 2, backgroundColor: "#8B5CF6",
    transform: [{ rotate: "45deg" }],
  },
  streakIcon: { gap: 5, alignItems: "flex-end" },
  streakLine: { height: 4, borderRadius: 2, backgroundColor: "#FF9F1C" },
  streakLong: { width: 32 },
  streakMedium: { width: 22 },
  streakShort: { width: 14 },
  instructionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  instructionText: { color: "#172033", fontSize: 15, fontWeight: "500", lineHeight: 21, marginTop: 1 },
});
