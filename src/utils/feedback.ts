import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Vibration } from "react-native";

const HARD_HIT_SPEED = 180;
const HEAVY_HIT_SPEED = 230;

const SOUNDS = {
  tick: require("../../assets/sounds/tick.wav"),
  go: require("../../assets/sounds/go.wav"),
  crystal1: require("../../assets/sounds/crystal-1.wav"),
  crystal2: require("../../assets/sounds/crystal-2.wav"),
  crystal3: require("../../assets/sounds/crystal-3.wav"),
  crystal4: require("../../assets/sounds/crystal-4.wav"),
  dash: require("../../assets/sounds/dash.wav"),
  wallSoft: require("../../assets/sounds/wall-soft.wav"),
  wallHard: require("../../assets/sounds/wall-hard.wav"),
  unlock: require("../../assets/sounds/unlock.wav"),
  win: require("../../assets/sounds/win.wav"),
};

type SoundName = keyof typeof SOUNDS;

const CRYSTAL_SOUNDS: SoundName[] = ["crystal1", "crystal2", "crystal3", "crystal4"];

// Kept for the whole app session so replaying a sound never waits for a new player.
let players: Record<SoundName, AudioPlayer> | null = null;

export function loadSounds() {
  if (players) return;

  // Effects respect the silent switch and never interrupt the player's music.
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => undefined);
  players = Object.fromEntries(
    Object.entries(SOUNDS).map(([name, source]) => [name, createAudioPlayer(source)]),
  ) as Record<SoundName, AudioPlayer>;
}

function playSound(name: SoundName) {
  const player = players?.[name];
  if (!player) return;

  player.seekTo(0);
  player.play();
}

// The Taptic Engine stays silent with System Haptics off or in Low Power Mode, so key events
// also use Vibration. iOS ignores the duration and plays its fixed system vibration.
function buzz(duration: number) {
  Vibration.vibrate(duration);
}

function impact(style: Haptics.ImpactFeedbackStyle) {
  Haptics.impactAsync(style).catch(() => undefined);
}

export function calibratedFeedback() {
  buzz(25);
  impact(Haptics.ImpactFeedbackStyle.Light);
}

export function countdownFeedback() {
  playSound("tick");
  Haptics.selectionAsync().catch(() => undefined);
}

export function goFeedback() {
  playSound("go");
  impact(Haptics.ImpactFeedbackStyle.Medium);
}

export function dashFeedback() {
  playSound("dash");
  buzz(45);
  impact(Haptics.ImpactFeedbackStyle.Heavy);
}

export function wallHitFeedback(speed: number) {
  playSound(speed >= HARD_HIT_SPEED ? "wallHard" : "wallSoft");
  if (speed >= HARD_HIT_SPEED) buzz(18);
  impact(
    speed >= HEAVY_HIT_SPEED
      ? Haptics.ImpactFeedbackStyle.Heavy
      : speed >= HARD_HIT_SPEED
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
  );
}

export function crystalFeedback(collectedCount: number) {
  playSound(CRYSTAL_SOUNDS[Math.min(collectedCount, CRYSTAL_SOUNDS.length) - 1]);
  buzz(35);
  impact(Haptics.ImpactFeedbackStyle.Rigid);
}

export function goalUnlockedFeedback() {
  playSound("unlock");
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
}

export function winFeedback() {
  playSound("win");
  buzz(120);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
