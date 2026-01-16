/**
 * EntityManager Class
 * 实体管理器类
 * 
 * Manages all game entities (player, enemies, bullets, power-ups).
 * 管理所有游戏实体（玩家、敌机、子弹、道具）。
 */
import { GameObject } from '../interfaces/GameObject';

export class EntityManager {
  private entities: Map<string, GameObject> = new Map();
  private entitiesToAdd: GameObject[] = [];
  private entitiesToRemove: string[] = [];
  private isUpdating: boolean = false;
  
  /**
   * Add an entity to the manager
   * 向管理器添加实体
   * @param entity The entity to add
   */
  addEntity(entity: GameObject): void {
    if (this.isUpdating) {
      // Defer addition until after update completes
      this.entitiesToAdd.push(entity);
    } else {
      this.entities.set(entity.id, entity);
    }
  }
  
  /**
   * Remove an entity from the manager
   * 从管理器移除实体
   * @param id The entity ID to remove
   */
  removeEntity(id: string): void {
    if (this.isUpdating) {
      // Defer removal until after update completes
      this.entitiesToRemove.push(id);
    } else {
      const entity = this.entities.get(id);
      if (entity) {
        entity.destroy();
        this.entities.delete(id);
      }
    }
  }
  
  /**
   * Get an entity by ID
   * 通过ID获取实体
   * @param id The entity ID
   */
  getEntity(id: string): GameObject | undefined {
    return this.entities.get(id);
  }
  
  /**
   * Get all entities of a specific type
   * 获取特定类型的所有实体
   * @param type The constructor/class of the entity type
   */
  getEntitiesByType<T extends GameObject>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    for (const entity of this.entities.values()) {
      if (entity instanceof type) {
        result.push(entity);
      }
    }
    return result;
  }
  
  /**
   * Get all active entities
   * 获取所有活跃实体
   */
  getAllEntities(): GameObject[] {
    return Array.from(this.entities.values());
  }
  
  /**
   * Get all active entities (filtered by active flag)
   * 获取所有活跃实体（按活跃标志过滤）
   */
  getActiveEntities(): GameObject[] {
    return Array.from(this.entities.values()).filter(e => e.active);
  }
  
  /**
   * Get the count of entities
   * 获取实体数量
   */
  getEntityCount(): number {
    return this.entities.size;
  }
  
  /**
   * Update all entities
   * 更新所有实体
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    this.isUpdating = true;
    
    // Update all active entities
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.update(deltaTime);
      }
    }
    
    this.isUpdating = false;
    
    // Process deferred additions and removals
    this.processAdditions();
    this.processRemovals();
    
    // Remove inactive entities
    this.removeInactiveEntities();
  }
  
  /**
   * Render all entities
   * 渲染所有实体
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    // Render all active entities
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.render(context);
      }
    }
  }
  
  /**
   * Clear all entities
   * 清除所有实体
   */
  clear(): void {
    // Destroy all entities
    for (const entity of this.entities.values()) {
      entity.destroy();
    }
    
    this.entities.clear();
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
  }
  
  /**
   * Check if an entity exists
   * 检查实体是否存在
   * @param id The entity ID
   */
  hasEntity(id: string): boolean {
    return this.entities.has(id);
  }
  
  /**
   * Process deferred entity additions
   * 处理延迟的实体添加
   */
  private processAdditions(): void {
    for (const entity of this.entitiesToAdd) {
      this.entities.set(entity.id, entity);
    }
    this.entitiesToAdd = [];
  }
  
  /**
   * Process deferred entity removals
   * 处理延迟的实体移除
   */
  private processRemovals(): void {
    for (const id of this.entitiesToRemove) {
      const entity = this.entities.get(id);
      if (entity) {
        entity.destroy();
        this.entities.delete(id);
      }
    }
    this.entitiesToRemove = [];
  }
  
  /**
   * Remove all inactive entities
   * 移除所有非活跃实体
   */
  private removeInactiveEntities(): void {
    const inactiveIds: string[] = [];
    
    for (const [id, entity] of this.entities) {
      if (!entity.active) {
        inactiveIds.push(id);
      }
    }
    
    for (const id of inactiveIds) {
      const entity = this.entities.get(id);
      if (entity) {
        entity.destroy();
        this.entities.delete(id);
      }
    }
  }
}
