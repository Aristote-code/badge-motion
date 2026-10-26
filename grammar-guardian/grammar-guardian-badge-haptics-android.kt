// GrammarGuardianBadge haptics, generated from the cue sheet in grammar-guardian-badge.html
// Play together with grammar-guardian-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object GrammarGuardianBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 140, 30, 380, 10, 10, 20, 10, 20, 10, 10, 20, 10, 20, 10, 20, 10, 20, 10, 10, 20, 10, 20, 10, 20, 10, 20, 10, 20, 10, 10, 20, 360, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 220, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 470, 10, 140, 10, 240, 20, 40, 20, 300, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 153, 0, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 0, 82, 78, 73, 69, 65, 61, 57, 53, 49, 45, 41, 37, 33, 29, 0, 82, 78, 73, 69, 65, 61, 57, 53, 49, 45, 41, 37, 33, 29, 0, 204, 0, 230, 0, 77, 0, 77, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 150, 30, 390, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 390, 10, 30, 10, 30, 10, 30, 10, 230, 10, 30, 10, 30, 10, 30, 10, 470, 40, 110, 40, 210, 20, 40, 20, 300, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
