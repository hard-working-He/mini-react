const { createElement, createTextElement } = require('../src/core/createElement');

describe('createElement', () => {
  test('should create a div element with no props or children', () => {
    const element = createElement('div', null);
    expect(element).toEqual({
      type: 'div',
      props: {
        children: [],
      },
    });
  });

  test('should create an element with props', () => {
    const element = createElement('div', { id: 'test', className: 'container' });
    expect(element).toEqual({
      type: 'div',
      props: {
        id: 'test',
        className: 'container',
        children: [],
      },
    });
  });

  test('should create an element with children', () => {
    const child1 = createElement('span', null, 'Hello');
    const child2 = createElement('span', null, 'World');
    const element = createElement('div', null, child1, child2);
    
    expect(element).toEqual({
      type: 'div',
      props: {
        children: [
          {
            type: 'span',
            props: {
              children: [
                {
                  type: 'TEXT_ELEMENT',
                  props: {
                    nodeValue: 'Hello',
                    children: [],
                  },
                },
              ],
            },
          },
          {
            type: 'span',
            props: {
              children: [
                {
                  type: 'TEXT_ELEMENT',
                  props: {
                    nodeValue: 'World',
                    children: [],
                  },
                },
              ],
            },
          },
        ],
      },
    });
  });

  test('should handle text and number children', () => {
    const element = createElement('div', null, 'Hello', 42);
    expect(element).toEqual({
      type: 'div',
      props: {
        children: [
          {
            type: 'TEXT_ELEMENT',
            props: {
              nodeValue: 'Hello',
              children: [],
            },
          },
          {
            type: 'TEXT_ELEMENT',
            props: {
              nodeValue: 42,
              children: [],
            },
          },
        ],
      },
    });
  });

  test('should filter out null and undefined children', () => {
    const element = createElement('div', null, 'Hello', null, undefined, 'World');
    expect(element.props.children.length).toBe(2);
    expect(element.props.children[0].props.nodeValue).toBe('Hello');
    expect(element.props.children[1].props.nodeValue).toBe('World');
  });
});

describe('createTextElement', () => {
  test('should create a text element', () => {
    const element = createTextElement('Hello');
    expect(element).toEqual({
      type: 'TEXT_ELEMENT',
      props: {
        nodeValue: 'Hello',
        children: [],
      },
    });
  });
}); 