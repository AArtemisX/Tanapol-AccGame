import { StyleSheet, Text, View } from "react-native";
import SensorValues from "../utils/datatype";

export default function SensorCard({
  title,
  unit,
  role,
  accent,
  values,
  available,
}: {
  title: string;
  unit: string;
  role: string;
  accent: string;
  values: SensorValues;
  available: boolean | null;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: accent }]}>{title}</Text>
        <View style={[styles.statusDot, available === false && styles.statusDotOff]} />
      </View>
      <Text style={styles.role}>{role}</Text>
      <Text style={styles.unit}>{unit}</Text>
      <View style={styles.values}>
        {(["x", "y", "z"] as const).map((axis) => (
          <View key={axis} style={styles.valueRow}>
            <Text style={[styles.axis, { color: accent }]}>{axis.toUpperCase()}</Text>
            <Text style={styles.value}>{(values[axis]).toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.sensorStatus, available === false && styles.sensorStatusOff]}>
        {available === null ? "Checking sensor..." : available ? "Live data" : "Not available on this device"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDE4F0",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  statusDot: {
    backgroundColor: "#12B76A",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusDotOff: {
    backgroundColor: "#E5484D",
  },
  role: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 8,
  },
  unit: {
    color: "#5F6C85",
    fontSize: 13,
    marginTop: 2,
  },
  values: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 14,
  },
  valueRow: {
    flex: 1,
    backgroundColor: "#F5F7FC",
    borderColor: "#DDE4F0",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  axis: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  value: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },
  sensorStatus: {
    color: "#5F6C85",
    fontSize: 12,
    marginTop: 12,
  },
  sensorStatusOff: {
    color: "#E5484D",
  },
});
