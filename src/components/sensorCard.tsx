import { StyleSheet, Text, View } from "react-native";
import SensorValues from "../utils/datatype";

export default function SensorCard({
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
            <Text style={styles.value}>{(values[axis]*100).toFixed()}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sensorStatus}>
        {available === null ? "Checking sensor..." : available ? "Live data" : "Not available on this device"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
