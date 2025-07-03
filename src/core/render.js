// render.js - Mini-React 渲染器实现

/**
 * 将虚拟 DOM 渲染到容器中
 * @param {Object} element - 虚拟 DOM 元素
 * @param {HTMLElement} container - DOM 容器
 */
function render(element, container) {
  // 创建根 fiber 节点
  const fiber = {
    type: container.nodeName.toLowerCase(),
    dom: container,
    props: {
      children: [element],
    },
  };
  
  // 初始化第一个工作单元
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

/**
 * 创建真实 DOM 元素
 * @param {Object} fiber - Fiber 节点
 * @returns {HTMLElement} 创建的 DOM 元素
 */
function createDOMElement(fiber) {
  const dom = 
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDOMProperties(dom, {}, fiber.props);
  return dom;
}

/**
 * 更新 DOM 属性
 * @param {HTMLElement} dom - DOM 元素
 * @param {Object} oldProps - 旧属性
 * @param {Object} newProps - 新属性
 */
function updateDOMProperties(dom, oldProps, newProps) {
  // 处理事件监听器
  const isEvent = key => key.startsWith('on');
  const isProperty = key => key !== 'children' && !isEvent(key);

  // 移除旧的事件监听器
  Object.keys(oldProps)
    .filter(isEvent)
    .filter(key => !(key in newProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, oldProps[name]);
    });

  // 移除旧的属性
  Object.keys(oldProps)
    .filter(isProperty)
    .filter(key => !(key in newProps))
    .forEach(name => {
      dom[name] = '';
    });

  // 设置新的属性
  Object.keys(newProps)
    .filter(isProperty)
    .forEach(name => {
      if (oldProps[name] !== newProps[name]) {
        if (name === 'style') {
          Object.assign(dom.style, newProps[name]);
        } else {
          dom[name] = newProps[name];
        }
      }
    });

  // 添加新的事件监听器
  Object.keys(newProps)
    .filter(isEvent)
    .filter(key => oldProps[key] !== newProps[key])
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, newProps[name]);
    });
}

// 下一个工作单元
let nextUnitOfWork = null;

// 导出函数
export { render, createDOMElement, updateDOMProperties };
