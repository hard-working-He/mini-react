// scheduler.js - 调度器实现

import { performUnitOfWork } from './fiber.js';

/**
 * 任务优先级定义
 */
export const PriorityLevels = {
  IMMEDIATE: 1,    // 立即执行
  HIGH: 2,         // 高优先级
  NORMAL: 3,       // 普通优先级
  LOW: 4,          // 低优先级
  IDLE: 5          // 空闲时执行
};

// 当前工作单元
let nextUnitOfWork = null;
// 当前正在进行的工作
let currentWork = null;
// 是否有待处理的工作
let isWorking = false;

/**
 * 调度工作单元
 * @param {Object} fiber - 需要调度的 Fiber 节点
 * @param {number} priority - 优先级（可选）
 */
export function scheduleWork(fiber, priority = PriorityLevels.NORMAL) {
  const newWork = {
    fiber,
    priority,
    expirationTime: getExpirationTime(priority),
    next: null
  };

  // 将新工作添加到工作队列
  if (!currentWork) {
    currentWork = newWork;
  } else {
    // 根据优先级插入到合适的位置
    let temp = currentWork;
    while (temp.next && temp.next.priority <= priority) {
      temp = temp.next;
    }
    newWork.next = temp.next;
    temp.next = newWork;
  }

  // 如果当前没有工作在进行，启动工作循环
  if (!isWorking) {
    isWorking = true;
    nextUnitOfWork = currentWork.fiber;
    requestIdleCallback(workLoop);
  }
}

/**
 * 检查是否需要让出执行权
 * @returns {boolean} 是否需要让出执行权
 */
export function shouldYield() {
  // TODO: 实现更复杂的让出策略
  // 1. 检查是否有更高优先级的工作
  // 2. 检查当前时间片是否用完
  // 3. 检查是否有用户交互需要处理
  return false; // 临时返回 false，后续完善
}

/**
 * 获取过期时间
 * @param {number} priority - 优先级
 * @returns {number} 过期时间戳
 */
function getExpirationTime(priority) {
  const EXPIRATION_TIME_MS = {
    [PriorityLevels.IMMEDIATE]: 0,
    [PriorityLevels.HIGH]: 100,
    [PriorityLevels.NORMAL]: 500,
    [PriorityLevels.LOW]: 2000,
    [PriorityLevels.IDLE]: 5000
  };

  return Date.now() + EXPIRATION_TIME_MS[priority];
}

/**
 * 工作循环
 * @param {IdleDeadline} deadline - 空闲期限对象
 */
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  if (nextUnitOfWork) {
    // 如果还有工作要做，继续请求下一个时间片
    requestIdleCallback(workLoop);
  } else {
    // 完成当前工作
    isWorking = false;
    currentWork = currentWork.next;
    if (currentWork) {
      // 如果还有其他工作，继续调度
      scheduleWork(currentWork.fiber, currentWork.priority);
    }
  }
}

// 导出工作循环相关函数
export {
  workLoop,
  scheduleWork,
  shouldYield,
  PriorityLevels
};
