import { createElement, render, Component } from "./toy-react";
class MyComponent extends Component {
  render() {
    return <div>
      <h1>my Component</h1>
      {this.props.children}
    </div>;
  }
}

const app = (
  <MyComponent id="a" class="b">
    <div>123</div>
    <div>321</div>
    <p>
      <span>222</span>
      <span>3233</span>
    </p>
  </MyComponent>
);

render(app, document.body);
