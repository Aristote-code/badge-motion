// CodeCrackerBadge haptics, generated from the cue sheet in code-cracker-badge.html
// Play together with code-cracker-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object CodeCrackerBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 120, 30, 290, 620, 40, 20, 40, 300, 20, 300, 40, 20, 240, 10, 90, 20, 60, 30, 330, 20, 100, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 115, 0, 46, 0, 115, 0, 31, 145, 31, 0, 176, 0, 102, 0, 255, 0, 153, 0, 89, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 130, 30, 290, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 50, 30, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 10, 30, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 50, 30, 230, 30, 70, 50, 30, 30, 330, 20, 100, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
