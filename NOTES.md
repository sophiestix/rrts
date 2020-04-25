# Notes

```
use node v10.13.0
```

## Table of Contents

- Create-react-app & Simple Components
- Interfaces with Props
- Handling Component State
- Confusing Component State!
- Functional Component
- Redux Setup
- Action Creators with TypeScript
- Action Types Enum
- The Generic Dispatch Function
- A Reducer with Enums
- Validating Store Structure
- Connecting a Component to Redux
- Rendering a List
- Adding in Delete Functionality
- Breaking out Action Creators
- Expressing Actions as Type Union
- Type Guards in Reducers
- Wiring up deleteTodo Action
- Again, Type Definition Files
- Tracking Loading with Component State
- App Wrapup

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

We overwrote or redefined the `state: Readonly<S>;` in the original class `React.Component` because we were
`extending` on `React.Component` in our subclass `App`. So that's why it worked.

But when we have it in a `constructor`, `this.state` is understood by TS to be the empty object: `state: Readonly<S>;`.
In this case we are not trying to define or override this property, we are trying to re-assign a new value to it.

In the world of JS, this two would be the same and would behave the same, but not in the world of TS!
They are two very different statements and will have two very different impacts.

(TODO: ask for preference from the team)

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
yarn add redux react-redux axios redux-thunk
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

Let's use `axios` to make a `get` request to this url: `https://jsonplaceholder.typicode.com/todos`.

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
Maybe an enum to store our action types could be the solution?

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

const url = "https://jsonplaceholder.typicode.com/todos";

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

However our TS code is kiinda lying to us at this point in time. When redux boots up, it sends warm up
actions to the reducers. It sends a couple of action objects that has randomized types on them to test that
none of our reducers responds incorrectly to an action, and to get the initial default value of state (our
case its an empty []). So redux dispatches its own action, but at present we applied `FetchTodosAction`to our action,
which is somewhat incorrect. We are saying that this action will always be type of `FetchTodosAction`, but
that's not super accurate because redux will use different actions automatically by itself.
We handle those in our `switch case/default`.

## Validating Store Structure

In `reducers/index.ts`, we combine:

```ts
import { combineReducers } from "redux";
import { todosReducer } from "./todos";

export const reducers = combineReducers({
  todos: todosReducer,
});
```

This will mean that in our state, we'll have:

```ts
{
  todos: [Todo, Todo, Todo, ...etc];
}
```

`combineReducers` is also a generic function, so we can pass in a type or interface to validate the object.

```ts
import { combineReducers } from "redux";
import { todosReducer } from "./todos";
import { Todo } from "../actions";

// interface to describe the entire state of my entire store
export interface StoreState {
  todos: Todo[];
}

export const reducers = combineReducers<StoreState>({
  todos: todosReducer,
});
```

TS is taking a look at the object that we are now passing into `combineReducers`. It's going to take a look
at all the different properties and then for each reducer we pass in (e.g. `todos: todosRecuder`) checks if
the function we pass in returns a value of type `Todo[]` as we defined in the `StoreState` interface.
So TS is making sure that whatever our reducer is actually doing is lining up with what we want
our `StoreState` to be. This means whenever we are returning something that doesn't match, it will be
caught inside this file as an error. Helpful!

It's worth starting to look at the `StoreState` interfaces first, to see what the store look like when
implementing a new feature in someone else's codebase to get an idea of the store.

## Connecting a Component to Redux

Firstly we need to make sure our App component has access to the fetch todos action creator. Then
we make sure we have a `mapStateToProps` function that can take a list of todos from our redux store
and provide them to the App component as props.

```tsx
import React from "react";
import { connect } from "react-redux";
import { Todo, fetchTodos } from "../actions";
import { StoreState } from "../reducers";

interface AppProps {
  todos: Todo[];
  fetchTodos(): any; // we'll come back to this
}
export class App extends React.Component {
  render() {
    return <div>Hi there</div>;
  }
}
```

We'll wire this up to our component with the generic `Component`.

```tsx
export class App extends React.Component<AppProps> {
  render() {
    return <div>Hi there</div>;
  }
}
```

Then mapping the state to props. We have the state that we type-check with the `StoreState`, and we know
it will return an object with todos inside, and the todos will be of type `Todo[]`:

```ts
(state: StoreState): { todos: Todo[]}
```

So together:

```ts
const mapStateToProps = (state: StoreState): { todos: Todo[] } => {
  return { todos: state.todos };
};
```

We can also desctructure it:

```ts
const mapStateToProps = ({ todos }: StoreState): { todos: Todo[] } => {
  return { todos };
};
```

We wire everything together with `connect`, but first need to remove the `export` from the `class App` 
and rename it to `_App`. We are exporting the connected component in the end instead:

```tsx
import React from "react";
import { connect } from "react-redux";
import { Todo, fetchTodos } from "../actions";
import { StoreState } from "../reducers";

interface AppProps {
  todos: Todo[];
  fetchTodos(): any; // we'll come back to this
}
class _App extends React.Component<AppProps> {
  render() {
    return <div>Hi there</div>;
  }
}

const mapStateToProps = ({ todos }: StoreState): { todos: Todo[] } => {
  return { todos };
};

export const App = connect(mapStateToProps, { fetchTodos })(_App);
```

## Rendering a List

Let's test the api call, see it in the Network tab in the console:

```tsx
componentDidMount() {
    this.props.fetchTodos()
  }
```

We need to make sure to store the response from the api in the store.

We need to refactor App, add a button that calls the action creator and add a method to create the List.
This render method will return an array of `JSX.Elements` for us:

```tsx
renderList(): JSX.Element[] {
    return this.props.todos.map((todo: Todo) => {
      return <div key={todo.id}>{todo.title}</div>;
    });
  }
```

```tsx
class _App extends React.Component<AppProps> {
  onButtonClick = (): void => {
    this.props.fetchTodos();
  };

  renderList(): JSX.Element[] {
    return this.props.todos.map((todo: Todo) => {
      return <div key={todo.id}>{todo.title}</div>;
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.onButtonClick}>Fetch</button>
        {this.renderList()}
      </div>
    );
  }
}
```

## Adding in Delete Functionality

We could delete an item from the list by clicking on it.

We are going to wire up an action, an action creator, modifying our reducer and an attachment our action
creator back to our app component. So it's the entire usual redux flow.

```ts
// actions/types.ts

export enum ActionTypes {
  fetchTodos,
  deleteTodo,
}
```

Then we create an interface and an action creator. There's no need for async in this case:

```ts
// actions/index.ts

export interface DeleteTodoAction {
  type: ActionTypes.deleteTodo;
  payload: number; // id of the Todo to be deleted
}

export const deleteTodo = (id: number): DeleteTodoAction => {
  return {
    type: ActionTypes.deleteTodo,
    payload: id,
  };
};
```

## Breaking out Action Creators

By using TS in our actions files, it will get pretty long. We can break it up into separate files and use
index.ts as a barrel file.

Move things from index to `todos.ts` and have the `index.ts` like this:

```ts
export * from "./todos";
export * from "./types";
```

## Expressing Actions as Type Union

We want to add the new delete action to the reducer. This is not the best way:

```ts
// reducers/todo.ts

import {
  Todo,
  FetchTodosAction,
  DeleteTodoAction,
  ActionTypes,
} from "../actions";

export const todosReducer = (
  state: Todo[] = [],
  action: FetchTodosAction | DeleteTodoAction
) => {
  switch (action.type) {
    case ActionTypes.fetchTodos:
      return action.payload;
    default:
      return state;
  }
};
```

Instead do this:

```ts
// actions/types.ts

import { FetchTodosAction, DeleteTodoAction } from "./todos";

export enum ActionTypes {
  fetchTodos,
  deleteTodo,
}

export type Action = FetchTodosAction | DeleteTodoAction;
```

```ts
// reducers/todos.ts

import { Todo, Action, ActionTypes } from "../actions";

export const todosReducer = (state: Todo[] = [], action: Action) => {
  switch (action.type) {
    case ActionTypes.fetchTodos:
      return action.payload;
    default:
      return state;
  }
};
```

## Type Guards in Reducers

A `switch` statement acts like a type guard:

```ts
switch (action.type) {
  case ActionTypes.fetchTodos:
    return action.payload;
  case ActionTypes.deleteTodo:
    action;
  default:
    return state;
}
```

Here `action` would only show `Action` as a type, which could be either `FetchTodosAction` or `DeleteTodoAction`, but
the `switch` reduces the number of cases inside our type union. So above looking at the first `action` above
the `switch` would give us `type Action`, but inside the case it would give `DeleteTodoAction`. We
setup an implicit type guard here.

```ts
import { Todo, Action, ActionTypes } from "../actions";

export const todosReducer = (state: Todo[] = [], action: Action) => {
  switch (action.type) {
    case ActionTypes.fetchTodos:
      return action.payload;
    case ActionTypes.deleteTodo:
      return state.filter((todo: Todo) => todo.id !== action.payload);
    default:
      return state;
  }
};
```

## Wiring up deleteTodo Action

We add it to App.tsx:

```tsx
import React from "react";
import { connect } from "react-redux";
import { Todo, fetchTodos, deleteTodo } from "../actions";
import { StoreState } from "../reducers";

interface AppProps {
  todos: Todo[];
  fetchTodos: typeof fetchTodos;
  deleteTodo: typeof deleteTodo;
}

class _App extends React.Component<AppProps> {
  onButtonClick = (): void => {
    this.props.fetchTodos();
  };

  onTodoClick = (id: number): void => {
    this.props.deleteTodo(id);
  };

  renderList(): JSX.Element[] {
    return this.props.todos.map((todo: Todo) => {
      return (
        <div onClick={() => this.onTodoClick(todo.id)} key={todo.id}>
          {todo.title}
        </div>
      );
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.onButtonClick}>Fetch</button>
        {this.renderList()}
      </div>
    );
  }
}

const mapStateToProps = ({ todos }: StoreState): { todos: Todo[] } => {
  return { todos };
};

export const App = connect(mapStateToProps, { fetchTodos, deleteTodo })(_App);
```

This will give us an error that we solve in the next section.

```
Argument of type 'typeof _App' is not assignable to parameter of type 'ComponentType<Matching<{ todos: Todo[]; } & { fetchTodos: () => Promise<void>; deleteTodo: (id: number) => DeleteTodoAction; }, AppProps>>'.
  Type 'typeof _App' is not assignable to type 'ComponentClass<Matching<{ todos: Todo[]; } & { fetchTodos: () => Promise<void>; deleteTodo: (id: number) => DeleteTodoAction; }, AppProps>, any>'.
    Types of parameters 'props' and 'props' are incompatible.
      Type 'Matching<{ todos: Todo[]; } & { fetchTodos: () => Promise<void>; deleteTodo: (id: number) => DeleteTodoAction; }, AppProps>' is not assignable to type 'Readonly<AppProps>'.
        The types returned by 'fetchTodos(...)' are incompatible between these types.
          Type 'Promise<void>' is not assignable to type '(dispatch: Dispatch<AnyAction>) => Promise<void>'.
            Type 'Promise<void>' provides no match for the signature '(dispatch: Dispatch<AnyAction>): Promise<void>'.  TS2345

    42 | };
    43 |
  > 44 | export const App = connect(mapStateToProps, { fetchTodos, deleteTodo })(_App);
       |
```

## Again, Type Definition Files

The `connect` functione expects an object as second argument, that will have a bunch of action creators
inside of it. The problem is that react-redux says `connect` thinks that an action creator is a function
that returns an object and nothing else. In our error we see:

```
Type 'Promise<void>' provides no match for the signature '(dispatch: Dispatch<AnyAction>): Promise<void>'.  TS2345
```

The issue is that here we use redux-thunk with `fetchTodos`:

```ts
interface AppProps {
  todos: Todo[];
  fetchTodos: typeof fetchTodos;
  deleteTodo: typeof deleteTodo;
}
```

`fetchTodos` is a redux-thunk type action creator, it does not return a normal action object, instead it returns
a function that is going to eventually dispatch an action.

```ts
(alias) const fetchTodos: () => (dispatch: Dispatch<AnyAction>) => Promise<void>
```

If we compare it to `deleteTodo`:

```ts
(alias) const deleteTodo: (id: number) => DeleteTodoAction
```

Currently there's no easy work around for this problem. So for now we can do this:

```ts
interface AppProps {
  todos: Todo[];
  fetchTodos: Function;
  deleteTodo: typeof deleteTodo;
}
```

## Tracking Loading with Component State

```tsx
interface AppState {
  fetching: boolean;
}

class _App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    this.state = { fetching: false };
  }

  componentDidUpdate(prevProps: AppProps): void {
    if (!prevProps.todos.length && this.props.todos.length) {
      this.setState({ fetching: false });
    }
  }

  onButtonClick = (): void => {
    this.props.fetchTodos();
    this.setState({ fetching: true });
  };

  ....

  render() {
    return (
      <div>
        <button onClick={this.onButtonClick}>Fetch</button>
        {this.state.fetching ? "LOADING" : null}
        {this.renderList()}
      </div>
    );
  }
}
```

## App Wrapup

- Use `enum` for `ActionTypes` as opposed to the redux's documentation's recommendation.
