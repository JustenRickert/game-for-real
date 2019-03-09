import { createStore, applyMiddleware } from "redux";
import { default as thunk } from "redux-thunk";

import { reducer } from "./reducers";

export const store = createStore(reducer, applyMiddleware(thunk));

export type Root = ReturnType<typeof store.getState>;
