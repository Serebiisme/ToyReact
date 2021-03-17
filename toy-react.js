export function createElement(type, attrs, ...children) {
  let e;
  if (typeof type === 'string') {
    e = new ElementWrapper(type)
  } else {
    e = new type()
  }

  Object.entries(Object(attrs || {})).forEach(([key, value]) => {
    e.setAttribute(key, value)
  })
  children.forEach(child => {
    console.log(child)
    if (typeof child === 'string') {
      child = new TextWrapper(child)
    }
    if (Array.isArray(child)) {
      for (const c of child) {
        e.appendChild(c)
      }
    } else {
      e.appendChild(child)
    }
  })
  return e
}

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)

  }

  setAttribute(name, value) {
    this.root.setAttribute(name, value)
  }

  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.props.children = []
    this._root = null;
  }

  setAttribute(name, value) {
    this.props[name] = value

  }

  appendChild(component) {
    this.props.children.push(component)
  }

  get root() {
    if (!this._root) {
      // 递归操作
      this._root = this.render().root
    }

    return this._root
  }
}

export function render(component, parentElement) {
  parentElement.appendChild(component.root)
}