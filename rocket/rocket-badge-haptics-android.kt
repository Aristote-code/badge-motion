// RocketBadge haptics, generated from the cue sheet in rocket-badge.html
// Play together with rocket-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object RocketBadgeHaptics {
    private val timings = longArrayOf(20, 30, 250, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 60, 10, 60, 10, 10, 10, 50, 10, 80, 10, 100, 10, 100)
    private val amplitudes = intArrayOf(0, 140, 0, 36, 38, 41, 43, 46, 49, 51, 54, 56, 59, 62, 64, 67, 69, 72, 75, 77, 80, 82, 85, 88, 90, 93, 95, 98, 101, 103, 106, 108, 111, 114, 116, 119, 121, 124, 127, 129, 132, 134, 137, 140, 142, 145, 147, 150, 153, 155, 158, 160, 163, 166, 168, 171, 173, 176, 255, 0, 97, 0, 84, 0, 128, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 270, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 30, 10, 30, 10, 60, 30, 20, 50, 50, 30, 20, 70, 20, 90, 20, 90), -1))
        }
    }
}
