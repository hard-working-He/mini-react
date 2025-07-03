/**
 * 创建虚拟 DOM 元素
 * @param {string|function} type - 元素类型（标签名或组件函数）
 * @param {object|null} props - 元素属性
 * @param {...any} children - 子元素
 * @returns {object} 虚拟 DOM 节点
 */
function createElement(type, props, ...children) {
  // 处理 props 为 null 的情况
  props = props || {};

  // 处理子元素
  const processedChildren = children.map(child => {
    // 处理原始类型（字符串、数字等）
    if (typeof child === 'string' || typeof child === 'number') {
      return {
        type: 'TEXT_ELEMENT',
        props: {
          nodeValue: child,
          children: [],
        },
      };
    }
    return child;
  }).filter(child => child != null); // 过滤掉 null 和 undefined

  // 返回虚拟 DOM 节点
  return {
    type,
    props: {
      ...props,
      children: processedChildren,
    },
  };
}

// 创建文本元素的辅助函数
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

module.exports = {
  createElement,
  createTextElement,
};
