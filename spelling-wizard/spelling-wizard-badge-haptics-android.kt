// SpellingWizardBadge haptics, generated from the cue sheet in spelling-wizard-badge.html
// Play together with spelling-wizard-badge-sound.wav, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object SpellingWizardBadgeHaptics {
    private val timings = longArrayOf(20, 30, 160, 30, 400, 20, 280, 20, 280, 20, 400, 20, 300, 10, 20, 30, 20, 30, 30, 20, 30, 30, 20, 30, 20, 30, 30, 20, 30, 20, 30, 30, 20, 30, 30, 20, 30, 20, 30, 30, 20, 30, 20, 30, 30, 20, 30, 10, 20, 10, 270, 20, 60, 10, 60, 10, 70, 10, 80, 10, 100, 10, 90)
    private val amplitudes = intArrayOf(0, 140, 0, 64, 0, 102, 0, 140, 0, 179, 0, 153, 0, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 0, 191, 0, 255, 0, 97, 0, 84, 0, 71, 0, 59, 0, 46, 0)

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 0, 20, 30, 160, 20, 410, 30, 270, 30, 270, 40, 380, 30, 310, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 10, 30, 40, 240, 50, 30, 20, 50, 20, 60, 20, 70, 20, 90, 20, 80), -1))
        }
    }
}
