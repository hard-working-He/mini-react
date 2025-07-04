// ========= 全局状态模拟 =========
let currentlyRenderingFiber = null;
let lastContextDependency = null;

// ========= 工具函数 =========
function createFiber(name) {
  return {
    name,
    dependencies: null,
    lanes: 0,
    childLanes: 0,
    alternate: null,
    return: null,
    child: null,
  };
}

// ========= createContext =========
function createContext(defaultValue) {
  const context = {
    _currentValue: defaultValue,
    _subscribers: new Set(),
  };

  context.Provider = function Provider({ value, children }) {
    if (value !== context._currentValue) {
      const oldValue = context._currentValue;
      context._currentValue = value;
      propagateContextChange(context);
    }
    return children;
  };

  return context;
}

// ========= prepareToReadContext =========
function prepareToReadContext(workInProgress) {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;

  const dependencies = workInProgress.dependencies;
  if (dependencies !== null) {
    dependencies.firstContext = null;
  }
}

// ========= readContext =========
function readContext(context) {
  const dependency = {
    context,
    next: null,
  };

  if (lastContextDependency === null) {
    lastContextDependency = dependency;
    currentlyRenderingFiber.dependencies = {
      firstContext: dependency,
    };
  } else {
    lastContextDependency = lastContextDependency.next = dependency;
  }

  return context._currentValue;
}

// ========= 消费 useContext =========
function useContext(context) {
  return readContext(context);
}

// ========= 更新传播 propagateContextChange =========
function propagateContextChange(context) {
  context._subscribers.forEach((fiber) => {
    console.log(`Context changed, scheduling update for: ${fiber.name}`);
    fiber.lanes = 1; // 模拟标记更新
    scheduleWorkOnParentPath(fiber.return);
  });
}

// ========= 向上通知 scheduleWorkOnParentPath =========
function scheduleWorkOnParentPath(parent) {
  let node = parent;
  while (node !== null) {
    node.childLanes = 1;
    console.log(`Marking parent ${node.name} has child updates`);
    node = node.return;
  }
}

// ========= 模拟组件执行 =========
function renderWithContext(fn, fiber) {
  prepareToReadContext(fiber);
  return fn();
}

export {
  createContext,
  useContext,
  renderWithContext
}