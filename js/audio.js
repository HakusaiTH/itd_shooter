/**
 * Audio System for ITD Space Shooter
 * Plays audio/shooting.wav for laser fire and uses Web Audio API for sound effects.
 */
class AudioManager {
    constructor() {
        this.muted = false;
        this.ctx = null;
        this.shootingAudio = new Audio('audio/shooting.wav');
        this.shootingAudio.volume = 0.4;
        
        // Initialize Web Audio API on first user interaction
        this.initWebAudio();
    }

    initWebAudio() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    resumeAudioContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        this.shootingAudio.muted = this.muted;
        return this.muted;
    }

    playShoot() {
        if (this.muted) return;
        try {
            // Clone audio element to allow rapid overlapping shot SFX
            const sound = this.shootingAudio.cloneNode();
            sound.volume = 0.35;
            sound.play().catch(() => {});
        } catch (e) {}
    }

    // Web Audio Synthesizers for extra game SFX
    playExplosion(isBoss = false) {
        if (this.muted || !this.ctx) return;
        this.resumeAudioContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // White noise buffer for explosion rumble
        const bufferSize = this.ctx.sampleRate * (isBoss ? 1.5 : 0.4);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isBoss ? 400 : 800, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + (isBoss ? 1.5 : 0.4));

        gain.gain.setValueAtTime(isBoss ? 0.8 : 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (isBoss ? 1.5 : 0.4));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    playHit() {
        if (this.muted || !this.ctx) return;
        this.resumeAudioContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playPowerup() {
        if (this.muted || !this.ctx) return;
        this.resumeAudioContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playBossAlert() {
        if (this.muted || !this.ctx) return;
        this.resumeAudioContext();

        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now + i * 0.3);
            osc.frequency.setValueAtTime(440, now + i * 0.3 + 0.15);

            gain.gain.setValueAtTime(0.4, now + i * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.3);
            osc.stop(now + i * 0.3 + 0.3);
        }
    }
}

const audioManager = new AudioManager();
