let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;
let renderPhase = 'mount';

// 当前 fiber 节点
let currentFiber = null;
// hooks 状态数组
let hookIndex = 0;

export const ReactCurrentDispatcher = {
  current: null,
};

export function renderWithHooks(fiber, Component, props) {
  currentlyRenderingFiber = fiber;
  workInProgressHook = null;
  currentHook = null;
  fiber.memoizedState = null;

  renderPhase = fiber.alternate === null ? 'mount' : 'update';

  ReactCurrentDispatcher.current =
    renderPhase === 'mount' ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;

  const children = Component(props);

  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  renderPhase = 'mount';

  return children;
}

function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = hook;
  } else {
    workInProgressHook.next = hook;
  }

  workInProgressHook = hook;
  return hook;
}

function updateWorkInProgressHook() {
  let nextCurrentHook = null;
  const current = currentlyRenderingFiber.alternate;

  if (currentHook === null) {
    nextCurrentHook = current ? current.memoizedState : null;
  } else {
    nextCurrentHook = currentHook.next;
  }

  const newHook = {
    memoizedState: nextCurrentHook.memoizedState,
    baseState: nextCurrentHook.baseState,
    baseQueue: nextCurrentHook.baseQueue,
    queue: nextCurrentHook.queue,
    next: null,
  };

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = newHook;
  } else {
    workInProgressHook.next = newHook;
  }

  currentHook = nextCurrentHook;
  workInProgressHook = newHook;

  return newHook;
}

function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  const queue = { pending: null };

  hook.memoizedState =
    typeof initialState === 'function' ? initialState() : initialState;
  hook.queue = queue;

  const dispatch = (action) => {
    const update = { action, next: null };
    const pending = queue.pending;
    if (pending === null) {
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }
    queue.pending = update;
    scheduleUpdateOnFiber(currentlyRenderingFiber);
  };

  queue.dispatch = dispatch;
  return [hook.memoizedState, dispatch];
}

function updateState() {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  let newState = hook.memoizedState;
  let update = queue.pending?.next;
  if (update) {
    do {
      const action = update.action;
      newState = typeof action === 'function' ? action(newState) : action;
      update = update.next;
    } while (update !== queue.pending.next);
  }

  hook.memoizedState = newState;
  queue.pending = null;
  return [newState, queue.dispatch];
}

const HooksDispatcherOnMount = {
  useState: mountState,
};

const HooksDispatcherOnUpdate = {
  useState: updateState,
};

function scheduleUpdateOnFiber(fiber) {
  // 简化调度，真实实现更复杂
  console.log('schedule update on fiber:', fiber);
}

// 设置当前 fiber
export function setCurrentFiber(fiber) {
  currentFiber = fiber;
  hookIndex = 0;
}

// useState Hook
export function useState(initialState) {
  const hooks = currentFiber.hooks || (currentFiber.hooks = []);
  const index = hookIndex++;

  // 如果 hook 已存在，返回存储的状态
  if (hooks[index]) {
    return hooks[index];
  }

  // 初始化 hook 状态
  const setState = (newState) => {
    const hook = hooks[index];
    // 处理函数式更新
    const nextState = typeof newState === 'function' ? newState(hook[0]) : newState;
    
    if (nextState !== hook[0]) {
      hook[0] = nextState;
      // 触发重新渲染
      scheduleUpdate(currentFiber);
    }
  };

  hooks[index] = [
    typeof initialState === 'function' ? initialState() : initialState,
    setState
  ];

  return hooks[index];
}

// useEffect Hook
export function useEffect(callback, deps) {
  const hooks = currentFiber.hooks || (currentFiber.hooks = []);
  const index = hookIndex++;

  // 检查依赖项是否改变
  const hasChanged = !hooks[index] ||
    !deps ||
    deps.some((dep, i) => dep !== hooks[index].deps[i]);

  if (hasChanged) {
    // 存储新的效果和依赖项
    hooks[index] = {
      deps,
      cleanup: () => {
        // 执行清理函数
        if (hooks[index].cleanup) {
          hooks[index].cleanup();
        }
        // 执行新的效果
        const cleanup = callback();
        if (typeof cleanup === 'function') {
          hooks[index].cleanup = cleanup;
        }
      }
    };

    // 在提交阶段执行效果
    scheduleEffect(hooks[index]);
  }
}

// useRef Hook
export function useRef(initialValue) {
  const hooks = currentFiber.hooks || (currentFiber.hooks = []);
  const index = hookIndex++;

  if (!hooks[index]) {
    hooks[index] = { current: initialValue };
  }

  return hooks[index];
}

// useMemo Hook
export function useMemo(factory, deps) {
  const hooks = currentFiber.hooks || (currentFiber.hooks = []);
  const index = hookIndex++;

  // 检查依赖项是否改变
  const hasChanged = !hooks[index] ||
    !deps ||
    deps.some((dep, i) => dep !== hooks[index].deps[i]);

  if (hasChanged) {
    hooks[index] = {
      deps,
      value: factory()
    };
  }

  return hooks[index].value;
}

// useCallback Hook
export function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}

// 用于调度更新的辅助函数
function scheduleUpdate(fiber) {
  // 在实际实现中，这里会触发 React 的调度机制
  // 标记需要更新的 fiber 节点
  fiber.needsUpdate = true;
  // 触发重新渲染
}

// 用于调度 effect 的辅助函数
function scheduleEffect(effect) {
  // 在实际实现中，这里会将 effect 添加到 effect 列表中
  // 在提交阶段执行
  queueMicrotask(() => {
    effect.cleanup();
  });
}
