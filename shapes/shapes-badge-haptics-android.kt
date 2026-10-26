// ShapesBadge haptics, generated from the cue sheet in shapes-badge.html
// Play together with shapes-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object ShapesBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 200, 10, 170, 30, 150, 20, 460, 20, 120, 20, 220, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 20, 40, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 20, 40, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 20, 80, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 115, 0, 128, 0, 128, 0, 89, 0, 89, 0, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 0, 115, 0, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 0, 140, 0, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 0, 166, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 210, 30, 150, 30, 150, 30, 450, 20, 120, 20, 240, 10, 30, 10, 30, 10, 30, 10, 30, 10, 50, 30, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 30, 50, 10, 30, 10, 30, 10, 30, 10, 30, 10, 50, 30, 70, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
