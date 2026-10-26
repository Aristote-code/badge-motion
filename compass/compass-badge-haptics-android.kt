// CompassBadge haptics, generated from the cue sheet in compass-badge.html
// Play together with compass-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object CompassBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 140, 30, 90, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 30, 10, 310, 20, 140, 20, 160, 10, 220, 10, 120, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 115, 0, 89, 88, 87, 86, 85, 84, 82, 81, 80, 79, 78, 77, 76, 74, 73, 72, 71, 70, 69, 68, 67, 65, 64, 63, 62, 61, 60, 59, 57, 56, 55, 54, 53, 52, 51, 49, 48, 47, 46, 45, 44, 43, 42, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 0, 153, 0, 102, 0, 128, 0, 153, 0, 179, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 150, 30, 110, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 30, 290, 30, 130, 30, 150, 30, 200, 40, 90, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
