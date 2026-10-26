// MemoryKeeperBadge haptics, generated from the cue sheet in memory-keeper-badge.html
// Play together with memory-keeper-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object MemoryKeeperBadgeHaptics {
    private val timings = longArrayOf(20, 30, 610, 30, 70, 30, 170, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 140, 30, 170, 20, 240, 20, 420, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 30, 70, 10, 300, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 140, 0, 115, 0, 31, 33, 35, 37, 40, 42, 44, 47, 49, 51, 54, 56, 58, 60, 63, 65, 67, 70, 72, 74, 0, 115, 0, 77, 0, 77, 0, 77, 78, 80, 81, 83, 84, 86, 88, 89, 91, 92, 94, 96, 97, 99, 100, 102, 104, 105, 107, 108, 110, 112, 113, 115, 116, 118, 120, 121, 123, 124, 126, 0, 140, 0, 71, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 610, 30, 70, 30, 170, 10, 30, 10, 30, 10, 30, 10, 30, 10, 170, 30, 170, 20, 240, 20, 420, 10, 30, 20, 20, 10, 30, 20, 20, 20, 20, 20, 20, 20, 20, 20, 40, 30, 70, 20, 290, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
