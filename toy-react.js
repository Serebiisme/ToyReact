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
    return this.render().vdom;
  }

  // get vchildren() {
  //   return this.props.children.map((child) => child.vdom);
  // }

  // 根据位置信息去 render DOM
  [RENDER_TO_DOM](range) {
    // 缓存range 以便于 之后比对
    this._range = range;

    // 缓存 vdom,
    this._vdom = this.vdom

    // 递归, 本质最后 component 为 一个 ElementWrapper
    const component = this._vdom;
    if (component) {
      component[RENDER_TO_DOM](range);
    }
  }

  // TODO 对比算法存在问题
  update() {
    let isSameNode = (oldNode, newNode) => {
      // 类型不一致
      if (oldNode.type !== newNode.type) {
        console.log('type')
        return false
      }
      // props 的 某个值不一致
      for (const name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          // if (name === 'children') {
          //   continue
          // }
          return false
        }
      }
      // props 的属性数量不一致
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props)) {
        console.log('length')

        return false
      }

      // 文本节点 内容不一致
      if (newNode.type === '#text') {
        if (newNode.content !== oldNode.content) {
          console.log('content')

          return false
        }
      }

      return true
    }

    /**
     * 新旧节点对比
     * 对比要素
     * 1、type
     * 2、props 可以通过打 patch 对比
     * 3、children
     * 4、#text 的 content
     */
    let update = (oldNode, newNode) => {
      // 全新渲染
      if (!isSameNode(oldNode, newNode)) {
        // 若不一致，则对 oldNode 做一个覆盖
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }

      newNode._range = oldNode._range

      // newNode的 children 「props.children」其实是 component
      let newChildren = newNode.vchildren
      let oldChildren = oldNode.vchildren

      if (!newChildren || newChildren.length) {
        return;
      }

     for (let i = 0; i < newChildren.length; i++) {
       const newChild = newChildren[i];
       const oldChild = oldChildren[i];

       let tailRange = oldChildren[oldChildren.length - 1]._range;


       if (i < oldChildren.length) {
         update(oldChild, newChild)
       } else {
         // 如果新的children数量，比old children的数量多，则需要执行插入

         // 新建一个range ,将 range 起始点指向 oldChildren 最后一个节点的位置
         let range = new Range();
         range.setState(tailRange.endContainer, tailRange.endOffset);
         range.setEnd(tailRange.endContainer, tailRange.endOffset);
         newChild[RENDER_TO_DOM](range);

         // 如果 newChildren 同 old Children 的子元素 数量差 不止 1，则需要校准 tailRange
         tailRange = range;
         
       }

       
     }

    }

    // 缓存最新 vdom
    let vdom = this.vdom
    // 更新 vdom
    update(this._vdom, vdom)
    // 更新替换旧 vdom 缓存
    this._vdom = vdom
  }

  // 重绘制逻辑, 在利用 vdom 之后 ，该代码退休，非重新渲染， 而是更新
  // rerender() {
  //   // ! 错误代码, render to dom 需要一个新 range
  //   // // this._range.deleteContents();
  //   // // this[RENDER_TO_DOM](this._range)

  //   let oldRange = this._range;

  //   // 此处需要做一个 rang 副本
  //   const range = document.createRange();
  //   range.setStart(oldRange.startContainer, oldRange.startOffset);
  //   range.setEnd(oldRange.startContainer, oldRange.startOffset);
  //   this[RENDER_TO_DOM](range);

  //   oldRange.setStart(range.endContainer, range.endOffset);
  //   oldRange.deleteContents();
  // }

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
    if (this.state !== null && typeof this.state !== "object") {
      this.state = newState;
      this.update();
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
        if (typeof value !== "object") {
          oldState[key] = value;
        } else {
          // 数组处理时，newState 新成员需同步给 oldState
          if (!oldState[key]) {
            oldState[key] = value;
          }
          const oldValue = oldState[key];
          merge(oldValue, value);
        }
      }
    };
    // 最终用法
    merge(this.state, newState);
    this.update();
  }

  // ! 子组件需要实现 render 方法
  render() {
    throw new Error("render function should be rewrite !");
  }
}

// 原生标签组件
class ElementWrapper extends Component {
  constructor(type) {
    // 调用super 使得其拥有 props 和 children
    super(type);
    // 基于 vdom 后 root 不需要了
    // this.root = document.createElement(type);

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
    // return {
    //   type: this.type,
    //   props: this.props,
    //   children: this.props.children.map(child => child.vdom)
    // }

    this.vchildren = this.props.children.map(child => child.vdom)

    return this;
  }

  [RENDER_TO_DOM](range) {
    // 缓存range 以便于 之后比对
    this._range = range;

    // // 删除范围内的内容
    // range.deleteContents();

    // 创建标签节点
    let root = document.createElement(this.type);

    // 处理 props , 给原生标签添加属性
    for (let name in this.props) {
      const value = this.props[name];

      if (name.match(/^on([\s\S]+)$/)) {
        // 事件绑定
        const eventName = RegExp.$1;
        // 这里的value 其实是一个 callback, 确保驼峰
        root.addEventListener(
          eventName.replace(/^[\s\S]/, (c) => c.toLocaleLowerCase()),
          value
        );
      } else {
        // className 特殊处理
        if (name === "className") {
          name = "class";
        }
        if (name === "children") {
          continue
        }
        // 属性绑定
        root.setAttribute(name, value);
      }
    }

    if (!this.vchildren) {
      this.vchildren = this.props.children.map(child => child.vdom)
    }

    // 处理 children
    // for (let child of this.props.children) {
    for (let child of this.vchildren) {
      // 当 state值作为 child 传入时, 需判断子类型
      if (typeof child !== "object") {
        child = new TextWrapper(child);
      }

      let range = new Range();
      // 放置末尾
      range.setStart(root, root.childNodes.length);
      range.setEnd(root, root.childNodes.length);

      child[RENDER_TO_DOM](range);
    }

    // // 插入节点
    // range.insertNode(root);

    replaceConent(range, root)
  }
}

// 文本标签组件
class TextWrapper extends Component {
  constructor(content) {
    // 调用super 使得其拥有 props 和 children
    super(content);
    this.content = content;

    this.type = "#text";

    // this.root = document.createTextNode(content);
  }

  get vdom() {
    // return {
    //   type: 'text',
    //   content: this.content
    // }

    return this;
  }

  [RENDER_TO_DOM](range) {
    // 缓存range 以便于 之后比对
    this._range = range;
  
    // // 删除范围内的内容
    // range.deleteContents();
    // // 插入节点
    // range.insertNode(this.root);

    let root = document.createTextNode(this.content);

    replaceConent(range, root)
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


function replaceConent(range, node) {
  // rang 之前插入 node
  range.insertNode(node);
  // 将插入起始指针移动至刚插入节点之后
  range.setStartAfter(node);
  // 删除内容
  range.deleteContents();

  // 校准 range
  range.setStartBefore(node);
  range.setEndAfter(node);
}