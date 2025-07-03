# Virtual DOM 实现指南

## 1. createElement 实现
createElement 是构建虚拟 DOM 的基础，它将 JSX 转换为 JavaScript 对象。

### 1.1 基本结构
```javascript
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object' ? child : createTextElement(child)
      )
    }
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}
```

### 1.2 工作原理
1. **参数说明**
   - type: 元素类型（如 'div', 'span' 等）
   - props: 元素属性（如 className, style 等）
   - children: 子元素数组

2. **处理流程**
   - 处理基本属性
   - 转换文本节点为虚拟 DOM 节点
   - 递归处理子节点

3. **使用示例**
```javascript
// JSX
<div className="container">
  <h1>标题</h1>
  <p>内容</p>
</div>

// 转换后的虚拟 DOM
createElement('div', { className: 'container' },
  createElement('h1', null, '标题'),
  createElement('p', null, '内容')
)
```

## 2. Fiber Render 实现
Fiber 是 React 的新一代渲染架构，实现了可中断的渲染过程。

### 2.1 Fiber 节点结构
```javascript
{
  type: 'div',           // DOM 节点类型
  dom: domElement,       // 真实 DOM 节点
  props: {              // 节点属性
    children: []        // 子节点
  },
  parent: parentFiber,  // 父 Fiber 节点
  child: childFiber,    // 第一个子 Fiber 节点
  sibling: nextFiber,   // 下一个兄弟 Fiber 节点
}
```

### 2.2 渲染流程
1. **初始化渲染**
```javascript
function render(element, container) {
  // 创建根 Fiber 节点
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element]
    }
  }
}
```

2. **工作循环**
```javascript
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}
```

3. **处理工作单元**
```javascript
function performUnitOfWork(fiber) {
  // 1. 创建 DOM 节点
  if (!fiber.dom) {
    fiber.dom = createDOMElement(fiber);
  }

  // 2. 创建新的 Fiber 节点
  const elements = fiber.props.children;
  let prevSibling = null;

  elements.forEach((element, index) => {
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
  });

  // 3. 返回下一个工作单元
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}
```

### 2.3 Fiber 架构优势
1. **可中断渲染**
   - 将渲染工作分解为小单元
   - 可以暂停和恢复渲染
   - 不会阻塞主线程

2. **优先级控制**
   - 可以设置任务优先级
   - 高优先级任务可以打断低优先级任务
   - 提供更好的用户体验

3. **增量渲染**
   - 逐步构建 DOM 树
   - 支持时间切片
   - 平滑处理大量更新

## 3. 示例：完整渲染流程

```javascript
// 1. 创建虚拟 DOM
const element = createElement('div', { className: 'container' },
  createElement('h1', null, 'Hello'),
  createElement('p', null, 'World')
);

// 2. 开始渲染
render(element, document.getElementById('root'));

// 3. 启动工作循环
requestIdleCallback(workLoop);
```

## 4. 最佳实践

1. **性能优化**
   - 使用 key 属性优化列表更新
   - 避免不必要的渲染
   - 合理使用批量更新

2. **代码组织**
   - 保持组件的纯函数特性
   - 合理拆分组件
   - 使用合适的状态管理

3. **调试技巧**
   - 使用 React DevTools
   - 添加适当的日志
   - 理解 Fiber 树结构

## 5. 参考资源
- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [Build your own React](https://pomb.us/build-your-own-react/)
- [React 官方文档](https://reactjs.org/docs/implementation-notes.html)
