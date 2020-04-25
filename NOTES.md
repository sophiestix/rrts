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

## Confusing Component State!

Some unexpected behaviour comes when we initialize state with es2015:
```tsx
import React from "react";
import ReactDOM from "react-dom";

interface AppProps {
  color?: string;
}

class App extends React.Component<AppProps> {
  constructor(props: AppProps) {
    super(props);

    this.state = { counter: 0};
  }

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

will result in when we hover on `this.state.counter`: 

```
Property 'counter' does not exist on type 'Readonly<{}>'.ts(2339)
```

By looking at the base code for `React.Component`, we are missing the second generic `S` argument:
```
 // Base component for plain JS classes
    // tslint:disable-next-line:no-empty-interface
    interface Component<P = {}, S = {}, SS = any> extends ComponentLifecycle<P, S, SS> { }
    class Component<P, S> {
      ....


and:
        
readonly props: Readonly<P> & Readonly<{ children?: ReactNode }>;
state: Readonly<S>;
```

So before when we used the `state = { counter: 0}` syntax like this:
```tsx
class App extends React.Component<AppProps> {
  state = { counter: 0 };
```

We overwrote or redefined the `state: Readonly<S>;` in the original class `React.Component` we were 
`extending` on in our subclass App. So that's why it worked.

But when we have it in a `constructor`, `this.state` is understood by TS to be the empty object: `state: Readonly<S>;`.
In this case we are not trying to define or override this property, we are trying to re-sign a new value to it.

In the world of JS, this two would be the same and would behave the same, but not in the world of TS!
They are two very different statements and will have two very different impacts.

(TODO: ask for guidelines from the team)

Let's pass in `AppState` interface then:

```tsx
import React from "react";
import ReactDOM from "react-dom";

interface AppProps {
  color?: string;
}

interface AppState {
  counter: number;
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    this.state = { counter: 0};
  }

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

If we would mix the two, so pass in `AppState` and overwrite `state={counter: 0}` at the same time, 
we would not be using the interface, it would be the property we provide in the `state={counter: 0}`. 
Test it with changing `counter` to `number`:
```tsx
interface AppState {
  counter: number;
}

class App extends React.Component<AppProps, AppState> {
  state = { number: 0};
  constructor(props: AppProps) {
    super(props);

    this.state = { counter: 0};
  }
```

```
Property 'state' in type 'App' is not assignable to the same property in base type 'Component<AppProps, AppState, any>'.
  Property 'counter' is missing in type '{ number: number; }' but required in type 'Readonly<AppState>'.ts(2416)
```

DON'T MIX THEM! 

