import {
  getCurrentTime,
  shouldYield,
  forceFrameRate,
  scheduleCallback,
  IMMEDIATE_PRIORITY,
  USER_BLOCKING_PRIORITY,
  NORMAL_PRIORITY,
  LOW_PRIORITY,
  IDLE_PRIORITY
} from '../../src/runtime/scheduler';

describe('Scheduler Timing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock performance.now()
    global.performance = {
      now: jest.fn(() => Date.now())
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('getCurrentTime should return current time', () => {
    const now = Date.now();
    expect(getCurrentTime()).toBe(now);
  });

  test('forceFrameRate should validate fps range', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    
    forceFrameRate(0);
    expect(consoleSpy).toHaveBeenCalled();
    
    forceFrameRate(126);
    expect(consoleSpy).toHaveBeenCalled();
    
    forceFrameRate(60);
    expect(shouldYield()).toBe(false);
  });
});

describe('Task Scheduling', () => {
  let mockCallback;

  beforeEach(() => {
    jest.useFakeTimers();
    mockCallback = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('scheduleCallback should return a task object', () => {
    const task = scheduleCallback(NORMAL_PRIORITY, mockCallback);
    
    expect(task).toEqual(expect.objectContaining({
      id: expect.any(Number),
      callback: mockCallback,
      priorityLevel: NORMAL_PRIORITY,
      startTime: expect.any(Number),
      expirationTime: expect.any(Number),
      sortIndex: expect.any(Number)
    }));
  });

  test('tasks should be executed in priority order', () => {
    const results = [];
    
    // Schedule tasks with different priorities
    scheduleCallback(NORMAL_PRIORITY, () => results.push('normal'));
    scheduleCallback(IMMEDIATE_PRIORITY, () => results.push('immediate'));
    scheduleCallback(LOW_PRIORITY, () => results.push('low'));
    
    // Fast-forward timers
    jest.runAllTimers();
    
    expect(results).toEqual(['immediate', 'normal', 'low']);
  });

  test('task expiration should be set according to priority', () => {
    const now = getCurrentTime();
    
    const immediateTask = scheduleCallback(IMMEDIATE_PRIORITY, () => {});
    const normalTask = scheduleCallback(NORMAL_PRIORITY, () => {});
    const lowTask = scheduleCallback(LOW_PRIORITY, () => {});
    
    expect(immediateTask.expirationTime).toBeLessThan(normalTask.expirationTime);
    expect(normalTask.expirationTime).toBeLessThan(lowTask.expirationTime);
  });
});

describe('Task Execution', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('tasks should yield when time slice is exhausted', () => {
    let iterations = 0;
    const longRunningTask = jest.fn(() => {
      iterations++;
      if (iterations < 3) return longRunningTask;
      return null;
    });

    scheduleCallback(NORMAL_PRIORITY, longRunningTask);
    
    // Run timers multiple times to simulate multiple frames
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    
    expect(iterations).toBe(3);
    expect(longRunningTask).toHaveBeenCalledTimes(3);
  });

  test('expired tasks should be executed immediately', () => {
    const callback = jest.fn();
    const task = scheduleCallback(IMMEDIATE_PRIORITY, callback);
    
    // Simulate time passing beyond expiration
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalled();
  });
});

describe('Priority Levels', () => {
  test('each priority level should have correct timeout', () => {
    const priorities = [
      IMMEDIATE_PRIORITY,
      USER_BLOCKING_PRIORITY,
      NORMAL_PRIORITY,
      LOW_PRIORITY,
      IDLE_PRIORITY
    ];

    const tasks = priorities.map(priority => 
      scheduleCallback(priority, () => {})
    );

    // Verify timeout ordering
    for (let i = 0; i < tasks.length - 1; i++) {
      expect(tasks[i].expirationTime).toBeLessThan(tasks[i + 1].expirationTime);
    }
  });
});

describe('Task Continuation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('task should continue when returning a function', () => {
    let phase = 0;
    const task = jest.fn(() => {
      phase++;
      if (phase < 3) return task;
      return null;
    });

    scheduleCallback(NORMAL_PRIORITY, task);
    
    // Simulate multiple frames
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    
    expect(phase).toBe(3);
    expect(task).toHaveBeenCalledTimes(3);
  });

  test('task should stop when returning null', () => {
    const task = jest.fn(() => null);
    scheduleCallback(NORMAL_PRIORITY, task);
    
    jest.runAllTimers();
    
    expect(task).toHaveBeenCalledTimes(1);
  });
});

describe('Message Channel', () => {
  test('should schedule next frame when more work exists', () => {
    const postMessageSpy = jest.spyOn(MessageChannel.prototype.port2, 'postMessage');
    
    let iterations = 0;
    const task = jest.fn(() => {
      iterations++;
      if (iterations < 2) return task;
      return null;
    });

    scheduleCallback(NORMAL_PRIORITY, task);
    
    // First frame
    jest.runOnlyPendingTimers();
    expect(postMessageSpy).toHaveBeenCalled();
    
    // Second frame
    jest.runOnlyPendingTimers();
    expect(postMessageSpy).toHaveBeenCalledTimes(2);
  });
});

// Helper function to create a delayed promise
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('complex task scheduling scenario', async () => {
    const results = [];
    
    // Schedule multiple tasks with different priorities and continuations
    scheduleCallback(LOW_PRIORITY, () => {
      results.push('low-1');
      return () => {
        results.push('low-2');
      };
    });

    scheduleCallback(IMMEDIATE_PRIORITY, () => {
      results.push('immediate');
    });

    scheduleCallback(NORMAL_PRIORITY, () => {
      results.push('normal');
    });

    // Run all timers
    jest.runAllTimers();
    
    expect(results).toEqual([
      'immediate',
      'normal',
      'low-1',
      'low-2'
    ]);
  });
}); 