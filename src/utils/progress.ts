import Storage from "expo-sqlite/kv-store";

const BEST_TIME_KEY = "bestTime";
const HOW_TO_SEEN_KEY = "howToSeen";

function read(key: string) {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    Storage.setItemSync(key, value);
  } catch {
    // Progress is optional; the game keeps working when storage is unavailable.
  }
}

export function getBestTime(level: number) {
  const value = Number(read(`${BEST_TIME_KEY}${level}`));
  return value > 0 ? value : null;
}

export function saveBestTime(level: number, time: number) {
  write(`${BEST_TIME_KEY}${level}`, String(time));
}

export function hasSeenHowTo() {
  return read(HOW_TO_SEEN_KEY) === "true";
}

export function markHowToSeen() {
  write(HOW_TO_SEEN_KEY, "true");
}

export function formatTime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((milliseconds % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}
