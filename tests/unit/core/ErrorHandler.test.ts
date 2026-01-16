/**
 * ErrorHandler Unit Tests
 * 错误处理器单元测试
 */
import { 
  ErrorHandler, 
  ErrorSeverity, 
  ErrorCategory,
  getErrorHandler,
  safeExecute,
  safeExecuteAsync,
  retryWithBackoff
} from '../../../src/core/ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    // Reset singleton for clean tests
    ErrorHandler.resetInstance();
    errorHandler = ErrorHandler.getInstance();
    errorHandler.setConsoleLogging(false); // Disable console output in tests
  });

  afterEach(() => {
    errorHandler.clearLog();
    ErrorHandler.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance correctly', () => {
      const instance1 = ErrorHandler.getInstance();
      ErrorHandler.resetInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).not.toBe(instance2);
    });

    it('should provide convenience function', () => {
      const handler = getErrorHandler();
      expect(handler).toBe(ErrorHandler.getInstance());
    });
  });

  describe('Logging', () => {
    it('should log debug messages', () => {
      errorHandler.debug('Debug message');
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(1);
      expect(log[0].severity).toBe(ErrorSeverity.DEBUG);
      expect(log[0].message).toBe('Debug message');
    });

    it('should log info messages', () => {
      errorHandler.info('Info message');
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(1);
      expect(log[0].severity).toBe(ErrorSeverity.INFO);
    });

    it('should log warnings', () => {
      errorHandler.warn('Warning message');
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(1);
      expect(log[0].severity).toBe(ErrorSeverity.WARNING);
    });

    it('should log errors', () => {
      errorHandler.error('Error message');
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(1);
      expect(log[0].severity).toBe(ErrorSeverity.ERROR);
    });

    it('should log critical errors', () => {
      errorHandler.critical('Critical error');
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(1);
      expect(log[0].severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should log Error objects', () => {
      const error = new Error('Test error');
      errorHandler.error(error);
      const log = errorHandler.getErrorLog();
      expect(log[0].message).toBe('Test error');
      expect(log[0].stack).toBeDefined();
    });

    it('should include context in log entries', () => {
      errorHandler.error('Error with context', ErrorCategory.GENERAL, { key: 'value' });
      const log = errorHandler.getErrorLog();
      expect(log[0].context).toEqual({ key: 'value' });
    });

    it('should categorize errors correctly', () => {
      errorHandler.error('Resource error', ErrorCategory.RESOURCE);
      errorHandler.error('Audio error', ErrorCategory.AUDIO);
      
      const resourceErrors = errorHandler.getErrorsByCategory(ErrorCategory.RESOURCE);
      const audioErrors = errorHandler.getErrorsByCategory(ErrorCategory.AUDIO);
      
      expect(resourceErrors.length).toBe(1);
      expect(audioErrors.length).toBe(1);
    });

    it('should filter by severity', () => {
      errorHandler.debug('Debug');
      errorHandler.info('Info');
      errorHandler.warn('Warning');
      errorHandler.error('Error');
      
      const errors = errorHandler.getErrorsBySeverity(ErrorSeverity.ERROR);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Error');
    });
  });

  describe('Log Management', () => {
    it('should respect max log size', () => {
      errorHandler.setMaxLogSize(5);
      
      for (let i = 0; i < 10; i++) {
        errorHandler.info(`Message ${i}`);
      }
      
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(5);
      expect(log[0].message).toBe('Message 5'); // Oldest kept
      expect(log[4].message).toBe('Message 9'); // Newest
    });

    it('should clear log', () => {
      errorHandler.info('Message 1');
      errorHandler.info('Message 2');
      
      errorHandler.clearLog();
      
      expect(errorHandler.getErrorLog().length).toBe(0);
    });

    it('should export log as JSON', () => {
      errorHandler.info('Test message');
      
      const exported = errorHandler.exportLog();
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].message).toBe('Test message');
    });

    it('should count errors correctly', () => {
      errorHandler.debug('Debug');
      errorHandler.info('Info');
      errorHandler.warn('Warning');
      errorHandler.error('Error 1');
      errorHandler.error('Error 2');
      errorHandler.critical('Critical');
      
      expect(errorHandler.getErrorCount()).toBe(3); // 2 errors + 1 critical
    });
  });

  describe('Recovery Strategies', () => {
    it('should attempt recovery for errors', () => {
      let recoveryAttempted = false;
      
      errorHandler.registerRecoveryStrategy(ErrorCategory.GENERAL, () => {
        recoveryAttempted = true;
        return true;
      });
      
      errorHandler.error('Test error');
      
      expect(recoveryAttempted).toBe(true);
    });

    it('should mark recovery as successful', () => {
      errorHandler.registerRecoveryStrategy(ErrorCategory.GENERAL, () => true);
      
      const result = errorHandler.error('Test error');
      
      expect(result).toBe(true);
      const log = errorHandler.getErrorLog();
      expect(log[0].recoveryAttempted).toBe(true);
      expect(log[0].recoverySuccessful).toBe(true);
    });

    it('should mark recovery as failed', () => {
      errorHandler.registerRecoveryStrategy(ErrorCategory.GENERAL, () => false);
      
      const result = errorHandler.error('Test error');
      
      expect(result).toBe(false);
      const log = errorHandler.getErrorLog();
      expect(log[0].recoveryAttempted).toBe(true);
      expect(log[0].recoverySuccessful).toBe(false);
    });

    it('should try multiple recovery strategies', () => {
      let strategy1Called = false;
      let strategy2Called = false;
      
      errorHandler.registerRecoveryStrategy(ErrorCategory.GENERAL, () => {
        strategy1Called = true;
        return false; // First strategy fails
      });
      
      errorHandler.registerRecoveryStrategy(ErrorCategory.GENERAL, () => {
        strategy2Called = true;
        return true; // Second strategy succeeds
      });
      
      const result = errorHandler.error('Test error');
      
      expect(strategy1Called).toBe(true);
      expect(strategy2Called).toBe(true);
      expect(result).toBe(true);
    });

    it('should handle recovery strategy errors gracefully', () => {
      errorHandler.registerRecoveryStrategy(ErrorCategory.GENERAL, () => {
        throw new Error('Recovery failed');
      });
      
      // Should not throw
      expect(() => errorHandler.error('Test error')).not.toThrow();
    });
  });

  describe('Degraded Mode', () => {
    it('should enable degraded mode', () => {
      errorHandler.enableDegradedMode('audio');
      expect(errorHandler.isDegradedMode('audio')).toBe(true);
    });

    it('should disable degraded mode', () => {
      errorHandler.enableDegradedMode('audio');
      errorHandler.disableDegradedMode('audio');
      expect(errorHandler.isDegradedMode('audio')).toBe(false);
    });

    it('should list all degraded modes', () => {
      errorHandler.enableDegradedMode('audio');
      errorHandler.enableDegradedMode('resources');
      
      const modes = errorHandler.getDegradedModes();
      expect(modes).toContain('audio');
      expect(modes).toContain('resources');
    });

    it('should enable degraded mode on resource errors', () => {
      errorHandler.error('Resource load failed', ErrorCategory.RESOURCE);
      expect(errorHandler.isDegradedMode('resources')).toBe(true);
    });

    it('should enable degraded mode on audio errors', () => {
      errorHandler.error('Audio playback failed', ErrorCategory.AUDIO);
      expect(errorHandler.isDegradedMode('audio')).toBe(true);
    });
  });

  describe('Callbacks', () => {
    it('should notify callbacks on error', () => {
      let callbackCalled = false;
      
      errorHandler.onError(() => {
        callbackCalled = true;
      });
      
      errorHandler.error('Test error');
      
      expect(callbackCalled).toBe(true);
    });

    it('should pass error entry to callback', () => {
      let receivedEntry: any = null;
      
      errorHandler.onError((entry) => {
        receivedEntry = entry;
      });
      
      errorHandler.error('Test error', ErrorCategory.AUDIO);
      
      expect(receivedEntry).not.toBeNull();
      expect(receivedEntry.message).toBe('Test error');
      expect(receivedEntry.category).toBe(ErrorCategory.AUDIO);
    });

    it('should remove callbacks', () => {
      let callCount = 0;
      const callback = () => { callCount++; };
      
      errorHandler.onError(callback);
      errorHandler.error('Error 1');
      
      errorHandler.offError(callback);
      errorHandler.error('Error 2');
      
      expect(callCount).toBe(1);
    });

    it('should handle callback errors gracefully', () => {
      errorHandler.onError(() => {
        throw new Error('Callback error');
      });
      
      // Should not throw
      expect(() => errorHandler.error('Test error')).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide error statistics', () => {
      // Clear any existing log entries
      errorHandler.clearLog();
      
      errorHandler.debug('Debug');
      errorHandler.info('Info');
      errorHandler.warn('Warning');
      
      // These will trigger recovery strategies that add info logs
      errorHandler.error('Error', ErrorCategory.AUDIO);
      errorHandler.critical('Critical', ErrorCategory.RESOURCE);
      
      const stats = errorHandler.getStatistics();
      
      // At minimum we should have our 5 explicit logs
      expect(stats.total).toBeGreaterThanOrEqual(5);
      expect(stats.bySeverity[ErrorSeverity.DEBUG]).toBeGreaterThanOrEqual(1);
      expect(stats.bySeverity[ErrorSeverity.INFO]).toBeGreaterThanOrEqual(1);
      expect(stats.bySeverity[ErrorSeverity.WARNING]).toBeGreaterThanOrEqual(1);
      expect(stats.bySeverity[ErrorSeverity.ERROR]).toBeGreaterThanOrEqual(1);
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBeGreaterThanOrEqual(1);
      expect(stats.byCategory[ErrorCategory.AUDIO]).toBeGreaterThanOrEqual(1);
      expect(stats.byCategory[ErrorCategory.RESOURCE]).toBeGreaterThanOrEqual(1);
    });

    it('should calculate recovery rate', () => {
      // Register a strategy that always succeeds
      errorHandler.registerRecoveryStrategy(ErrorCategory.GENERAL, () => true);
      
      errorHandler.error('Error 1');
      errorHandler.error('Error 2');
      
      const stats = errorHandler.getStatistics();
      expect(stats.recoveryRate).toBe(100);
    });
  });
});

describe('Safe Execution Helpers', () => {
  beforeEach(() => {
    ErrorHandler.resetInstance();
    const handler = ErrorHandler.getInstance();
    handler.setConsoleLogging(false);
  });

  afterEach(() => {
    ErrorHandler.resetInstance();
  });

  describe('safeExecute', () => {
    it('should return function result on success', () => {
      const result = safeExecute(() => 42);
      expect(result).toBe(42);
    });

    it('should return fallback on error', () => {
      const result = safeExecute(() => {
        throw new Error('Test error');
      }, ErrorCategory.GENERAL, 'fallback');
      
      expect(result).toBe('fallback');
    });

    it('should return undefined if no fallback', () => {
      const result = safeExecute(() => {
        throw new Error('Test error');
      });
      
      expect(result).toBeUndefined();
    });

    it('should log error on failure', () => {
      safeExecute(() => {
        throw new Error('Test error');
      });
      
      const handler = getErrorHandler();
      expect(handler.getErrorCount()).toBe(1);
    });
  });

  describe('safeExecuteAsync', () => {
    it('should return promise result on success', async () => {
      const result = await safeExecuteAsync(async () => 42);
      expect(result).toBe(42);
    });

    it('should return fallback on error', async () => {
      const result = await safeExecuteAsync(async () => {
        throw new Error('Test error');
      }, ErrorCategory.GENERAL, 'fallback');
      
      expect(result).toBe('fallback');
    });

    it('should handle rejected promises', async () => {
      const result = await safeExecuteAsync(
        () => Promise.reject(new Error('Rejected')),
        ErrorCategory.GENERAL,
        'fallback'
      );
      
      expect(result).toBe('fallback');
    });
  });

  describe('retryWithBackoff', () => {
    it('should return result on first success', async () => {
      const result = await retryWithBackoff(async () => 42, 3, 10);
      expect(result).toBe(42);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      
      const result = await retryWithBackoff(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry');
        }
        return 'success';
      }, 3, 10);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should return undefined after max retries', async () => {
      const result = await retryWithBackoff(async () => {
        throw new Error('Always fails');
      }, 3, 10);
      
      expect(result).toBeUndefined();
    });

    it('should log retry attempts', async () => {
      await retryWithBackoff(async () => {
        throw new Error('Retry error');
      }, 2, 10);
      
      const handler = getErrorHandler();
      const log = handler.getErrorLog();
      
      // Should have warning for each attempt + final error
      expect(log.length).toBeGreaterThan(0);
    });
  });
});
