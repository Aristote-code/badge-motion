// BookwormBadge haptics, generated from the cue sheet in bookworm-badge.html
// Play together with bookworm-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object BookwormBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 480, 30, 170, 30, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 40, 30, 370, 20, 120, 20, 120, 20, 120, 20, 520, 30, 490, 10, 250, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 204, 0, 77, 0, 20, 22, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 40, 42, 43, 44, 45, 46, 47, 49, 50, 0, 115, 0, 71, 0, 84, 0, 97, 0, 110, 0, 89, 0, 179, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 490, 40, 160, 20, 20, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 50, 30, 370, 20, 120, 20, 120, 20, 120, 30, 510, 20, 500, 40, 220, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
