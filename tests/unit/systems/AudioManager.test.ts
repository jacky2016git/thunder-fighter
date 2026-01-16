/**
 * AudioManager Unit Tests
 * 音频管理器单元测试
 */
import { AudioManager } from '../../../src/systems/AudioManager';
import { SoundEffect } from '../../../src/types/enums';

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
  });

  afterEach(() => {
    audioManager.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default volume settings', () => {
      const config = audioManager.getConfig();
      
      expect(config.soundVolume).toBe(0.7);
      expect(config.musicVolume).toBe(0.5);
      expect(config.muted).toBe(false);
    });

    it('should not be muted by default', () => {
      expect(audioManager.isMuted()).toBe(false);
    });
  });

  describe('Volume Control', () => {
    it('should set sound volume', () => {
      audioManager.setSoundVolume(0.5);
      expect(audioManager.getSoundVolume()).toBe(0.5);
    });

    it('should clamp sound volume to 0-1 range', () => {
      audioManager.setSoundVolume(-0.5);
      expect(audioManager.getSoundVolume()).toBe(0);
      
      audioManager.setSoundVolume(1.5);
      expect(audioManager.getSoundVolume()).toBe(1);
    });

    it('should set music volume', () => {
      audioManager.setMusicVolume(0.8);
      expect(audioManager.getMusicVolume()).toBe(0.8);
    });

    it('should clamp music volume to 0-1 range', () => {
      audioManager.setMusicVolume(-0.5);
      expect(audioManager.getMusicVolume()).toBe(0);
      
      audioManager.setMusicVolume(1.5);
      expect(audioManager.getMusicVolume()).toBe(1);
    });
  });

  describe('Mute Control', () => {
    it('should toggle mute state', () => {
      expect(audioManager.isMuted()).toBe(false);
      
      audioManager.toggleMute();
      expect(audioManager.isMuted()).toBe(true);
      
      audioManager.toggleMute();
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should set mute state directly', () => {
      audioManager.setMuted(true);
      expect(audioManager.isMuted()).toBe(true);
      
      audioManager.setMuted(false);
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should return new mute state from toggleMute', () => {
      const newState = audioManager.toggleMute();
      expect(newState).toBe(true);
      
      const nextState = audioManager.toggleMute();
      expect(nextState).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should get complete config', () => {
      const config = audioManager.getConfig();
      
      expect(config).toHaveProperty('soundVolume');
      expect(config).toHaveProperty('musicVolume');
      expect(config).toHaveProperty('muted');
    });

    it('should set partial config', () => {
      audioManager.setConfig({
        soundVolume: 0.3,
        muted: true
      });
      
      const config = audioManager.getConfig();
      expect(config.soundVolume).toBe(0.3);
      expect(config.muted).toBe(true);
      expect(config.musicVolume).toBe(0.5); // Unchanged
    });

    it('should set complete config', () => {
      audioManager.setConfig({
        soundVolume: 0.4,
        musicVolume: 0.6,
        muted: true
      });
      
      const config = audioManager.getConfig();
      expect(config.soundVolume).toBe(0.4);
      expect(config.musicVolume).toBe(0.6);
      expect(config.muted).toBe(true);
    });
  });

  describe('Sound Loading', () => {
    it('should report sound not loaded initially', () => {
      expect(audioManager.isSoundLoaded(SoundEffect.EXPLOSION)).toBe(false);
    });

    it('should handle sound loading (resolves even on error)', async () => {
      // In test environment, audio loading will fail but should resolve
      await expect(
        audioManager.loadSound(SoundEffect.EXPLOSION, 'nonexistent.mp3')
      ).resolves.not.toThrow();
    });
  });

  describe('Music Loading', () => {
    it('should report music not loaded initially', () => {
      expect(audioManager.isMusicLoaded()).toBe(false);
    });

    it('should handle music loading (resolves even on error)', async () => {
      // In test environment, audio loading will fail but should resolve
      await expect(
        audioManager.loadMusic('nonexistent.mp3')
      ).resolves.not.toThrow();
    });
  });

  describe('Sound Playback', () => {
    it('should not throw when playing unloaded sound', () => {
      expect(() => audioManager.playSound(SoundEffect.EXPLOSION)).not.toThrow();
    });

    it('should not play sound when muted', () => {
      audioManager.setMuted(true);
      expect(() => audioManager.playSound(SoundEffect.EXPLOSION)).not.toThrow();
    });
  });

  describe('Music Playback', () => {
    it('should not throw when playing music without loading', () => {
      expect(() => audioManager.playMusic()).not.toThrow();
    });

    it('should not throw when stopping music', () => {
      expect(() => audioManager.stopMusic()).not.toThrow();
    });

    it('should not throw when pausing music', () => {
      expect(() => audioManager.pauseMusic()).not.toThrow();
    });

    it('should not throw when resuming music', () => {
      expect(() => audioManager.resumeMusic()).not.toThrow();
    });
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      await expect(audioManager.initialize()).resolves.not.toThrow();
    });

    it('should handle multiple initialization calls', async () => {
      await audioManager.initialize();
      await expect(audioManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('Preload Sounds', () => {
    it('should preload all sounds without throwing', async () => {
      // Will fail to load in test environment but should resolve
      await expect(audioManager.preloadSounds()).resolves.not.toThrow();
    });

    it('should preload sounds with custom base path', async () => {
      await expect(
        audioManager.preloadSounds('custom/path/')
      ).resolves.not.toThrow();
    });
  });

  describe('Dispose', () => {
    it('should dispose without errors', () => {
      expect(() => audioManager.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      audioManager.dispose();
      expect(() => audioManager.dispose()).not.toThrow();
    });
  });
});
