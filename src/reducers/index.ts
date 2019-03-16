import { combineReducers } from "redux";

import { worldReducer } from "./world/world";

export { store } from "../store";

export const reducer = combineReducers({
  world: worldReducer
});
