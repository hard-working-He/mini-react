# Virtual DOM 开发记录

## 1. 概述

Virtual DOM（虚拟 DOM）是 React 的核心概念之一，它是一个用 JavaScript 对象来表示真实 DOM 的轻量级抽象层。通过虚拟 DOM，我们可以以声明式的方式描述 UI，并让框架高效地处理实际的 DOM 操作。

## 2. 核心概念

### 2.1 虚拟 DOM 节点结构

```javascript
{
  type: string | function,  // 元素类型（标签名或组件函数）
  props: {                  // 属性对象
    children: Array,        // 子节点数组
    ...otherProps          // 其他属性
  }
}
```

### 2.2 工作流程

1. **创建**: 通过 `createElement` 函数创建虚拟 DOM 节点
2. **对比**: 通过 diff 算法比较新旧虚拟 DOM 树的差异
3. **更新**: 将差异应用到实际 DOM 上

## 3. 实现步骤

### 3.1 createElement 函数

`createElement` 是创建虚拟 DOM 的核心函数，它接收三个参数：
- type: 元素类型
- props: 属性对象
- children: 子元素

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
```

### 3.2 文本节点处理

为了统一处理，我们将文本内容也转换为虚拟 DOM 节点：

```javascript
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

## 4. 优化策略

### 4.1 批量更新

- 收集多次状态更新
- 在一次渲染周期内统一处理
- 减少不必要的 DOM 操作

### 4.2 懒渲染

- 采用深度优先的遍历策略
- 支持渲染中断和恢复
- 优先处理高优先级的更新

## 5. 注意事项

1. 保持虚拟 DOM 结构的不可变性
2. 合理处理事件绑定
3. 注意内存管理，避免内存泄漏
4. 处理好特殊属性（如 style、className 等）

## 6. 测试用例

```javascript
// 创建简单元素
const element = createElement('div', { id: 'test' },
  createElement('span', null, 'Hello'),
  createElement('span', null, 'World')
)

// 预期输出
{
  type: 'div',
  props: {
    id: 'test',
    children: [
      {
        type: 'span',
        props: {
          children: [{
            type: 'TEXT_ELEMENT',
            props: { nodeValue: 'Hello', children: [] }
          }]
        }
      },
      {
        type: 'span',
        props: {
          children: [{
            type: 'TEXT_ELEMENT',
            props: { nodeValue: 'World', children: [] }
          }]
        }
      }
    ]
  }
}
```

## 7. 后续优化方向

1. 实现组件生命周期
2. 添加事件系统
3. 优化 diff 算法
4. 实现异步渲染
5. 添加错误边界处理

## 8. 参考资源

- [React 官方文档](https://reactjs.org/docs/implementation-notes.html)
- [Build your own React](https://pomb.us/build-your-own-react/)
- [Virtual DOM 算法解析](https://github.com/livoras/blog/issues/13)
