import { reconcileChildren, commitRoot } from '../../src/core/reconciler';

// Mock constants that might be needed
const Placement = 0x2;
const Deletion = 0x4;
const NoLanes = 0;
const PerformedWork = 1;

describe('reconcileChildren', () => {
  test('should handle simple element update with same key and type', () => {
    // Setup initial fiber
    const parentFiber = {
      alternate: {
        child: {
          key: 'test',
          type: 'div',
          props: { children: 'old' },
          sibling: null
        }
      }
    };

    // New children to reconcile
    const newChildren = [{
      key: 'test',
      type: 'div',
      props: { children: 'new' }
    }];

    // Perform reconciliation
    reconcileChildren(parentFiber, newChildren);

    // Assertions
    expect(parentFiber.child).toBeTruthy();
    expect(parentFiber.child.key).toBe('test');
    expect(parentFiber.child.type).toBe('div');
    expect(parentFiber.child.props.children).toBe('new');
  });

  test('should handle multiple children with reordering', () => {
    const parentFiber = {
      alternate: {
        child: {
          key: '1',
          type: 'div',
          props: { id: '1' },
          sibling: {
            key: '2',
            type: 'div',
            props: { id: '2' },
            sibling: null
          }
        }
      }
    };

    const newChildren = [
      { key: '2', type: 'div', props: { id: '2-new' } },
      { key: '1', type: 'div', props: { id: '1-new' } }
    ];

    reconcileChildren(parentFiber, newChildren);

    expect(parentFiber.child.key).toBe('2');
    expect(parentFiber.child.props.id).toBe('2-new');
    expect(parentFiber.child.sibling.key).toBe('1');
    expect(parentFiber.child.sibling.props.id).toBe('1-new');
  });

  test('should handle new element insertion', () => {
    const parentFiber = {
      alternate: {
        child: {
          key: '1',
          type: 'div',
          props: { id: '1' },
          sibling: null
        }
      }
    };

    const newChildren = [
      { key: '1', type: 'div', props: { id: '1' } },
      { key: '2', type: 'div', props: { id: '2' } }
    ];

    reconcileChildren(parentFiber, newChildren);

    expect(parentFiber.child.key).toBe('1');
    expect(parentFiber.child.sibling).toBeTruthy();
    expect(parentFiber.child.sibling.key).toBe('2');
    expect(parentFiber.child.sibling.flags).toBe(Placement);
  });

  test('should handle element deletion', () => {
    const parentFiber = {
      alternate: {
        child: {
          key: '1',
          type: 'div',
          props: { id: '1' },
          sibling: {
            key: '2',
            type: 'div',
            props: { id: '2' },
            sibling: null
          }
        }
      }
    };

    const newChildren = [
      { key: '1', type: 'div', props: { id: '1' } }
    ];

    reconcileChildren(parentFiber, newChildren);

    // The first child should remain
    expect(parentFiber.child.key).toBe('1');
    expect(parentFiber.child.props.id).toBe('1');
    
    // The second child should be marked for deletion
    const oldSecondChild = parentFiber.alternate.child.sibling;
    expect(oldSecondChild.flags).toBe(Deletion);
  });
});

describe('commitRoot', () => {
  test('should handle root with no effects', () => {
    const root = {
      current: {},
      finishedWork: {
        flags: 0,
        firstEffect: null,
        lastEffect: null
      },
      finishedLanes: 1,
      containerInfo: {}
    };

    const result = commitRoot(root);

    expect(result).toBeNull();
    expect(root.finishedWork).toBeNull();
    expect(root.finishedLanes).toBe(NoLanes);
  });

  test('should handle root with effects', () => {
    const effect1 = { nextEffect: null };
    const effect2 = { nextEffect: effect1 };

    const root = {
      current: {},
      finishedWork: {
        flags: PerformedWork + 1, // More than PerformedWork
        firstEffect: effect2,
        lastEffect: effect1
      },
      finishedLanes: 1,
      containerInfo: {}
    };

    const result = commitRoot(root);

    expect(result).toBeNull();
    expect(root.finishedWork).toBeNull();
    expect(root.finishedLanes).toBe(NoLanes);
  });
});