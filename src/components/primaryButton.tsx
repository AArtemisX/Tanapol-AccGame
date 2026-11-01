import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function PrimaryButton({
  label,
  onPress,
  height = 56,
  children,
}: {
  label: string;
  onPress: () => void;
  height?: number;
  children?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, { height, borderRadius: height / 2 }, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#1D7BFF", "#6A35F0"]}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={[styles.fill, { borderRadius: height / 2 }, children ? styles.withIcon : styles.centered]}
      >
        <Text style={styles.label}>{label}</Text>
        {children}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: "100%", borderBottomWidth: 3, borderBottomColor: "#3540C0" },
  fill: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 24 },
  centered: { justifyContent: "center" },
  withIcon: { justifyContent: "space-between" },
  label: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1.5 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
