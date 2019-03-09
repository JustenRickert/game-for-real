import { combineReducers } from "redux";

import { worldReducer } from "./world/world";

export const reducer = combineReducers({
  world: worldReducer
});
