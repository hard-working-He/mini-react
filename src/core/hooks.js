
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;
let renderPhase = 'mount';

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
