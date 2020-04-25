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
