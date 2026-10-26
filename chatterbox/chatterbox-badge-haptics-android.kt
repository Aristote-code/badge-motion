// ChatterboxBadge haptics, generated from the cue sheet in chatterbox-badge.html
// Play together with chatterbox-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object ChatterboxBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 200, 30, 470, 20, 360, 10, 100, 10, 100, 10, 230, 10, 100, 10, 100, 10, 470, 20, 360, 20, 180, 20, 380, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 153, 0, 128, 0, 46, 0, 46, 0, 46, 0, 46, 0, 46, 0, 46, 0, 140, 0, 166, 0, 77, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 210, 30, 470, 30, 350, 20, 90, 20, 90, 20, 220, 20, 90, 20, 90, 20, 460, 30, 350, 30, 170, 20, 380, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
