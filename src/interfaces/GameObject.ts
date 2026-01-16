/**
 * GameObject Interface
 * 游戏对象基础接口
 * 
 * All game objects (player, enemies, bullets, power-ups) implement this interface.
 * 所有游戏对象（玩家、敌机、子弹、道具）都实现此接口。
 */
export interface GameObject {
  /** Unique identifier for the game object */
  id: string;
  
  /** X coordinate position */
  x: number;
  
  /** Y coordinate position */
  y: number;
  
  /** Width of the game object */
  width: number;
  
  /** Height of the game object */
  height: number;
  
  /** Whether the object is active (should be updated/rendered) */
  active: boolean;
  
  /**
   * Update the game object state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void;
  
  /**
   * Render the game object to the canvas
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void;
  
  /**
   * Clean up and mark the object for removal
   */
  destroy(): void;
}
