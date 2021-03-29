export function createElement(type, attrs, ...children) {
  let e;
  // 判断是否为 「 原生标签 」
  if (typeof type === "string") {
    e = new ElementWrapper(type);
    // 设置属性
  } else {
    e = new type(attrs);
  }

  Object.entries(Object(attrs || {})).forEach(([key, value]) => {
    e.setAttribute(key, value);
  });

  // 添加子元素
  // 这里的 child 实际是指
  children.forEach((child) => {
    // 文本标签
    if (typeof child === "string") {
      child = new TextWrapper(child);
    }
    if (child === null) {
      return;
    }
    // 多子节点, 如 传入 this.props.children
    if (Array.isArray(child)) {
      for (const c of child) {
        e.appendChild(c);
      }
      // 单子节点
    } else {
      e.appendChild(child);
    }
  });
  return e;
}

const RENDER_TO_DOM = Symbol("render to dom");

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.props.children = [];

    this._root = null;
    this._range = null;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(component) {
    this.props.children.push(component);
  }

  get vdom() {
    return this.render().vdom
  }

  // 根据位置信息去 render DOM
  [RENDER_TO_DOM](range) {
    // 缓存range 以便于 之后比对
    this._range = range;

    // 递归
    const component = this.render()
    if (component) {
      component[RENDER_TO_DOM](range);
    }
  }

  // 重绘制逻辑
  rerender() {
    // ! 错误代码, render to dom 需要一个新 range
    // // this._range.deleteContents();
    // // this[RENDER_TO_DOM](this._range)

    let oldRange = this._range;

    // 此处需要做一个 rang 副本
    const range = document.createRange()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](range)
    
    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents()

  }

  // 从取单个元素 转变为 取一个范围
  // get root() {
  //   if (!this._root) {
  //     const nodes = this.render()
  //     // 递归操作
  //     this._root = nodes ? nodes.root : null
  //   }

  //   return this._root
  // }

  // 设置状态
  setState(newState) {
    // 短路逻辑 排除 state 为 null 的情况
    if (this.state !== null && typeof this.state !== 'object') {
      this.state = newState;
      this.rerender();
      return;
    }
    let merge = (oldState, newState) => {
      // Object.entries(newState).forEach(([key, value]) => {
      //   if (value !== null && typeof value !== 'object') {
      //     Reflect.set(oldState, key, value)
      //   } else {
      //     const oldValue = Reflect.get(oldState, key)
      //     merge(oldValue, value)
      //   }
      // })
      for (const key in newState) {
        const value = newState[key];
        if (typeof value !== 'object') {
          oldState[key] = value
        } else {
          // 数组处理时，newState 新成员需同步给 oldState
          if (!oldState[key]) {
            oldState[key] = value
          }
          const oldValue = oldState[key]
          merge(oldValue, value)
        }
      }
    }
    // 最终用法
    merge(this.state, newState)
    this.rerender()
  }

  // ! 子组件需要实现 render 方法
  render() {
    throw new Error('render function should be rewrite !')
  }
}

// 原生标签组件
class ElementWrapper extends Component {
  constructor(type) {
    // 调用super 使得其拥有 props 和 children
    super(type)
    this.root = document.createElement(type);

    this.type = type;

  }

  // // 存 this.props
  // setAttribute(name, value) {
  //   if (name.match(/^on([\s\S]+)$/)) {
  //     // 事件绑定
  //     const eventName = RegExp.$1;
  //     // 这里的value 其实是一个 callback, 确保驼峰
  //     this.root.addEventListener(eventName.replace(/^[\s\S]/, c => c.toLocaleLowerCase()), value)
  //   } else {
  //     // className 特殊处理
  //     if (name === 'className') {
  //       name = 'class';
  //     }
  //     // 属性绑定
  //     this.root.setAttribute(name, value)
  //   }
  // }

  
  // // 存 this.children
  // appendChild(component) {
  //   // 当 state值作为 child 传入时, 需判断子类型
  //   if (typeof component !== "object") {
  //     component = new TextWrapper(component);
  //   }
  //   // this.root.appendChild(component.root);
    
  //   let range = new Range();
  //   // 放置末尾
  //   range.setStart(this.root, this.root.childNodes.length);
  //   range.setEnd(this.root, this.root.childNodes.length)
    
  //   component[RENDER_TO_DOM](range)
  // }

  get vdom() {
    return {
      type: this.type,
      props: this.props,
      children: this.props.children.map(child => child.vdom)
    }
  }
  
  [RENDER_TO_DOM](range) {
    // 删除范围内的内容
    range.deleteContents();
    // 插入节点
    range.insertNode(this.root);
  }
}

// 文本标签组件
class TextWrapper extends Component {
  constructor(content) {
    // 调用super 使得其拥有 props 和 children
    super(content)
    this.content = content

    this.root = document.createTextNode(content);
  }

  get vdom() {
    return {
      type: 'text',
      content: this.content
    }
  }

  [RENDER_TO_DOM](range) {
    // 删除范围内的内容
    range.deleteContents();
    // 插入节点
    range.insertNode(this.root);
  }
}

export function render(component, parentElement) {
  let range = new Range();
  // 圈定 父元素 的内容
  range.setStart(parentElement, 0);
  // ! 这里不能用 children，而是用 childrenNodes 是因为要涵盖 注释节点 和 文本节点
  range.setEnd(parentElement, parentElement.childNodes.length);
  // 删除range 里的内容
  range.deleteContents();
  // 重新把内容渲染进去
  component[RENDER_TO_DOM](range);
}
