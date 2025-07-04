function reconcileChildren(parentFiber, newChildren) {
    // 1. 标准化成数组（方便统一处理）
    const isArray = Array.isArray(newChildren);
    const elements = isArray ? newChildren : [newChildren];
  
    // 2. 记录旧 fiber 链表的头节点
    let oldFiber = parentFiber.alternate ? parentFiber.alternate.child : null;
  
    // 3. 第一轮遍历：位置对齐尝试复用
    let prevNewFiber = null;
    let resultingFirstChild = null;
    let oldFiberPointer = oldFiber;
    let i = 0;
  
    for (; i < elements.length && oldFiberPointer != null; i++) {
      const element = elements[i];
  
      if (element == null) continue;
  
      let newFiber = null;
  
      // 尝试复用
      if (
        oldFiberPointer.key === element.key &&
        oldFiberPointer.type === element.type
      ) {
        // 可复用：用旧 fiber 克隆成新 fiber
        newFiber = {
          ...oldFiberPointer,
          props: element.props,
          alternate: oldFiberPointer,
          flags: 0,
          index: i,
          key: element.key,
          return: parentFiber,
        };
      } else {
        // 不可复用：中断第一轮，进入第二轮处理
        break;
      }
  
      if (prevNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        prevNewFiber.sibling = newFiber;
      }
  
      prevNewFiber = newFiber;
      oldFiberPointer = oldFiberPointer.sibling;
    }
  
    // 如果全部完成了，说明只是顺序更新，没有插入/删除
    if (i === elements.length && oldFiberPointer === null) {
      parentFiber.child = resultingFirstChild;
      return;
    }
  
    // ----------------- 第二轮：处理插入 / 删除 / 移动 -----------------
    const existingChildrenMap = new Map();
  
    while (oldFiberPointer != null) {
      if (oldFiberPointer.key != null) {
        existingChildrenMap.set(oldFiberPointer.key, oldFiberPointer);
      } else {
        existingChildrenMap.set(oldFiberPointer.index, oldFiberPointer);
      }
      oldFiberPointer = oldFiberPointer.sibling;
    }
  
    // 重置生成新 fiber 的逻辑
    let lastPlacedIndex = 0;
    let newIndex = i;
    prevNewFiber = null;
  
    for (; newIndex < elements.length; newIndex++) {
      const element = elements[newIndex];
      if (element == null) continue;
  
      let matchedOldFiber = null;
  
      if (element.key != null) {
        matchedOldFiber = existingChildrenMap.get(element.key);
        existingChildrenMap.delete(element.key);
      } else {
        matchedOldFiber = existingChildrenMap.get(newIndex);
        existingChildrenMap.delete(newIndex);
      }
  
      let newFiber = null;
  
      if (
        matchedOldFiber != null &&
        matchedOldFiber.type === element.type
      ) {
        // 可复用
        newFiber = {
          ...matchedOldFiber,
          props: element.props,
          alternate: matchedOldFiber,
          flags: 0,
          index: newIndex,
          return: parentFiber,
        };
      } else {
        // 创建新 fiber
        newFiber = {
          type: element.type,
          key: element.key,
          props: element.props,
          sibling: null,
          child: null,
          alternate: null,
          flags: Placement,
          index: newIndex,
          return: parentFiber,
        };
      }
  
      if (prevNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        prevNewFiber.sibling = newFiber;
      }
  
      prevNewFiber = newFiber;
    }
  
    // 所有没被复用的旧 fiber 都是要删除的
    existingChildrenMap.forEach((child) => {
      child.flags = Deletion;
      // 可以 push 到一个 parentFiber.deletions = [] 队列中
    });
  
    parentFiber.child = resultingFirstChild;
  }
  
  function commitRoot(root) {
    const previousUpdateLanePriority = getCurrentUpdatePriority();
    try {
      const renderPriorityLevel = getCurrentPriorityLevel();
      return commitRootImpl(root, renderPriorityLevel);
    } finally {
      setCurrentUpdatePriority(previousUpdateLanePriority);
    }
  }
  function commitRootImpl(root, renderPriorityLevel) {
    // 0. 变量初始化
    const finishedWork = root.finishedWork;
    const lanes = root.finishedLanes;
    root.finishedWork = null;
    root.finishedLanes = NoLanes;
  
    const isDev = __DEV__;
    let firstEffect;
  
    // 1. 获取 effectList 链表
    if (finishedWork.flags > PerformedWork) {
      if (finishedWork.lastEffect !== null) {
        // 链上 root 本身
        finishedWork.lastEffect.nextEffect = finishedWork;
        firstEffect = finishedWork.firstEffect;
      } else {
        firstEffect = finishedWork;
      }
    } else {
      // 没有 root 自身副作用
      firstEffect = finishedWork.firstEffect;
    }
  
    // 2. commit 前准备
    // 处理 passive effects（useEffect）、执行 before mutation（如 getSnapshotBeforeUpdate）
    prepareForCommit(root.containerInfo);
    ReactCurrentOwner.current = null;
    // Fiber 树交换：切换 current -> finishedWork
    root.current = finishedWork;
  
    // 3. 如果有副作用链，执行三轮提交流程
    if (firstEffect !== null) {
      nextEffect = firstEffect;
  
      // 3.1 before mutation phase（如 getSnapshotBeforeUpdate、清除旧 ref）
      do {
        commitBeforeMutationEffects();
      } while (nextEffect !== null);
  
      // 3.2 mutation phase（插入、更新、删除 DOM、ref detach）
      nextEffect = firstEffect;
      do {
        commitMutationEffects(root, renderPriorityLevel);
      } while (nextEffect !== null);
  
      // 3.3 layout phase（如 componentDidMount、ref attach、useLayoutEffect）
      nextEffect = firstEffect;
      do {
        commitLayoutEffects(root, lanes);
      } while (nextEffect !== null);
  
      // 清空指针
      nextEffect = null;
    } else {
      // 没有副作用，直接切换 Fiber 树
      root.current = finishedWork;
    }
  
    // 4. 提交完成后的处理
    // 包括执行 useEffect、清理 effect、触发 callback（如 setState 第二参数）
    ensureRootIsScheduled(root);
    flushPassiveEffects();
  
    return null;
  }



  export {
    reconcileChildren,
    commitRoot
  }