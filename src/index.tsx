import React from "react";
import { render } from "react-dom";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { default as thunk } from "redux-thunk";

import { reducer } from "./reducers";
import { App } from "./App";

const store = createStore(reducer, applyMiddleware(thunk));

render(<App />, document.getElementById("root"));
