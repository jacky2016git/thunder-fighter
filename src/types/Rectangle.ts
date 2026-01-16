/**
 * Rectangle Type
 * 矩形类型
 * 
 * Used for collision detection bounding boxes.
 * 用于碰撞检测的边界框。
 */
export interface Rectangle {
  /** X coordinate of the top-left corner */
  x: number;
  
  /** Y coordinate of the top-left corner */
  y: number;
  
  /** Width of the rectangle */
  width: number;
  
  /** Height of the rectangle */
  height: number;
}
