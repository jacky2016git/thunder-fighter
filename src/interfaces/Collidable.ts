/**
 * Collidable Interface
 * 可碰撞对象接口
 * 
 * Objects that can participate in collision detection implement this interface.
 * 可参与碰撞检测的对象实现此接口。
 */
import { GameObject } from './GameObject';
import { Rectangle } from '../types/Rectangle';
import { CollisionType } from '../types/enums';

export interface Collidable extends GameObject {
  /** The collision bounding box */
  collisionBox: Rectangle;
  
  /** The type of collision (for filtering collision pairs) */
  collisionType: CollisionType;
  
  /**
   * Called when a collision is detected with another object
   * @param other The other collidable object
   */
  onCollision(other: Collidable): void;
  
  /**
   * Check if this object collides with another
   * @param other The other collidable object
   * @returns true if collision detected
   */
  checkCollision(other: Collidable): boolean;
}
