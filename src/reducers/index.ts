import { combineReducers } from "redux";

import { worldReducer } from "./world/world";
import { accoladesReducer } from "./accolades/accolades";

export { store } from "../store";

export const reducer = combineReducers({
  accolades: accoladesReducer,
  world: worldReducer
});
