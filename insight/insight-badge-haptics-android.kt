// InsightBadge haptics, generated from the cue sheet in insight-badge.html
// Play together with insight-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object InsightBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 360, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 10, 10, 10, 10, 10, 10, 20, 30, 10, 160, 10, 160, 10, 720, 30, 30, 20, 360, 20, 300, 10, 290, 30, 110, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 19, 21, 23, 24, 26, 28, 30, 32, 33, 35, 37, 39, 41, 42, 44, 46, 48, 49, 51, 53, 55, 57, 58, 60, 62, 42, 102, 49, 51, 54, 56, 58, 61, 63, 65, 68, 70, 72, 75, 77, 79, 82, 52, 128, 61, 64, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 97, 153, 107, 111, 114, 118, 121, 0, 179, 0, 77, 0, 166, 0, 77, 0, 140, 0, 77, 0, 77, 0, 89, 0, 115, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 370, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 10, 30, 30, 10, 30, 10, 30, 10, 30, 30, 10, 10, 30, 10, 30, 10, 10, 80, 20, 10, 10, 40, 10, 20, 150, 30, 140, 20, 710, 30, 30, 20, 360, 20, 300, 20, 280, 30, 110, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
