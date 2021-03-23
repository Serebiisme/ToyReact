import { createElement, render, Component } from "./toy-react";
class MyComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      a: 11111122223333,
      b: 2,
    };
  }

  render() {
    return (
      <div>
        <h1>my Component</h1>
        <p>{this.state.a}</p>
        {this.props.children}
      </div>
    );
    // return null
  }
}

const app = (
  <MyComponent id="a" class="b">
    <div>123</div>
    <div>321</div>
    <p>
      <span>222</span>
      <span>232342342</span>
    </p>
  </MyComponent>
);

render(app, document.body);
