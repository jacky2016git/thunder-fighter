/**
 * GameState Interface
 * 游戏状态接口
 * 
 * Interface for all game states (Menu, Playing, Paused, GameOver).
 * 所有游戏状态（菜单、游戏中、暂停、游戏结束）的接口。
 */
import { GameStateType } from '../types/enums';
import { InputState } from './InputState';

export interface GameState {
  /** The type of this state */
  readonly type: GameStateType;
  
  /**
   * Called when entering this state
   * 进入此状态时调用
   */
  enter(): void;
  
  /**
   * Called when exiting this state
   * 退出此状态时调用
   */
  exit(): void;
  
  /**
   * Update the state
   * 更新状态
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void;
  
  /**
   * Render the state
   * 渲染状态
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void;
  
  /**
   * Handle input for this state
   * 处理此状态的输入
   * @param input The current input state
   */
  handleInput(input: InputState): void;
}
