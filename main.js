import { createElement, render, Component } from "./toy-react";
class MyComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      a: 1,
      b: 2,
    };
  }

  render() {
    return (
      <div>
        <h1>my Component</h1>
        <button onclick={() => {
          this.setState({
            a: this.state.a + 1
          })
        }}>add</button>
        <p>{this.state.a}</p>
        <p>{this.state.b}</p>
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
