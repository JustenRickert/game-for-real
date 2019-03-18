import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";

import { accolades, accoladesAction, AccoladesState } from "./accolades";

import { Root } from "../../store";

type AccoladesThunk<A extends AnyAction> = ThunkAction<any, Root, any, A>;

export const checkAccolades: AccoladesThunk<
  ReturnType<typeof accoladesAction>
> = (dispatch, getState) => {
  const state = getState();
  accolades
    .filter(accolade => accolade.meetsRequirement(state))
    .forEach(metAccolade => {
      if (
        !state.accolades.attained.some(
          attainedAccolade => attainedAccolade === metAccolade.type
        )
      ) {
        dispatch(
          accoladesAction(accolade => accolade.concat(metAccolade.type))
        );
      }
    });
};
