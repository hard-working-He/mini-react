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

### 2. Fiber 架构
- Fiber 节点结构
- 工作单元（Work Unit）
- 双缓存树

### 3. 调度器（Scheduler）
- 任务优先级
- 时间切片
- 可中断渲染

### 4. 协调器（Reconciler）
- Diff 算法
- 节点更新
- 副作用收集

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
