import { Accelerometer, Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SensorCard from "../components/sensorCard";
import SensorValues from "../utils/datatype";

const initialValues: SensorValues = { x: 0, y: 0, z: 0 };


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
      // Check if the sensors (Accelerometer and Gyroscope) are available on the device
      const [accelerometerIsAvailable, gyroscopeIsAvailable] = await Promise.all([
        Accelerometer.isAvailableAsync(),
        Gyroscope.isAvailableAsync(),
      ]);

      if (!mounted) return;

      setAccelerometerAvailable(accelerometerIsAvailable);
      setGyroscopeAvailable(gyroscopeIsAvailable);
      Accelerometer.setUpdateInterval(500); // update values every 500ms
      Gyroscope.setUpdateInterval(500);

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
  }
});
