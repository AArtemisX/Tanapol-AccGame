import { useRouter } from "expo-router";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SensorCard from "../components/sensorCard";
import SensorValues from "../utils/datatype";

const initialValues: SensorValues = { x: 0, y: 0, z: 0 };

export default function SensorLabScreen() {
  const router = useRouter();
  const [accelerometer, setAccelerometer] = useState(initialValues);
  const [gyroscope, setGyroscope] = useState(initialValues);
  const [accelerometerAvailable, setAccelerometerAvailable] = useState<boolean | null>(null);
  const [gyroscopeAvailable, setGyroscopeAvailable] = useState<boolean | null>(null);
  const accelerometerSubscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const gyroscopeSubscription = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);

  useEffect(() => {
    let mounted = true;

    const startSensors = async () => {
      if (Platform.OS === "web") {
        setAccelerometerAvailable(false);
        setGyroscopeAvailable(false);
        return;
      }

      const [accelerometerIsAvailable, gyroscopeIsAvailable] = await Promise.all([
        Accelerometer.isAvailableAsync(),
        Gyroscope.isAvailableAsync(),
      ]);

      if (!mounted) return;

      setAccelerometerAvailable(accelerometerIsAvailable);
      setGyroscopeAvailable(gyroscopeIsAvailable);
      Accelerometer.setUpdateInterval(100);
      Gyroscope.setUpdateInterval(100);

      if (accelerometerIsAvailable) {
        accelerometerSubscription.current = Accelerometer.addListener(setAccelerometer);
      }
      if (gyroscopeIsAvailable) {
        gyroscopeSubscription.current = Gyroscope.addListener(setGyroscope);
      }
    };

    startSensors();

    return () => {
      mounted = false;
      accelerometerSubscription.current?.remove();
      gyroscopeSubscription.current?.remove();
    };
  }, []);

  const live = accelerometerAvailable === true || gyroscopeAvailable === true;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.navigation}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={() => router.dismissTo("/")}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>BACK</Text>
          </Pressable>
          {live && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.eyebrow}>GYRORUSH / TELEMETRY</Text>
        <Text style={styles.title}>SENSOR LAB</Text>
        <Text style={styles.subtitle}>Raw three-axis readings from your device.</Text>
        <SensorCard
          title="ACCELEROMETER"
          unit="Acceleration · g"
          role="Steers the ball"
          accent="#12B5EA"
          values={accelerometer}
          available={accelerometerAvailable}
        />
        <SensorCard
          title="GYROSCOPE"
          unit="Rotation · rad/s"
          role="Triggers the dash"
          accent="#FF9F1C"
          values={gyroscope}
          available={gyroscopeAvailable}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FC" },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  navigation: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  backButton: {
    minHeight: 44, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: "#DDE4F0", backgroundColor: "#FFFFFF",
  },
  backIcon: { color: "#172033", fontSize: 18, fontWeight: "700", marginTop: -2 },
  backText: { color: "#172033", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1, borderColor: "#DDE4F0", backgroundColor: "#FFFFFF",
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#12B76A" },
  liveText: { color: "#12B76A", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  eyebrow: { color: "#5F6C85", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  title: { color: "#172033", fontSize: 32, lineHeight: 38, fontWeight: "900", letterSpacing: 2, marginTop: -8 },
  subtitle: { color: "#5F6C85", fontSize: 15, fontWeight: "500", marginTop: -8, marginBottom: 8 },
});
