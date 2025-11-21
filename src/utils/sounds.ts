// Sound effects utility
class SoundManager {
    private enabled: boolean = true;
    private audioContext: AudioContext | null = null;

    constructor() {
        // Create audio context on first user interaction
        if (typeof window !== 'undefined') {
            document.addEventListener('click', () => {
                if (!this.audioContext) {
                    this.audioContext = new AudioContext();
                }
            }, { once: true });
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    private getContext(): AudioContext | null {
        if (!this.audioContext && typeof window !== 'undefined') {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    // Play piece placement sound
    playPieceSound(isBlack: boolean) {
        if (!this.enabled) return;

        const ctx = this.getContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Different pitch for black and white
        oscillator.frequency.value = isBlack ? 400 : 600;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }

    // Play win sound
    playWinSound() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'triangle';

            const startTime = ctx.currentTime + index * 0.15;
            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    }

    // Play button click sound
    playClickSound() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    }

    // Play hint sound
    playHintSound() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    // Play timer warning sound
    playTimerWarning() {
        if (!this.enabled) return;

        const ctx = this.getContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 440;
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }
}

export const soundManager = new SoundManager();
