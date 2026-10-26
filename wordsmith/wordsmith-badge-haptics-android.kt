// WordsmithBadge haptics, generated from the cue sheet in wordsmith-badge.html
// Play together with wordsmith-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object WordsmithBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 170, 10, 10, 10, 20, 10, 10, 20, 10, 10, 20, 10, 10, 10, 20, 10, 10, 20, 10, 10, 20, 10, 10, 20, 130, 30, 370, 20, 60, 50, 50, 60, 50, 50, 60, 50, 50, 60, 50, 50, 60, 50, 60, 50, 50, 60, 50, 50, 60, 50, 50, 30, 200, 20, 350, 10, 360, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 0, 64, 0, 128, 0, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 0, 128, 0, 179, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 210, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 150, 20, 380, 30, 50, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 230, 30, 340, 40, 330, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
