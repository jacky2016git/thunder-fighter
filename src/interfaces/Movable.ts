/**
 * Movable Interface
 * 可移动对象接口
 * 
 * Objects that can move implement this interface.
 * 可移动的对象实现此接口。
 */
import { GameObject } from './GameObject';

export interface Movable extends GameObject {
  /** Velocity in X direction (pixels per second) */
  velocityX: number;
  
  /** Velocity in Y direction (pixels per second) */
  velocityY: number;
  
  /** Base movement speed (pixels per second) */
  speed: number;
  
  /**
   * Move the object based on velocity and deltaTime
   * @param deltaTime Time elapsed since last frame in seconds
   */
  move(deltaTime: number): void;
  
  /**
   * Set the velocity of the object
   * @param vx Velocity in X direction
   * @param vy Velocity in Y direction
   */
  setVelocity(vx: number, vy: number): void;
}
