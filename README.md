# Mini-React 开发文档

## 项目简介
Mini-React 是一个用于学习和理解 React 核心原理的简化实现。本项目将实现 React 的核心功能，包括虚拟 DOM、Fiber 架构、函数组件、Hooks 等核心特性。

## 技术栈
- JavaScript
- Vite (构建工具)
- Jest (单元测试)

## 项目结构
```
mini-react/
├── src/
│   ├── core/           # React 核心实现
│   │   ├── createElement.js
│   │   ├── render.js
│   │   ├── reconciler.js
│   │   └── hooks.js
│   ├── runtime/        # 运行时相关
│   │   ├── fiber.js
│   │   └── scheduler.js
│   └── index.js        # 入口文件
├── examples/           # 示例代码
├──  tests/
│   ├── core/           # 核心模块测试
│   │   └── createElement.test.js
│   └── runtime/        # 运行时模块测试
│       └── fiber.test.js
└── package.json
```

## 核心功能实现

### 1. Virtual DOM
- 实现 `createElement` 函数
- 虚拟 DOM 树的构建 `render`

Fiber 架构相关函数：
createFiber(vdom, returnFiber) - 创建 Fiber 节点
beginWork(fiber) - 开始处理 Fiber 节点的工作
completeWork(fiber) - 完成 Fiber 节点的工作

调度器（Scheduler）相关函数：
scheduleWork(fiber, priority) - 调度工作单元
shouldYield() - 检查是否需要让出执行权
workLoop(deadline) - 工作循环的实现

协调器（Reconciler）相关函数：
reconcileChildren(fiber, elements) - 协调子节点
commitRoot(fiber) - 提交变更到真实 DOM

### 5. Hooks 实现
- useState
- useEffect
- useRef
- useMemo
- useCallback



## 开发指南

### 环境配置
1. 克隆项目
```bash
git clone 
cd mini-react
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

### 测试

# 运行所有测试
npm test

# 只运行核心模块测试
npm test tests/core

# 只运行运行时模块测试
npm test tests/runtime
```
