import {
  createFiber,
  beginWork,
  completeWork,
  performUnitOfWork
} from '../../src/runtime/fiber';

describe('Fiber Node Creation', () => {
  test('createFiber should create a fiber node with correct structure', () => {
    const vdom = {
      type: 'div',
      props: { id: 'test', children: [] }
    };
    const parentFiber = { type: 'div', dom: document.createElement('div') };

    const fiber = createFiber(vdom, parentFiber);

    expect(fiber).toEqual(expect.objectContaining({
      type: 'div',
      props: { id: 'test', children: [] },
      dom: null,
      return: parentFiber,
      child: null,
      sibling: null,
      alternate: null,
      effectTag: 'PLACEMENT',
      workInProgress: true
    }));
  });

  test('createFiber should handle text elements', () => {
    const vdom = {
      type: 'TEXT_ELEMENT',
      props: { nodeValue: 'Hello', children: [] }
    };

    const fiber = createFiber(vdom, null);

    expect(fiber.type).toBe('TEXT_ELEMENT');
    expect(fiber.props.nodeValue).toBe('Hello');
  });
});

describe('Begin Work Phase', () => {
  test('beginWork should process function components', () => {
    const FunctionComponent = (props) => ({
      type: 'div',
      props: { children: [] }
    });

    const fiber = {
      type: FunctionComponent,
      props: { name: 'test' }
    };

    const result = beginWork(null, fiber);
    expect(result).toBeDefined();
  });

  test('beginWork should process host components', () => {
    const fiber = {
      type: 'div',
      props: { children: [] }
    };

    const result = beginWork(null, fiber);
    expect(result).toBeDefined();
  });
});

describe('Complete Work Phase', () => {
  test('completeWork should handle effect tags', () => {
    const fiber = {
      type: 'div',
      effectTag: 'PLACEMENT',
      flags: 'PLACEMENT',
      return: {
        type: 'div',
        dom: document.createElement('div')
      }
    };

    completeWork(fiber);

    expect(fiber.return.firstEffect).toBeDefined();
  });

  test('completeWork should build effect list', () => {
    const parent = {
      type: 'div',
      dom: document.createElement('div')
    };

    const child1 = {
      type: 'span',
      flags: 'UPDATE',
      return: parent
    };

    const child2 = {
      type: 'span',
      flags: 'PLACEMENT',
      return: parent
    };

    completeWork(child1);
    completeWork(child2);

    expect(parent.firstEffect).toBeDefined();
    expect(parent.lastEffect).toBeDefined();
  });
});

describe('Perform Unit of Work', () => {
  test('performUnitOfWork should process fiber and return next unit', () => {
    const fiber = {
      type: 'div',
      props: {
        children: [
          { type: 'span', props: { children: [] } }
        ]
      },
      alternate: null
    };

    const result = performUnitOfWork(fiber);
    expect(result).toBeDefined();
  });

  test('performUnitOfWork should handle completion when no children', () => {
    const fiber = {
      type: 'div',
      props: { children: [] },
      alternate: null
    };

    const result = performUnitOfWork(fiber);
    expect(result).toBeNull();
  });
});

describe('Reconciliation', () => {
  test('should handle new elements', () => {
    const parentFiber = {
      type: 'div',
      props: {
        children: [
          { type: 'span', props: { children: [] } }
        ]
      }
    };

    performUnitOfWork(parentFiber);
    expect(parentFiber.child).toBeDefined();
    expect(parentFiber.child.type).toBe('span');
  });

  test('should handle element updates', () => {
    const oldFiber = {
      type: 'div',
      props: { id: 'old' },
      alternate: null
    };

    const newFiber = {
      type: 'div',
      props: { id: 'new' },
      alternate: oldFiber
    };

    performUnitOfWork(newFiber);
    expect(newFiber.effectTag).toBe('UPDATE');
  });

  test('should handle element deletion', () => {
    const parentFiber = {
      type: 'div',
      props: { children: [] },
      alternate: {
        child: {
          type: 'span',
          props: { children: [] }
        }
      }
    };

    performUnitOfWork(parentFiber);
    // Check if old child is marked for deletion
    expect(parentFiber.alternate.child.effectTag).toBe('DELETION');
  });
});

describe('Effect List Building', () => {
  test('should build effect list in correct order', () => {
    const root = {
      type: 'div',
      props: {
        children: [
          { type: 'span', props: { children: [] } },
          { type: 'p', props: { children: [] } }
        ]
      }
    };

    performUnitOfWork(root);

    // Verify effect list is built correctly
    let node = root.firstEffect;
    const effects = [];
    while (node) {
      effects.push(node);
      node = node.sibling;
    }

    expect(effects.length).toBeGreaterThan(0);
  });
});

// Mock functions and setup
beforeEach(() => {
  // Reset any mocked functions or global state
  jest.clearAllMocks();
});

// Helper functions for testing
function createTestFiber(type, props = {}, children = []) {
  return {
    type,
    props: {
      ...props,
      children
    },
    dom: null,
    return: null,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: null
  };
} 