/**
 * Property-Based Tests for Audio System
 * 音频系统的属性测试
 * 
 * Tests properties related to audio volume control.
 */
import * as fc from 'fast-check';
import { AudioManager } from '../../src/systems/AudioManager';

describe('Audio Property Tests', () => {
  // Feature: thunder-fighter-game, Property 19: 音量控制有效性
  /**
   * Property 19: Volume Control Validity
   * 属性19：音量控制有效性
   * 
   * For any volume value v (0-1 range), calling setVolume(v) should result
   * in volume === v (clamped to 0-1).
   * 
   * **Validates: Requirements 10.5**
   */
  describe('Property 19: Volume Control Validity', () => {
    it('setSoundVolume(v) results in volume === v (clamped to 0-1)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1, max: 2, noNaN: true }),
          (volume) => {
            const audioManager = new AudioManager();
            
            audioManager.setSoundVolume(volume);
            
            const actualVolume = audioManager.getSoundVolume();
            const expectedVolume = Math.max(0, Math.min(1, volume));
            
            expect(actualVolume).toBeCloseTo(expectedVolume, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('setMusicVolume(v) results in volume === v (clamped to 0-1)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1, max: 2, noNaN: true }),
          (volume) => {
            const audioManager = new AudioManager();
            
            audioManager.setMusicVolume(volume);
            
            const actualVolume = audioManager.getMusicVolume();
            const expectedVolume = Math.max(0, Math.min(1, volume));
            
            expect(actualVolume).toBeCloseTo(expectedVolume, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('volume within valid range (0-1) is set exactly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          (volume) => {
            const audioManager = new AudioManager();
            
            audioManager.setSoundVolume(volume);
            audioManager.setMusicVolume(volume);
            
            expect(audioManager.getSoundVolume()).toBeCloseTo(volume, 5);
            expect(audioManager.getMusicVolume()).toBeCloseTo(volume, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('volume below 0 is clamped to 0', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-100), max: Math.fround(-0.001), noNaN: true }),
          (volume) => {
            const audioManager = new AudioManager();
            
            audioManager.setSoundVolume(volume);
            audioManager.setMusicVolume(volume);
            
            expect(audioManager.getSoundVolume()).toBe(0);
            expect(audioManager.getMusicVolume()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('volume above 1 is clamped to 1', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1.001), max: Math.fround(100), noNaN: true }),
          (volume) => {
            const audioManager = new AudioManager();
            
            audioManager.setSoundVolume(volume);
            audioManager.setMusicVolume(volume);
            
            expect(audioManager.getSoundVolume()).toBe(1);
            expect(audioManager.getMusicVolume()).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple volume changes result in last value', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.float({ min: 0, max: 1, noNaN: true }),
            { minLength: 2, maxLength: 10 }
          ),
          (volumes) => {
            const audioManager = new AudioManager();
            
            for (const volume of volumes) {
              audioManager.setSoundVolume(volume);
              audioManager.setMusicVolume(volume);
            }
            
            const lastVolume = volumes[volumes.length - 1];
            expect(audioManager.getSoundVolume()).toBeCloseTo(lastVolume, 5);
            expect(audioManager.getMusicVolume()).toBeCloseTo(lastVolume, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mute state is independent of volume setting', () => {
      fc.assert(
        fc.property(
          fc.record({
            volume: fc.float({ min: 0, max: 1, noNaN: true }),
            muted: fc.boolean()
          }),
          ({ volume, muted }) => {
            const audioManager = new AudioManager();
            
            audioManager.setSoundVolume(volume);
            audioManager.setMusicVolume(volume);
            audioManager.setMuted(muted);
            
            // Volume should be preserved regardless of mute state
            expect(audioManager.getSoundVolume()).toBeCloseTo(volume, 5);
            expect(audioManager.getMusicVolume()).toBeCloseTo(volume, 5);
            expect(audioManager.isMuted()).toBe(muted);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('config setting applies all audio settings correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            soundVolume: fc.float({ min: 0, max: 1, noNaN: true }),
            musicVolume: fc.float({ min: 0, max: 1, noNaN: true }),
            muted: fc.boolean()
          }),
          (config) => {
            const audioManager = new AudioManager();
            
            audioManager.setConfig(config);
            
            const actualConfig = audioManager.getConfig();
            
            expect(actualConfig.soundVolume).toBeCloseTo(config.soundVolume, 5);
            expect(actualConfig.musicVolume).toBeCloseTo(config.musicVolume, 5);
            expect(actualConfig.muted).toBe(config.muted);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
