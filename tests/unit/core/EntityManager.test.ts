/**
 * EntityManager Unit Tests
 * 实体管理器单元测试
 */
import { EntityManager } from '../../../src/core/EntityManager';
import { GameObject } from '../../../src/interfaces/GameObject';

// Mock GameObject implementation for testing
class MockEntity implements GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  
  updateCalled = false;
  renderCalled = false;
  destroyCalled = false;
  lastDeltaTime = 0;
  
  constructor(id: string, active = true) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.width = 10;
    this.height = 10;
    this.active = active;
  }
  
  update(deltaTime: number): void {
    this.updateCalled = true;
    this.lastDeltaTime = deltaTime;
  }
  
  render(_context: CanvasRenderingContext2D): void {
    this.renderCalled = true;
  }
  
  destroy(): void {
    this.destroyCalled = true;
    this.active = false;
  }
  
  reset(): void {
    this.updateCalled = false;
    this.renderCalled = false;
    this.destroyCalled = false;
    this.lastDeltaTime = 0;
  }
}

// Extended mock for type testing
class MockPlayer extends MockEntity {
  health = 3;
}

class MockEnemy extends MockEntity {
  damage = 1;
}

describe('EntityManager', () => {
  let entityManager: EntityManager;
  let mockContext: CanvasRenderingContext2D;
  
  beforeEach(() => {
    entityManager = new EntityManager();
    const canvas = document.createElement('canvas');
    mockContext = canvas.getContext('2d')!;
  });
  
  describe('addEntity', () => {
    it('should add an entity', () => {
      const entity = new MockEntity('entity1');
      entityManager.addEntity(entity);
      
      expect(entityManager.hasEntity('entity1')).toBe(true);
      expect(entityManager.getEntityCount()).toBe(1);
    });
    
    it('should add multiple entities', () => {
      entityManager.addEntity(new MockEntity('entity1'));
      entityManager.addEntity(new MockEntity('entity2'));
      entityManager.addEntity(new MockEntity('entity3'));
      
      expect(entityManager.getEntityCount()).toBe(3);
    });
  });
  
  describe('removeEntity', () => {
    it('should remove an entity', () => {
      const entity = new MockEntity('entity1');
      entityManager.addEntity(entity);
      
      entityManager.removeEntity('entity1');
      
      expect(entityManager.hasEntity('entity1')).toBe(false);
      expect(entity.destroyCalled).toBe(true);
    });
    
    it('should not throw when removing non-existent entity', () => {
      expect(() => entityManager.removeEntity('nonexistent')).not.toThrow();
    });
  });
  
  describe('getEntity', () => {
    it('should return entity by id', () => {
      const entity = new MockEntity('entity1');
      entityManager.addEntity(entity);
      
      expect(entityManager.getEntity('entity1')).toBe(entity);
    });
    
    it('should return undefined for non-existent entity', () => {
      expect(entityManager.getEntity('nonexistent')).toBeUndefined();
    });
  });
  
  describe('getEntitiesByType', () => {
    it('should return entities of specific type', () => {
      const player = new MockPlayer('player1');
      const enemy1 = new MockEnemy('enemy1');
      const enemy2 = new MockEnemy('enemy2');
      
      entityManager.addEntity(player);
      entityManager.addEntity(enemy1);
      entityManager.addEntity(enemy2);
      
      const players = entityManager.getEntitiesByType(MockPlayer);
      const enemies = entityManager.getEntitiesByType(MockEnemy);
      
      expect(players).toHaveLength(1);
      expect(players[0]).toBe(player);
      expect(enemies).toHaveLength(2);
    });
    
    it('should return empty array when no entities of type exist', () => {
      entityManager.addEntity(new MockEntity('entity1'));
      
      const players = entityManager.getEntitiesByType(MockPlayer);
      expect(players).toHaveLength(0);
    });
  });
  
  describe('getAllEntities', () => {
    it('should return all entities', () => {
      entityManager.addEntity(new MockEntity('entity1'));
      entityManager.addEntity(new MockEntity('entity2'));
      
      const entities = entityManager.getAllEntities();
      expect(entities).toHaveLength(2);
    });
    
    it('should return empty array when no entities', () => {
      expect(entityManager.getAllEntities()).toHaveLength(0);
    });
  });
  
  describe('getActiveEntities', () => {
    it('should return only active entities', () => {
      entityManager.addEntity(new MockEntity('active1', true));
      entityManager.addEntity(new MockEntity('inactive1', false));
      entityManager.addEntity(new MockEntity('active2', true));
      
      const activeEntities = entityManager.getActiveEntities();
      expect(activeEntities).toHaveLength(2);
    });
  });
  
  describe('update', () => {
    it('should update all active entities', () => {
      const entity1 = new MockEntity('entity1', true);
      const entity2 = new MockEntity('entity2', true);
      const inactiveEntity = new MockEntity('inactive', false);
      
      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      entityManager.addEntity(inactiveEntity);
      
      entityManager.update(0.016);
      
      expect(entity1.updateCalled).toBe(true);
      expect(entity1.lastDeltaTime).toBe(0.016);
      expect(entity2.updateCalled).toBe(true);
      expect(inactiveEntity.updateCalled).toBe(false);
    });
    
    it('should remove inactive entities after update', () => {
      const entity = new MockEntity('entity1', true);
      entityManager.addEntity(entity);
      
      // Mark as inactive during update
      entity.active = false;
      entityManager.update(0.016);
      
      expect(entityManager.hasEntity('entity1')).toBe(false);
    });
  });
  
  describe('render', () => {
    it('should render all active entities', () => {
      const entity1 = new MockEntity('entity1', true);
      const entity2 = new MockEntity('entity2', true);
      const inactiveEntity = new MockEntity('inactive', false);
      
      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      entityManager.addEntity(inactiveEntity);
      
      entityManager.render(mockContext);
      
      expect(entity1.renderCalled).toBe(true);
      expect(entity2.renderCalled).toBe(true);
      expect(inactiveEntity.renderCalled).toBe(false);
    });
  });
  
  describe('clear', () => {
    it('should remove all entities', () => {
      const entity1 = new MockEntity('entity1');
      const entity2 = new MockEntity('entity2');
      
      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      
      entityManager.clear();
      
      expect(entityManager.getEntityCount()).toBe(0);
      expect(entity1.destroyCalled).toBe(true);
      expect(entity2.destroyCalled).toBe(true);
    });
  });
  
  describe('deferred operations', () => {
    it('should defer entity addition during update', () => {
      const entity1 = new MockEntity('entity1');
      const entity2 = new MockEntity('entity2');
      
      // Override update to add entity during update
      entity1.update = function(deltaTime: number) {
        this.updateCalled = true;
        this.lastDeltaTime = deltaTime;
        entityManager.addEntity(entity2);
      };
      
      entityManager.addEntity(entity1);
      entityManager.update(0.016);
      
      // entity2 should be added after update completes
      expect(entityManager.hasEntity('entity2')).toBe(true);
    });
    
    it('should defer entity removal during update', () => {
      const entity1 = new MockEntity('entity1');
      const entity2 = new MockEntity('entity2');
      
      // Override update to remove entity during update
      entity1.update = function(deltaTime: number) {
        this.updateCalled = true;
        this.lastDeltaTime = deltaTime;
        entityManager.removeEntity('entity2');
      };
      
      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      entityManager.update(0.016);
      
      // entity2 should be removed after update completes
      expect(entityManager.hasEntity('entity2')).toBe(false);
    });
  });
});
