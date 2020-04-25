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

    this.state = { counter: 0 };
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

```tsx
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

    this.state = { counter: 0 };
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

## Functional Component

As much as possible we don't want to rely on type inference with functional components. It is recommended
to annotate the return type instead. Here we pass in props, that has the `AppProps` annotation, and
want to return a `JSX.Element`, so we add a return type annotation too:

```tsx
const App = (props: AppProps): JSX.Element => {
  ...
};
```

```tsx
const App = (props: AppProps): JSX.Element => {
  return <div>{props.color}</div>;
};

ReactDOM.render(<App color="red" />, document.querySelector("#root"));
```

## Redux Setup

```
➜  rrts git:(master) ✗ yarn add redux react-redux axios redux-thunk
```

Need to install type definitions as well:

```
yarn add @types/react-redux
```

Create scaffolding

```tsx
// index.tsx

import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { App } from "./components/App";
import { reducers } from "./reducers";

const store = createStore(reducers, applyMiddleware(thunk));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector("#root")
);
```

```ts
// reducers/index.ts

import { combineReducers } from "redux";

export const reducers = combineReducers({
  counter: () => 1,
});
```

```tsx
// components/App.tsx

import React from "react";

export class App extends React.Component {
  render() {
    return <div>Hi there</div>;
  }
}
```

## Action Creators with TypeScript

Let's use axios to make a get request to this url: `https://jsonplaceholder.typeicode.com/todos`.

We need to dispatch an action from an action creator. We are making a network request which means this
will be an async action creator. That means we have to make use of redux-thunk. So rather then returning
an action from this function, we return a function instead.

```ts
// actions/index.ts

import axios from "axios";

export const fetchTodos = () => {
  return () => {};
};
```

We are going to use `dispatch` and we need to use a type annotation for it!

```ts
import axios from "axios";
import { Dispatch } from "redux";

export const fetchTodos = () => {
  return (dispatch: Dispatch) => {};
};
```

By looking at the source code for redux, we see there's an interface for it:

```ts
/**
 * A *dispatching function* (or simply *dispatch function*) is a function that
 * accepts an action or an async action; it then may or may not dispatch one
 * or more actions to the store.
 *
 * We must distinguish between dispatching functions in general and the base
 * `dispatch` function provided by the store instance without any middleware.
 *
 * The base dispatch function *always* synchronously sends an action to the
 * store's reducer, along with the previous state returned by the store, to
 * calculate a new state. It expects actions to be plain objects ready to be
 * consumed by the reducer.
 *
 * Middleware wraps the base dispatch function. It allows the dispatch
 * function to handle async actions in addition to actions. Middleware may
 * transform, delay, ignore, or otherwise interpret actions or async actions
 * before passing them to the next middleware.
 *
 * @template A The type of things (actions or otherwise) which may be
 *   dispatched.
 */
export interface Dispatch<A extends Action = AnyAction> {
  <T extends A>(action: T): T;
}
```

So far it looks like JS, there's no type safety. E.g. we get a `response` but we have no idea of the
structure of the data returned to us. We also have a hard coded string `FETCH_TODOS` for the `type`.
Maybe an enum to store our action types?

Also the dispatch function is a generic function, so we have plenty of structure there if we investigate it
by hovering on it.

```ts
import axios from "axios";
import { Dispatch } from "redux";

const url = "https://jsonplaceholder.typeicode.com/todos";

export const fetchTodos = () => {
  return async (dispatch: Dispatch) => {
    const response = await axios.get(url);

    dispatch({
      type: "FETCH_TODOS",
      payload: response.data,
    });
  };
};
```

## Action Types Enum

We start with applying a type to the response data we get back from the api request by creating an interface
for a todo object.

`get` is also a generic function, so TS assumes we get back `any`. Let's help TS out:

```ts
const response = await axios.get<Todo[]>(url);
```

Create an enum for all the `type` we have in the application. `type` in redux means the type an action object has.

```ts
// actions/types.ts

export enum ActionTypes {
  fetchTodos,
}
```

This is the equivalent of

```ts
export enum ActionTypes {
  fetchTodos = "fetchtodos",
}
```

but we don't need to write it out with an enum.

So if we leave it off, TS will assign a number to it, starting with 0, so it assigns something unique for us. Helpful!

```ts
export enum ActionTypes {
  fetchTodos = 0,
  alsdf = 1,
  djgfd = 2,
}
```

Use it in the action:

```ts
import { ActionTypes } from "./types";

dispatch({
  type: ActionTypes.fetchTodos,
  payload: response.data,
});
```

```ts
import axios from "axios";
import { Dispatch } from "redux";
import { ActionTypes } from "./types";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const url = "https://jsonplaceholder.typeicode.com/todos";

export const fetchTodos = () => {
  return async (dispatch: Dispatch) => {
    const response = await axios.get<Todo[]>(url);

    dispatch({
      type: ActionTypes.fetchTodos,
      payload: response.data,
    });
  };
};
```

## The Generic Dispatch Function

An optional step, but recommended.

We are adding another interface to describe the action object in the dispatch function.

```ts
interface FetchTodosAction {
  type: ActionTypes.fetchTodos;
  payload: Todo[];
}

dispatch<FetchTodosAction>({
  type: ActionTypes.fetchTodos,
  payload: response.data,
});
```

After a time the action creators can get complex with lots of requests maybe or other logic inside.
Adding this type check to the dispatch will make sure that we are always passing in an object with the
correct types and properties.

```ts
import axios from "axios";
import { Dispatch } from "redux";
import { ActionTypes } from "./types";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

interface FetchTodosAction {
  type: ActionTypes.fetchTodos;
  payload: Todo[];
}

const url = "https://jsonplaceholder.typeicode.com/todos";

export const fetchTodos = () => {
  return async (dispatch: Dispatch) => {
    const response = await axios.get<Todo[]>(url);

    dispatch<FetchTodosAction>({
      type: ActionTypes.fetchTodos,
      payload: response.data,
    });
  };
};
```

## A Reducer with Enums

We export the interfaces from actions:

```ts
// actions/index.ts

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export interface FetchTodosAction {
  type: ActionTypes.fetchTodos;
  payload: Todo[];
}
```

And start using them in a reducer

```ts
// reducers/todos.ts

import { Todo } from "../actions";

export const todosReducer = (state: Todo[]) => {};
```

So here the default state is going to be of type Todo-array. This is only specifying the annotation of state,
we still need to provide some default value for it. To provide a default value for an argument at the same time
we do a type annotation, we just put the default value after it:

```ts
(state: Todo[] = [])
```

Next is adding the action, for which we defined the structure we expect in the `FetchTodosAction`:

```ts
import { Todo, FetchTodosAction } from "../actions";

export const todosReducer = (
  state: Todo[] = [],
  action: FetchTodosAction
) => {};
```

But this says this will be alwasy a FetchTodo action! It's not so reusable yet, we'll get back to it.

```ts
import { Todo, FetchTodosAction } from "../actions";
import { ActionTypes } from "../actions/types";

export const todosReducer = (state: Todo[] = [], action: FetchTodosAction) => {
  switch (action.type) {
    case ActionTypes.fetchTodos:
      return action.payload;
    default:
      return state;
  }
};
```

However our TS code is kiinda lying to us at this point in time. When redux boots up, it sends warming up
actions to the reducers. It sends a couple of action objects that has randomized types on them to test that
none of our reducers responds incorrectly to an action, and to get the initial default value of state (our
case its an empty []). So redux dispatches its own action, but at present we applied `FetchTodosAction`to our action,
which is somewhat incorrect. We are saying that this action will always be type of `FetchTodosAction`, but
that's not super accurate because redux will use different actions automatically by itself.
We handle those in our `switch case/default`.
