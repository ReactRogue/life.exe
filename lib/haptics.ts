import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  tap(enabled = true) {
    if (!enabled || !supported) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  success(enabled = true) {
    if (!enabled || !supported) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
  levelUp(enabled = true) {
    if (!enabled || !supported) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))
      .catch(() => undefined);
  },
  warn(enabled = true) {
    if (!enabled || !supported) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  },
};
