/**
 * StateManager Class
 * 状态管理器类
 * 
 * Manages game states and transitions between them.
 * 管理游戏状态及其之间的转换。
 */
import { GameStateType } from '../types/enums';
import { GameState } from './GameState';
import { InputState } from './InputState';

/**
 * Valid state transitions map
 * 有效的状态转换映射
 */
const VALID_TRANSITIONS: Map<GameStateType, GameStateType[]> = new Map([
  [GameStateType.MENU, [GameStateType.PLAYING]],
  [GameStateType.PLAYING, [GameStateType.PAUSED, GameStateType.GAME_OVER]],
  [GameStateType.PAUSED, [GameStateType.PLAYING, GameStateType.MENU]],
  [GameStateType.GAME_OVER, [GameStateType.MENU, GameStateType.PLAYING]]
]);

export class StateManager {
  private currentState: GameState | null = null;
  private states: Map<GameStateType, GameState> = new Map();
  
  /**
   * Register a state with the manager
   * 向管理器注册状态
   * @param type The state type
   * @param state The state instance
   */
  registerState(type: GameStateType, state: GameState): void {
    this.states.set(type, state);
  }
  
  /**
   * Change to a new state
   * 切换到新状态
   * @param type The target state type
   * @returns true if transition was successful
   */
  changeState(type: GameStateType): boolean {
    const newState = this.states.get(type);
    
    if (!newState) {
      console.error(`State ${type} not registered`);
      return false;
    }
    
    // Check if transition is valid (if we have a current state)
    if (this.currentState) {
      const validTransitions = VALID_TRANSITIONS.get(this.currentState.type);
      if (validTransitions && !validTransitions.includes(type)) {
        console.error(`Invalid state transition from ${this.currentState.type} to ${type}`);
        return false;
      }
      
      // Exit current state
      this.currentState.exit();
    }
    
    // Enter new state
    this.currentState = newState;
    this.currentState.enter();
    
    return true;
  }
  
  /**
   * Get the current state
   * 获取当前状态
   */
  getCurrentState(): GameState | null {
    return this.currentState;
  }
  
  /**
   * Get the current state type
   * 获取当前状态类型
   */
  getCurrentStateType(): GameStateType | null {
    return this.currentState?.type ?? null;
  }
  
  /**
   * Check if a transition to the target state is valid
   * 检查到目标状态的转换是否有效
   * @param targetType The target state type
   */
  canTransitionTo(targetType: GameStateType): boolean {
    if (!this.currentState) {
      return true; // Can transition to any state if no current state
    }
    
    const validTransitions = VALID_TRANSITIONS.get(this.currentState.type);
    return validTransitions?.includes(targetType) ?? false;
  }
  
  /**
   * Update the current state
   * 更新当前状态
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    this.currentState?.update(deltaTime);
  }
  
  /**
   * Render the current state
   * 渲染当前状态
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    this.currentState?.render(context);
  }
  
  /**
   * Handle input for the current state
   * 处理当前状态的输入
   * @param input The current input state
   */
  handleInput(input: InputState): void {
    this.currentState?.handleInput(input);
  }
  
  /**
   * Check if a state is registered
   * 检查状态是否已注册
   * @param type The state type to check
   */
  hasState(type: GameStateType): boolean {
    return this.states.has(type);
  }
  
  /**
   * Get all registered state types
   * 获取所有已注册的状态类型
   */
  getRegisteredStates(): GameStateType[] {
    return Array.from(this.states.keys());
  }
}
