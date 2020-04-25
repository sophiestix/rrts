# Notes

## Create-react-app & Simple Components

```tsx
import React from "react";
import ReactDOM from "react-dom";

class App extends React.Component {
  render() {
    return <div>Hi there</div>;
  }
}

ReactDOM.render(<App />, document.querySelector("#root"));
```

## Interfaces with Props

```tsx
import React from "react";
import ReactDOM from "react-dom";

interface AppProps {
  color?: string;
}

class App extends React.Component<AppProps> {
  render() {
    return <div>{this.props.color}</div>;
  }
}

ReactDOM.render(<App color="red" />, document.querySelector("#root"));
```

## Handling Component State

```tsx
import React from "react";
import ReactDOM from "react-dom";

interface AppProps {
  color?: string;
}

class App extends React.Component<AppProps> {
  state = { counter: 0 };

  onIncrement = (): void => {
    this.setState({ counter: this.state.counter + 1 });
  };

  onDecrement = (): void => {
    this.setState({ counter: this.state.counter - 1 });
  };

  render() {
    return (
      <div>
        <button onClick={this.onIncrement}>Increment</button>
        <button onClick={this.onDecrement}>Decrement</button>
        {this.state.counter}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector("#root"));
```


