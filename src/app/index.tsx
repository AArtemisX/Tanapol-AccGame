import { Accelerometer, Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SensorValues = {
  x: number;
  y: number;
  z: number;
};

const initialValues: SensorValues = { x: 0, y: 0, z: 0 };

function SensorCard({
  title,
  unit,
  values,
  available,
}: {
  title: string;
  unit: string;
  values: SensorValues;
  available: boolean | null;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.statusDot, available === false && styles.statusDotOff]} />
      </View>
      <Text style={styles.unit}>{unit}</Text>
      <View style={styles.values}>
        {(["x", "y", "z"] as const).map((axis) => (
          <View key={axis} style={styles.valueRow}>
            <Text style={styles.axis}>{axis.toUpperCase()}</Text>
            <Text style={styles.value}>{values[axis].toFixed(4)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sensorStatus}>
        {available === null ? "Checking sensor..." : available ? "Live data" : "Not available on this device"}
      </Text>
    </View>
  );
}

export default function Index() {
  const [accelerometer, setAccelerometer] = useState(initialValues);
  const [gyroscope, setGyroscope] = useState(initialValues);
  const [accelerometerAvailable, setAccelerometerAvailable] = useState<boolean | null>(null);
  const [gyroscopeAvailable, setGyroscopeAvailable] = useState<boolean | null>(null);
  const accelerometerSubscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const gyroscopeSubscription = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);

  useEffect(() => {
    let mounted = true;

    const startSensors = async () => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>MOTION MONITOR</Text>
        <Text style={styles.title}>Phone sensors</Text>
        <Text style={styles.subtitle}>Live three-axis readings from your device.</Text>
        <SensorCard
          title="Accelerometer"
          unit="Acceleration · g"
          values={accelerometer}
          available={accelerometerAvailable}
        />
        <SensorCard
          title="Gyroscope"
          unit="Rotation · rad/s"
          values={gyroscope}
          available={gyroscopeAvailable}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#101417",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
  },
  eyebrow: {
    color: "#7ed6b2",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 12,
  },
  title: {
    color: "#f2f6f4",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: -8,
  },
  subtitle: {
    color: "#91a29e",
    fontSize: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#192124",
    borderColor: "#2b393b",
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#f2f6f4",
    fontSize: 22,
    fontWeight: "700",
  },
  statusDot: {
    backgroundColor: "#7ed6b2",
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  statusDotOff: {
    backgroundColor: "#d6816c",
  },
  unit: {
    color: "#91a29e",
    fontSize: 13,
    marginTop: 4,
  },
  values: {
    gap: 10,
    marginTop: 20,
  },
  valueRow: {
    alignItems: "center",
    backgroundColor: "#11191b",
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  axis: {
    color: "#7ed6b2",
    fontSize: 13,
    fontWeight: "800",
  },
  value: {
    color: "#f2f6f4",
    fontSize: 20,
    fontVariant: ["tabular-nums"],
  },
  sensorStatus: {
    color: "#91a29e",
    fontSize: 12,
    marginTop: 14,
  },
});
