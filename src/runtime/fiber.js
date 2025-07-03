// 从核心模块导入必要的函数
import { 
  createDOMElement,
  updateDOMProperties 
} from '../core/render.js';

// 从调度器导入函数
import { 
  scheduleWork,
  shouldYield 
} from './scheduler.js';

// fiber.js - Fiber 节点操作相关函数

/**
 * 创建 Fiber 节点
 * @param {Object} vdom - 虚拟 DOM 节点
 * @param {Object} returnFiber - 父 Fiber 节点
 * @returns {Object} 新创建的 Fiber 节点
 */
function createFiber(vdom, returnFiber) {
  return {
    // 基本属性
    type: vdom.type,
    key: vdom.props?.key,
    props: vdom.props,
    
    // DOM 相关
    dom: null,               // 对应的真实 DOM 节点
    
    // Fiber 连接
    return: returnFiber,     // 父节点
    child: null,             // 第一个子节点
    sibling: null,           // 下一个兄弟节点
    alternate: null,         // 上一次渲染的 fiber 节点
    
    // 副作用标记
    effectTag: 'PLACEMENT',  // 副作用类型：PLACEMENT, UPDATE, DELETION
    
    // 工作单元状态
    workInProgress: true,    // 是否正在工作中
    
    // 记录索引，用于优化列表更新
    index: 0
  };
}

/**
 * 开始处理 Fiber 节点的工作
 * React 的 beginWork 是 Fiber 升级的核心阶段之一。
 * 它会根据当前 Fiber 节点的类型，调用不同的更新函数，比如根节点调用 updateHostRoot，原生 DOM 节点调用 updateHostComponent。
 * 这些更新函数都会调用 reconcileChildren，负责对比新旧子节点，生成新的 Fiber 树结构。
 * 这个过程是构建本次更新的“工作单元”，然后 React 继续处理下一个 Fiber，最终完成整个树的更新。
 * @param {Object} fiber - 当前工作的 Fiber 节点
 * @returns {Object} 下一个工作单元
 */
function beginWork(fiber) {
  // 1. 根据 fiber 类型处理节点
  switch (fiber.type) {
    case 'function':
      // 处理函数组件
      return updateFunctionComponent(fiber);
    default:
      // 处理原生 DOM 节点
      return updateHostComponent(fiber);
  }
}

/**
 * 处理函数组件
 * @param {Object} fiber - 函数组件对应的 Fiber 节点
 * 每个 updateXXX 函数都会最终调用 reconcileChildren（对比并协调子节点）
 * beginWork 的返回值通常是下一个要处理的子 Fiber
 */
function updateFunctionComponent(fiber) {
  // 1. 准备 hooks 上下文
  const children = [fiber.type(fiber.props)];
  
  // 2. 协调子节点
  reconcileChildren(fiber, children);
  
  // 3. 返回子节点作为下一个工作单元
  return fiber.child;
}

/**
 * 处理原生 DOM 节点
 * @param {Object} fiber - DOM 节点对应的 Fiber 节点
 */
function updateHostComponent(fiber) {
  // 1. 如果没有 DOM 节点，创建它
  if (!fiber.dom) {
    fiber.dom = createDOMElement(fiber);
  }
  
  // 2. 协调子节点
  const children = fiber.props.children;
  reconcileChildren(fiber, children);
  
  // 3. 返回子节点作为下一个工作单元
  return fiber.child;
}

/**
 * 完成 Fiber 节点的工作
 * @param {Object} fiber - 当前完成的 Fiber 节点
 * @returns {Object} 下一个工作单元
 */
function completeWork(fiber) {
  // 1. 处理当前节点的副作用
  if (fiber.effectTag) {
    // 将当前节点加入副作用链表
    if (fiber.return) {
      if (!fiber.return.firstEffect) {
        fiber.return.firstEffect = fiber;
      }
      if (fiber.return.lastEffect) {
        fiber.return.lastEffect.nextEffect = fiber;
      }
      fiber.return.lastEffect = fiber;
    }
  }

  // 2. 寻找下一个工作单元
  if (fiber.sibling) {
    // 如果有兄弟节点，处理兄弟节点
    return fiber.sibling;
  }
  if (fiber.return) {
    // 如果有父节点，返回父节点
    return fiber.return;
  }
  // 如果既没有兄弟也没有父节点，说明完成了整个树的构建
  return null;
}

/**
 * 协调子节点（创建或更新子 Fiber 节点）
 * 它是 React 的 diff 算法入口

 * 接收三个参数：
 * 旧的 Fiber 树（current）
 * 新的虚拟 DOM（newChildren）
 * 渲染优先级（renderLanes）

 * 通过对比旧 Fiber 和新虚拟 DOM，决定：
 * 复用哪些 Fiber
 * 创建哪些新的 Fiber
 * 标记删除哪些 Fiber
 * 最终构建出本次更新后完整的 Fiber 树
 * @param {Object} fiber - 父 Fiber 节点
 * @param {Array} children - 子节点数组
 */
function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevSibling = null;
  let index = 0;

  while (index < children.length || oldFiber) {
    const child = children[index];
    let newFiber = null;

    // 比较新旧节点，决定如何更新
    const sameType = oldFiber && child && child.type === oldFiber.type;

    if (sameType) {
      // 更新节点
      newFiber = createFiber(child, fiber);
      newFiber.dom = oldFiber.dom;
      newFiber.alternate = oldFiber;
      newFiber.effectTag = 'UPDATE';
    } else {
      if (child) {
        // 创建新节点
        newFiber = createFiber(child, fiber);
        newFiber.effectTag = 'PLACEMENT';
      }
      if (oldFiber) {
        // 删除旧节点
        oldFiber.effectTag = 'DELETION';
        // 将旧节点加入删除队列
        deletions.push(oldFiber);
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // 设置 fiber 树的连接关系
    if (index === 0) {
      fiber.child = newFiber;
    } else if (prevSibling && newFiber) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

// 用于跟踪需要删除的节点
const deletions = [];

/**
 * 执行工作单元
 * @param {Object} fiber - 当前 fiber 节点
 * @returns {Object} 下一个工作单元
 */
function performUnitOfWork(unitOfWork) {
    const current = unitOfWork.alternate; // 旧的 Fiber（上次渲染的 Fiber）
    
    // 1. 开始处理当前 Fiber 的“工作”（比如计算新的子 Fiber）
    let next = beginWork(current, unitOfWork, subtreeRenderLanes);
  
    // 2. 如果 beginWork 返回 null，说明当前节点没有子节点或子节点处理完毕
    if (next === null) {
      // 需要完成当前 Fiber 的收尾工作
      completeUnitOfWork(unitOfWork);
    } else {
      // 继续处理子节点 Fiber
      workInProgress = next;
    }
  
    // 清理当前执行上下文
    ReactCurrentOwner.current = null;
  }
  function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;
  
    while (completedWork) {
      completeWork(completedWork);
  
      const parent = completedWork.parent;
  
      // 模拟 effectList 合并逻辑
      if (parent) {
        if (!parent.firstEffect) {
          parent.firstEffect = completedWork.firstEffect || (completedWork.flags ? completedWork : null);
        }
        if (completedWork.lastEffect) {
          if (parent.lastEffect) {
            parent.lastEffect.sibling = completedWork.firstEffect;
          }
          parent.lastEffect = completedWork.lastEffect;
        } else if (completedWork.flags) {
          // 当前节点自己有副作用，挂上去
          if (parent.lastEffect) {
            parent.lastEffect.sibling = completedWork;
          } else {
            parent.firstEffect = completedWork;
          }
          parent.lastEffect = completedWork;
        }
      }
  
      // 回溯上一个节点
      completedWork = completedWork.parent;
    }
  }
  
// 修改导出，添加 performUnitOfWork
export {
  createFiber,
  beginWork,
  completeWork,
  performUnitOfWork,
  deletions
};
