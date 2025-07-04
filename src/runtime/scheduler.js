// Scheduler.js

// ---------------------- 时间与优先级 ----------------------
const IMMEDIATE_PRIORITY = 1;
const USER_BLOCKING_PRIORITY = 2;
const NORMAL_PRIORITY = 3;
const LOW_PRIORITY = 4;
const IDLE_PRIORITY = 5;

// 当前帧允许使用的最大时间（5ms 默认）
let yieldInterval = 5;
let deadline = 0;

export function getCurrentTime() {
  return performance.now();
}

export function shouldYield() {
  return getCurrentTime() >= deadline;
}

export function forceFrameRate(fps) {
  if (fps < 1 || fps > 125) {
    console.error('forceFrameRate: fps must be between 1 and 125.');
    return;
  }
  yieldInterval = Math.floor(1000 / fps);
}

// ---------------------- 最小堆实现 ----------------------
function push(heap, task) {
  heap.push(task);
  siftUp(heap, heap.length - 1);
}

function pop(heap) {
  const first = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return first;
}

function peek(heap) {
  return heap.length > 0 ? heap[0] : null;
}

function siftUp(heap, i) {
  const node = heap[i];
  while (i > 0) {
    const parentIndex = (i - 1) >>> 1;
    const parent = heap[parentIndex];
    if (node.sortIndex < parent.sortIndex) {
      heap[i] = parent;
      i = parentIndex;
    } else break;
  }
  heap[i] = node;
}

function siftDown(heap, i) {
  const length = heap.length;
  const node = heap[i];
  while (true) {
    let left = (i << 1) + 1;
    let right = left + 1;
    let smallest = i;

    if (left < length && heap[left].sortIndex < heap[smallest].sortIndex) {
      smallest = left;
    }
    if (right < length && heap[right].sortIndex < heap[smallest].sortIndex) {
      smallest = right;
    }

    if (smallest !== i) {
      heap[i] = heap[smallest];
      i = smallest;
    } else break;
  }
  heap[i] = node;
}

// ---------------------- 调度任务 ----------------------
let taskQueue = [];
let taskIdCounter = 1;

export function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const timeout = timeoutForPriority(priorityLevel);
  const expirationTime = currentTime + timeout;

  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime: currentTime,
    expirationTime,
    sortIndex: expirationTime,
  };

  push(taskQueue, newTask);
  requestHostCallback(flushWork);
  return newTask;
}

function timeoutForPriority(priority) {
  switch (priority) {
    case IMMEDIATE_PRIORITY: return -1;
    case USER_BLOCKING_PRIORITY: return 250;
    case NORMAL_PRIORITY: return 5000;
    case LOW_PRIORITY: return 10000;
    case IDLE_PRIORITY: return Infinity;
    default: return 5000;
  }
}
// ---------------------- 执行任务逻辑 ----------------------

// 是否正在执行调度循环（防止重复 postMessage）
let isMessageLoopRunning = false;

// 当前正在调度的任务执行函数
let scheduledHostCallback = null;

// 任务执行主函数（每帧空闲时调用）
function flushWork(hasTimeRemaining, initialTime) {
  // 获取当前帧的起始时间
  let currentTime = initialTime;

  // 计算该帧可用的结束时间点（当前时间 + 帧间隔）
  deadline = currentTime + yieldInterval;

  // 获取堆顶任务（最紧急）
  let currentTask = peek(taskQueue);

  while (currentTask !== null) {
    // 判断当前任务是否紧急 + 是否需要中断
    if (currentTask.expirationTime > currentTime && shouldYield()) {
      break; // 如果还没超时但已经快到帧末尾了 → 中断本帧执行
    }

    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      // 清空当前 task 的回调（准备执行）
      currentTask.callback = null;

      const didTimeout = currentTask.expirationTime <= currentTime;

      // 执行该任务的回调函数，传入是否超时
      const continuation = callback(didTimeout);

      if (typeof continuation === 'function') {
        // 如果返回的是 continuation 函数（未完成），下次继续调度执行
        currentTask.callback = continuation;
      } else {
        // 如果返回 null 或 undefined，说明任务执行完了，移出堆
        pop(taskQueue);
      }
    } else {
      // 回调不是函数，说明已取消，直接移除
      pop(taskQueue);
    }

    // 尝试获取下一个任务继续调度
    currentTask = peek(taskQueue);
    currentTime = getCurrentTime();
  }

  // 返回值：是否还有剩余任务需要继续执行（决定是否再次 postMessage）
  return taskQueue.length > 0;
}

// ---------------------- 消息通道调度 ----------------------

// 创建一个 MessageChannel，用于在主线程中调度微任务
const channel = new MessageChannel();

// 使用 port2 发送消息（生产者）
const port = channel.port2;

// port1 是接收消息的回调（消费者）
channel.port1.onmessage = () => {
  if (scheduledHostCallback) {
    // 当前时间（用于计算任务过期等）
    const currentTime = getCurrentTime();

    // 执行调度任务函数（flushWork）
    const hasMoreWork = scheduledHostCallback(true, currentTime);

    if (hasMoreWork) {
      // 如果还有任务没处理完 → 下一帧继续 postMessage 调度
      port.postMessage(null);
    } else {
      // 所有任务都处理完了 → 停止调度循环
      isMessageLoopRunning = false;
      scheduledHostCallback = null;
    }
  } else {
    // 没有回调任务 → 停止调度循环
    isMessageLoopRunning = false;
  }
};


// 注册新的调度任务（从 React 中调用）
function requestHostCallback(callback) {
  // 设置当前调度任务
  scheduledHostCallback = callback;

  // 如果当前没有在调度 → 启动消息循环（开始调度）
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null); // 通知 MessageChannel 执行 flushWork
  }
}
