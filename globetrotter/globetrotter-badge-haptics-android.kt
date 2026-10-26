// GlobetrotterBadge haptics, generated from the cue sheet in globetrotter-badge.html
// Play together with globetrotter-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object GlobetrotterBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 120, 30, 20, 20, 20, 20, 20, 20, 20, 20, 10, 20, 20, 20, 20, 20, 20, 20, 20, 20, 10, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 10, 20, 20, 20, 20, 20, 20, 400, 20, 110, 10, 60, 10, 60, 10, 60, 10, 60, 10, 60, 10, 60, 10, 340, 20, 100, 30, 70, 80, 80, 80, 80, 90, 80, 80, 80, 80, 90, 80, 80, 80, 80, 80, 90, 80, 80, 80, 80, 40, 30, 20, 100, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 115, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 0, 140, 0, 46, 0, 46, 0, 46, 0, 46, 0, 46, 0, 46, 0, 46, 0, 166, 0, 89, 0, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 0, 128, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 130, 30, 10, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 430, 30, 100, 20, 50, 20, 50, 20, 50, 20, 50, 20, 50, 20, 50, 20, 330, 30, 90, 20, 80, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 50, 30, 90, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
