/**
 * ErrorHandler Class
 * 错误处理类
 * 
 * Centralized error handling, logging, and recovery for the game.
 * 游戏的集中式错误处理、日志记录和恢复。
 */

/**
 * Error severity levels
 * 错误严重级别
 */
export enum ErrorSeverity {
  /** Debug information */
  DEBUG = 'debug',
  /** Informational message */
  INFO = 'info',
  /** Warning - non-critical issue */
  WARNING = 'warning',
  /** Error - recoverable issue */
  ERROR = 'error',
  /** Critical - may affect game stability */
  CRITICAL = 'critical'
}

/**
 * Error category for classification
 * 错误分类
 */
export enum ErrorCategory {
  /** Resource loading errors */
  RESOURCE = 'resource',
  /** Rendering errors */
  RENDER = 'render',
  /** Audio errors */
  AUDIO = 'audio',
  /** Collision detection errors */
  COLLISION = 'collision',
  /** State management errors */
  STATE = 'state',
  /** Storage errors */
  STORAGE = 'storage',
  /** Input handling errors */
  INPUT = 'input',
  /** General/unknown errors */
  GENERAL = 'general'
}

/**
 * Error log entry
 * 错误日志条目
 */
export interface ErrorLogEntry {
  /** Timestamp of the error */
  timestamp: number;
  /** Error severity */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** Error message */
  message: string;
  /** Additional context/details */
  context?: Record<string, unknown>;
  /** Stack trace if available */
  stack?: string;
  /** Whether recovery was attempted */
  recoveryAttempted: boolean;
  /** Whether recovery was successful */
  recoverySuccessful: boolean;
}

/**
 * Recovery strategy function type
 */
export type RecoveryStrategy = (error: Error, context?: Record<string, unknown>) => boolean;

/**
 * Error callback type
 */
export type ErrorCallback = (entry: ErrorLogEntry) => void;

/**
 * ErrorHandler Class
 * 错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler | null = null;
  
  /** Error log */
  private errorLog: ErrorLogEntry[] = [];
  
  /** Maximum log size */
  private maxLogSize: number = 100;
  
  /** Recovery strategies by category */
  private recoveryStrategies: Map<ErrorCategory, RecoveryStrategy[]> = new Map();
  
  /** Error callbacks */
  private callbacks: ErrorCallback[] = [];
  
  /** Whether to log to console */
  private consoleLogging: boolean = true;
  
  /** Degraded mode flags */
  private degradedModes: Set<string> = new Set();

  private constructor() {
    // Initialize recovery strategies map
    Object.values(ErrorCategory).forEach(category => {
      this.recoveryStrategies.set(category, []);
    });

    // Register default recovery strategies
    this.registerDefaultStrategies();
  }

  /**
   * Get singleton instance
   * 获取单例实例
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    ErrorHandler.instance = null;
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultStrategies(): void {
    // Resource loading - retry with fallback
    this.registerRecoveryStrategy(ErrorCategory.RESOURCE, () => {
      // Default: enable degraded mode for resources
      this.enableDegradedMode('resources');
      return true;
    });

    // Audio - disable audio
    this.registerRecoveryStrategy(ErrorCategory.AUDIO, () => {
      this.enableDegradedMode('audio');
      return true;
    });

    // Render - skip frame
    this.registerRecoveryStrategy(ErrorCategory.RENDER, () => {
      // Render errors are usually recoverable by skipping the frame
      return true;
    });

    // Storage - use memory fallback
    this.registerRecoveryStrategy(ErrorCategory.STORAGE, () => {
      this.enableDegradedMode('storage');
      return true;
    });
  }

  /**
   * Handle an error
   * 处理错误
   * @param error The error to handle
   * @param category Error category
   * @param severity Error severity
   * @param context Additional context
   * @returns Whether recovery was successful
   */
  handleError(
    error: Error | string,
    category: ErrorCategory = ErrorCategory.GENERAL,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, unknown>
  ): boolean {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Create log entry
    const entry: ErrorLogEntry = {
      timestamp: Date.now(),
      severity,
      category,
      message: errorObj.message,
      context,
      stack: errorObj.stack,
      recoveryAttempted: false,
      recoverySuccessful: false
    };

    // Log to console if enabled
    if (this.consoleLogging) {
      this.logToConsole(entry);
    }

    // Attempt recovery for errors and critical issues
    if (severity === ErrorSeverity.ERROR || severity === ErrorSeverity.CRITICAL) {
      entry.recoveryAttempted = true;
      entry.recoverySuccessful = this.attemptRecovery(errorObj, category, context);
    }

    // Add to log
    this.addToLog(entry);

    // Notify callbacks
    this.notifyCallbacks(entry);

    return entry.recoverySuccessful;
  }

  /**
   * Log a debug message
   */
  debug(message: string, category: ErrorCategory = ErrorCategory.GENERAL, context?: Record<string, unknown>): void {
    this.handleError(message, category, ErrorSeverity.DEBUG, context);
  }

  /**
   * Log an info message
   */
  info(message: string, category: ErrorCategory = ErrorCategory.GENERAL, context?: Record<string, unknown>): void {
    this.handleError(message, category, ErrorSeverity.INFO, context);
  }

  /**
   * Log a warning
   */
  warn(message: string, category: ErrorCategory = ErrorCategory.GENERAL, context?: Record<string, unknown>): void {
    this.handleError(message, category, ErrorSeverity.WARNING, context);
  }

  /**
   * Log an error
   */
  error(error: Error | string, category: ErrorCategory = ErrorCategory.GENERAL, context?: Record<string, unknown>): boolean {
    return this.handleError(error, category, ErrorSeverity.ERROR, context);
  }

  /**
   * Log a critical error
   */
  critical(error: Error | string, category: ErrorCategory = ErrorCategory.GENERAL, context?: Record<string, unknown>): boolean {
    return this.handleError(error, category, ErrorSeverity.CRITICAL, context);
  }

  /**
   * Attempt recovery using registered strategies
   */
  private attemptRecovery(
    error: Error,
    category: ErrorCategory,
    context?: Record<string, unknown>
  ): boolean {
    const strategies = this.recoveryStrategies.get(category) || [];
    
    for (const strategy of strategies) {
      try {
        if (strategy(error, context)) {
          return true;
        }
      } catch (recoveryError) {
        // Recovery strategy itself failed
        this.logToConsole({
          timestamp: Date.now(),
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.GENERAL,
          message: `Recovery strategy failed: ${recoveryError}`,
          recoveryAttempted: false,
          recoverySuccessful: false
        });
      }
    }

    return false;
  }

  /**
   * Register a recovery strategy for a category
   */
  registerRecoveryStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void {
    const strategies = this.recoveryStrategies.get(category) || [];
    strategies.push(strategy);
    this.recoveryStrategies.set(category, strategies);
  }

  /**
   * Register an error callback
   */
  onError(callback: ErrorCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove an error callback
   */
  offError(callback: ErrorCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(entry: ErrorLogEntry): void {
    for (const callback of this.callbacks) {
      try {
        callback(entry);
      } catch (e) {
        // Callback error - log but don't propagate
        console.error('Error callback failed:', e);
      }
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.severity.toUpperCase()}][${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.severity) {
      case ErrorSeverity.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case ErrorSeverity.INFO:
        console.info(message, entry.context || '');
        break;
      case ErrorSeverity.WARNING:
        console.warn(message, entry.context || '');
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        console.error(message, entry.context || '', entry.stack || '');
        break;
    }
  }

  /**
   * Add entry to log
   */
  private addToLog(entry: ErrorLogEntry): void {
    this.errorLog.push(entry);
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Enable degraded mode for a feature
   */
  enableDegradedMode(feature: string): void {
    this.degradedModes.add(feature);
    this.info(`Degraded mode enabled for: ${feature}`, ErrorCategory.GENERAL);
  }

  /**
   * Disable degraded mode for a feature
   */
  disableDegradedMode(feature: string): void {
    this.degradedModes.delete(feature);
    this.info(`Degraded mode disabled for: ${feature}`, ErrorCategory.GENERAL);
  }

  /**
   * Check if a feature is in degraded mode
   */
  isDegradedMode(feature: string): boolean {
    return this.degradedModes.has(feature);
  }

  /**
   * Get all degraded mode features
   */
  getDegradedModes(): string[] {
    return Array.from(this.degradedModes);
  }

  /**
   * Get the error log
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.errorLog.filter(e => e.severity === severity);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorLogEntry[] {
    return this.errorLog.filter(e => e.category === category);
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorLog.filter(
      e => e.severity === ErrorSeverity.ERROR || e.severity === ErrorSeverity.CRITICAL
    ).length;
  }

  /**
   * Clear the error log
   */
  clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Set console logging
   */
  setConsoleLogging(enabled: boolean): void {
    this.consoleLogging = enabled;
  }

  /**
   * Set max log size
   */
  setMaxLogSize(size: number): void {
    this.maxLogSize = size;
    if (this.errorLog.length > size) {
      this.errorLog = this.errorLog.slice(-size);
    }
  }

  /**
   * Export log as JSON string
   */
  exportLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recoveryRate: number;
  } {
    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.DEBUG]: 0,
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    const byCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.RESOURCE]: 0,
      [ErrorCategory.RENDER]: 0,
      [ErrorCategory.AUDIO]: 0,
      [ErrorCategory.COLLISION]: 0,
      [ErrorCategory.STATE]: 0,
      [ErrorCategory.STORAGE]: 0,
      [ErrorCategory.INPUT]: 0,
      [ErrorCategory.GENERAL]: 0
    };

    let recoveryAttempts = 0;
    let recoverySuccesses = 0;

    for (const entry of this.errorLog) {
      bySeverity[entry.severity]++;
      byCategory[entry.category]++;
      
      if (entry.recoveryAttempted) {
        recoveryAttempts++;
        if (entry.recoverySuccessful) {
          recoverySuccesses++;
        }
      }
    }

    return {
      total: this.errorLog.length,
      bySeverity,
      byCategory,
      recoveryRate: recoveryAttempts > 0 ? (recoverySuccesses / recoveryAttempts) * 100 : 100
    };
  }
}

/**
 * Convenience function to get the error handler instance
 */
export function getErrorHandler(): ErrorHandler {
  return ErrorHandler.getInstance();
}

/**
 * Safe execution wrapper
 * 安全执行包装器
 * 
 * Wraps a function call in try-catch and handles errors
 */
export function safeExecute<T>(
  fn: () => T,
  category: ErrorCategory = ErrorCategory.GENERAL,
  fallback?: T,
  context?: Record<string, unknown>
): T | undefined {
  try {
    return fn();
  } catch (error) {
    const handler = getErrorHandler();
    handler.error(error as Error, category, context);
    return fallback;
  }
}

/**
 * Safe async execution wrapper
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  category: ErrorCategory = ErrorCategory.GENERAL,
  fallback?: T,
  context?: Record<string, unknown>
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const handler = getErrorHandler();
    handler.error(error as Error, category, context);
    return fallback;
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100,
  category: ErrorCategory = ErrorCategory.GENERAL
): Promise<T | undefined> {
  const handler = getErrorHandler();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      
      handler.warn(
        `Attempt ${attempt + 1}/${maxRetries} failed: ${(error as Error).message}`,
        category,
        { attempt, maxRetries }
      );

      if (isLastAttempt) {
        handler.error(error as Error, category, { 
          message: 'All retry attempts failed',
          attempts: maxRetries 
        });
        return undefined;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return undefined;
}
