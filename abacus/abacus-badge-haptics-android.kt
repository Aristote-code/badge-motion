// AbacusBadge haptics, generated from the cue sheet in abacus-badge.html
// Play together with abacus-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object AbacusBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 120, 30, 410, 20, 90, 20, 90, 20, 90, 20, 90, 20, 90, 20, 90, 20, 90, 20, 90, 20, 160, 20, 160, 20, 200, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 128, 0, 77, 0, 84, 0, 92, 0, 99, 0, 107, 0, 115, 0, 122, 0, 130, 0, 138, 0, 140, 0, 140, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 130, 30, 410, 20, 90, 20, 90, 20, 90, 20, 90, 30, 80, 30, 80, 30, 80, 30, 80, 30, 150, 30, 150, 30, 190, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
