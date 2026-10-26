// GoldenMicBadge haptics, generated from the cue sheet in golden-mic-badge.html
// Play together with golden-mic-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object GoldenMicBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 190, 30, 160, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 40, 20, 380, 20, 280, 20, 360, 30, 150, 30, 190, 20, 240, 20, 240, 20, 260, 20, 30, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 110, 10, 210, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 153, 0, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 35, 37, 38, 40, 41, 43, 44, 46, 47, 49, 50, 52, 53, 55, 56, 58, 59, 61, 62, 0, 102, 0, 191, 0, 77, 0, 102, 0, 102, 0, 77, 0, 77, 0, 77, 0, 115, 0, 46, 45, 43, 42, 41, 40, 39, 37, 36, 35, 34, 32, 31, 30, 29, 28, 26, 25, 24, 23, 21, 20, 19, 18, 17, 15, 14, 13, 12, 10, 0, 77, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 200, 30, 180, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 70, 30, 370, 40, 260, 20, 360, 30, 150, 30, 190, 20, 240, 20, 240, 20, 260, 30, 50, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 130, 20, 200, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
