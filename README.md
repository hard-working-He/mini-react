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
├── tests/             # 测试用例
└── package.json
```

## 核心功能实现

### 1. Virtual DOM
- 实现 `createElement` 函数
- JSX 转换支持
- 虚拟 DOM 树的构建

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
diffProperties(domElement, oldProps, newProps) - 属性差异比较
commitWork(fiber) - 提交变更到真实 DOM

### 5. Hooks 实现
- useState
- useEffect
- useRef
- useMemo
- useCallback


fiber.js（待实现）:
createFiber(type, props, key) - 创建 Fiber 节点
cloneFiber(current, pendingProps) - 克隆 Fiber 节点
scheduler.js（待实现）:
scheduleWork(fiber) - 调度工作
workLoop(deadline) - 工作循环
performUnitOfWork(fiber) - 执行工作单元


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
运行单元测试：
```bash
npm test
```

运行特定测试：
```bash
npm test -- -t "test name"
```

## 实现步骤

### 第一阶段：基础渲染
1. 实现 createElement 函数
2. 实现基础的 render 函数
3. 支持基本的 DOM 操作

### 第二阶段：Fiber 架构
1. 实现 Fiber 节点结构
2. 构建 Fiber 树
3. 实现工作循环

### 第三阶段：组件和 Hooks
1. 实现函数组件
2. 实现基础 Hooks
3. 处理组件更新

### 第四阶段：调度和优化
1. 实现任务调度
2. 添加优先级系统
3. 优化渲染性能

## 贡献指南
1. Fork 本仓库
2. 创建特性分支
3. 提交变更
4. 发起 Pull Request

## 注意事项
- 保持代码简洁清晰
- 编写完整的单元测试
- 添加必要的注释

## 参考资料
- [React 官方文档](https://reactjs.org/docs/getting-started.html)
- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [Build your own React](https://pomb.us/build-your-own-react/)

## 许可证
MIT License
