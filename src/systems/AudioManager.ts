/**
 * AudioManager Class
 * 音频管理器类
 * 
 * Manages sound effects and background music.
 * 管理音效和背景音乐。
 */
import { SoundEffect } from '../types/enums';

/**
 * Audio Configuration Interface
 * 音频配置接口
 */
export interface AudioConfig {
  /** Sound effects volume (0-1) */
  soundVolume: number;
  /** Music volume (0-1) */
  musicVolume: number;
  /** Whether audio is muted */
  muted: boolean;
}

/**
 * AudioManager Class
 * 音频管理器
 */
export class AudioManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private bgm: HTMLAudioElement | null = null;
  private soundVolume: number = 0.7;
  private musicVolume: number = 0.5;
  private muted: boolean = false;
  private audioContext: AudioContext | null = null;
  private initialized: boolean = false;

  constructor() {
    // Try to create AudioContext for better audio handling
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not available:', error);
    }
  }

  /**
   * Initialize audio system (must be called after user interaction)
   * 初始化音频系统（必须在用户交互后调用）
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Resume AudioContext if suspended (with timeout)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        // Add timeout to prevent hanging
        const resumePromise = this.audioContext.resume();
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
        await Promise.race([resumePromise, timeoutPromise]);
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
      }
    }

    this.initialized = true;
    console.log('AudioManager initialized');
  }

  /**
   * Load a sound effect
   * 加载音效
   * @param effect Sound effect type
   * @param path Path to audio file
   * @returns Promise that resolves when loaded
   */
  loadSound(effect: SoundEffect, path: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(effect, audio);
        resolve();
      }, { once: true });

      audio.addEventListener('error', (error) => {
        console.warn(`Failed to load sound effect ${effect}:`, error);
        // Resolve anyway to not block game loading
        resolve();
      }, { once: true });

      audio.src = path;
      audio.load();
    });
  }

  /**
   * Load background music
   * 加载背景音乐
   * @param path Path to audio file
   * @returns Promise that resolves when loaded
   */
  loadMusic(path: string): Promise<void> {
    return new Promise((resolve) => {
      this.bgm = new Audio();
      
      this.bgm.addEventListener('canplaythrough', () => {
        if (this.bgm) {
          this.bgm.loop = true;
          this.bgm.volume = this.muted ? 0 : this.musicVolume;
        }
        resolve();
      }, { once: true });

      this.bgm.addEventListener('error', (error) => {
        console.warn('Failed to load background music:', error);
        this.bgm = null;
        // Resolve anyway to not block game loading
        resolve();
      }, { once: true });

      this.bgm.src = path;
      this.bgm.load();
    });
  }

  /**
   * Play a sound effect
   * 播放音效
   * @param effect Sound effect to play
   */
  playSound(effect: SoundEffect): void {
    if (this.muted) return;

    const audio = this.sounds.get(effect);
    if (!audio) {
      // Sound not loaded, fail silently
      return;
    }

    try {
      // Clone the audio element for overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.soundVolume;
      
      // Play and clean up after
      clone.play().catch(error => {
        // Autoplay may be blocked, fail silently
        console.debug('Sound playback blocked:', error);
      });

      // Remove clone after playback
      clone.addEventListener('ended', () => {
        clone.remove();
      }, { once: true });
    } catch (error) {
      console.warn(`Failed to play sound effect ${effect}:`, error);
    }
  }

  /**
   * Play background music
   * 播放背景音乐
   */
  playMusic(): void {
    if (!this.bgm) return;

    try {
      this.bgm.volume = this.muted ? 0 : this.musicVolume;
      this.bgm.play().catch(error => {
        // Autoplay may be blocked
        console.debug('Music playback blocked:', error);
      });
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  /**
   * Stop background music
   * 停止背景音乐
   */
  stopMusic(): void {
    if (!this.bgm) return;

    try {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    } catch (error) {
      console.warn('Failed to stop background music:', error);
    }
  }

  /**
   * Pause background music
   * 暂停背景音乐
   */
  pauseMusic(): void {
    if (!this.bgm) return;

    try {
      this.bgm.pause();
    } catch (error) {
      console.warn('Failed to pause background music:', error);
    }
  }

  /**
   * Resume background music
   * 恢复背景音乐
   */
  resumeMusic(): void {
    if (!this.bgm || this.muted) return;

    try {
      this.bgm.play().catch(error => {
        console.debug('Music resume blocked:', error);
      });
    } catch (error) {
      console.warn('Failed to resume background music:', error);
    }
  }

  /**
   * Set sound effects volume
   * 设置音效音量
   * @param volume Volume level (0-1)
   */
  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get sound effects volume
   * 获取音效音量
   */
  getSoundVolume(): number {
    return this.soundVolume;
  }

  /**
   * Set music volume
   * 设置音乐音量
   * @param volume Volume level (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.bgm && !this.muted) {
      this.bgm.volume = this.musicVolume;
    }
  }

  /**
   * Get music volume
   * 获取音乐音量
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Toggle mute state
   * 切换静音状态
   * @returns New mute state
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    
    if (this.bgm) {
      this.bgm.volume = this.muted ? 0 : this.musicVolume;
    }
    
    return this.muted;
  }

  /**
   * Set mute state
   * 设置静音状态
   * @param muted Whether to mute
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    
    if (this.bgm) {
      this.bgm.volume = this.muted ? 0 : this.musicVolume;
    }
  }

  /**
   * Check if audio is muted
   * 检查是否静音
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Get audio configuration
   * 获取音频配置
   */
  getConfig(): AudioConfig {
    return {
      soundVolume: this.soundVolume,
      musicVolume: this.musicVolume,
      muted: this.muted
    };
  }

  /**
   * Set audio configuration
   * 设置音频配置
   * @param config Audio configuration
   */
  setConfig(config: Partial<AudioConfig>): void {
    if (config.soundVolume !== undefined) {
      this.setSoundVolume(config.soundVolume);
    }
    if (config.musicVolume !== undefined) {
      this.setMusicVolume(config.musicVolume);
    }
    if (config.muted !== undefined) {
      this.setMuted(config.muted);
    }
  }

  /**
   * Check if a sound effect is loaded
   * 检查音效是否已加载
   * @param effect Sound effect to check
   */
  isSoundLoaded(effect: SoundEffect): boolean {
    return this.sounds.has(effect);
  }

  /**
   * Check if background music is loaded
   * 检查背景音乐是否已加载
   */
  isMusicLoaded(): boolean {
    return this.bgm !== null;
  }

  /**
   * Preload all game sounds
   * 预加载所有游戏音效
   * @param basePath Base path for audio files
   */
  async preloadSounds(basePath: string = 'assets/audio/'): Promise<void> {
    const soundFiles: Record<SoundEffect, string> = {
      [SoundEffect.PLAYER_SHOOT]: 'player_shoot.mp3',
      [SoundEffect.ENEMY_SHOOT]: 'enemy_shoot.mp3',
      [SoundEffect.EXPLOSION]: 'explosion.mp3',
      [SoundEffect.POWER_UP]: 'power_up.mp3',
      [SoundEffect.HIT]: 'hit.mp3'
    };

    const loadPromises: Promise<void>[] = [];

    for (const [effect, filename] of Object.entries(soundFiles)) {
      loadPromises.push(
        this.loadSound(effect as SoundEffect, basePath + filename)
      );
    }

    await Promise.all(loadPromises);
  }

  /**
   * Clean up audio resources
   * 清理音频资源
   */
  dispose(): void {
    // Stop and clear background music
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.src = '';
      this.bgm = null;
    }

    // Clear all sound effects
    for (const audio of this.sounds.values()) {
      audio.src = '';
    }
    this.sounds.clear();

    // Close AudioContext
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.initialized = false;
  }
}
