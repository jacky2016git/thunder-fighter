/**
 * Audio Configuration
 * 音频配置
 * 
 * Defines audio file paths and settings for the game.
 * 定义游戏的音频文件路径和设置。
 */
import { SoundEffect } from '../types/enums';

/**
 * Sound Effect Configuration
 * 音效配置
 */
export interface SoundEffectConfig {
  effect: SoundEffect;
  path: string;
  volume: number;
  description: string;
}

/**
 * Music Configuration
 * 音乐配置
 */
export interface MusicConfig {
  path: string;
  volume: number;
  loop: boolean;
  description: string;
}

/**
 * Default sound effects configuration
 * 默认音效配置
 */
export const SOUND_EFFECTS_CONFIG: SoundEffectConfig[] = [
  {
    effect: SoundEffect.PLAYER_SHOOT,
    path: 'assets/sounds/player_shoot.mp3',
    volume: 0.5,
    description: 'Player shooting sound'
  },
  {
    effect: SoundEffect.ENEMY_SHOOT,
    path: 'assets/sounds/enemy_shoot.mp3',
    volume: 0.4,
    description: 'Enemy shooting sound'
  },
  {
    effect: SoundEffect.EXPLOSION,
    path: 'assets/sounds/explosion.mp3',
    volume: 0.6,
    description: 'Explosion sound when enemy is destroyed'
  },
  {
    effect: SoundEffect.POWER_UP,
    path: 'assets/sounds/power_up.mp3',
    volume: 0.7,
    description: 'Power-up collection sound'
  },
  {
    effect: SoundEffect.HIT,
    path: 'assets/sounds/hit.mp3',
    volume: 0.5,
    description: 'Hit/damage sound'
  }
];

/**
 * Default background music configuration
 * 默认背景音乐配置
 */
export const BACKGROUND_MUSIC_CONFIG: MusicConfig = {
  path: 'assets/music/background.mp3',
  volume: 0.3,
  loop: true,
  description: 'Main game background music'
};

/**
 * Menu music configuration
 * 菜单音乐配置
 */
export const MENU_MUSIC_CONFIG: MusicConfig = {
  path: 'assets/music/menu.mp3',
  volume: 0.4,
  loop: true,
  description: 'Menu screen background music'
};

/**
 * Audio paths for easy reference
 * 音频路径便捷引用
 */
export const AUDIO_PATHS = {
  sounds: {
    playerShoot: 'assets/sounds/player_shoot.mp3',
    enemyShoot: 'assets/sounds/enemy_shoot.mp3',
    explosion: 'assets/sounds/explosion.mp3',
    powerUp: 'assets/sounds/power_up.mp3',
    hit: 'assets/sounds/hit.mp3'
  },
  music: {
    background: 'assets/music/background.mp3',
    menu: 'assets/music/menu.mp3'
  }
};

/**
 * Default audio settings
 * 默认音频设置
 */
export const DEFAULT_AUDIO_SETTINGS = {
  soundVolume: 0.7,
  musicVolume: 0.5,
  muted: false
};
