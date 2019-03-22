import { createStore, applyMiddleware, AnyAction } from "redux";
import { default as thunk } from "redux-thunk";
import { createEpicMiddleware } from "redux-observable";

import { reducer } from "./reducers";
import { WorldState } from "./reducers/world/world";
import { AccoladesState } from "./reducers/accolades/accolades";
import { rootEpic } from "./reducers/world/epics";

export type Root = {
  accolades: AccoladesState;
  world: WorldState;
};

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, Root>();

export const store = createStore(
  reducer,
  applyMiddleware(thunk, epicMiddleware)
);

// epicMiddleware.run(rootEpic);
