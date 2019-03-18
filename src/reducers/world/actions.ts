import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { isEqual, partial, sample } from "lodash";

import { Root } from "../../store";
import { checkAccolades } from "../accolades/actions";

import { nextCityPrice, City } from "./city";
import {
  movePlayerPositionAction,
  MovePlayerPositionAction,
  removeBoardPositionPoints,
  RemoveBoardPositionPoints,
  placeBoardAction,
  PlaceBoardAction,
  AddPlayerPointsAction,
  addPlayerPointsAction,
  addBoardPoint,
  AddBoardPoint,
  WorldState,
  UpdateBoardCity,
  updateCity
} from "./world";

import { move } from "./util";

enum Thunks {
  MovePlayer = "WORLD/MOVE_PLAYER_THUNK"
}

type WorldThunk<A extends AnyAction> = ThunkAction<any, Root, any, A>;

export const addRandomPoint = (): WorldThunk<
  AddBoardPoint | AddPlayerPointsAction | UpdateBoardCity
> => (dispatch, getState) => {
  const {
    world: { board, player }
  } = getState();
  const randomBoardPlace = sample(board)!;
  const boardCities = board.filter(
    b => b.placement && b.placement.type === "City"
  );
  const cityAtRandomBoardPlace = boardCities.find(b =>
    isEqual(b.position, randomBoardPlace.position)
  );
  if (cityAtRandomBoardPlace)
    dispatch(
      updateCity(cityAtRandomBoardPlace.position, city => ({
        ...city,
        points: city.points + 1
      }))
    );
  else if (isEqual(player.position, randomBoardPlace.position))
    dispatch(addPlayerPointsAction(1));
  else dispatch(addBoardPoint(randomBoardPlace.position));

  // ACCOLADES TODO: Consider using middleware to do this. Should unrelated
  // reducers send actions to each other?
  dispatch(checkAccolades);
};

export const moveAction = (
  direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
): WorldThunk<
  MovePlayerPositionAction | RemoveBoardPositionPoints | AddPlayerPointsAction
> => (dispatch, getState) => {
  const {
    world: { board, player }
  } = getState();
  const newPosition = move(direction, player.position);
  const boardAtNewPosition = board.find(b => isEqual(b.position, newPosition))!;
  dispatch(movePlayerPositionAction(newPosition));
  dispatch(addPlayerPointsAction(boardAtNewPosition.points));
  dispatch(removeBoardPositionPoints(newPosition));

  // ACCOLADES
  dispatch(checkAccolades);
};

export const purchaseCity = (
  position: {
    x: number;
    y: number;
  },
  onPurchase: (kind: "Taken" | "Success" | "Not enough points") => void
): WorldThunk<
  PlaceBoardAction | UpdateBoardCity | RemoveBoardPositionPoints
> => (dispatch, getState) => {
  const {
    world: { board, player }
  } = getState();
  const boardAtPosition = board.find(b => isEqual(b.position, position))!;
  if (boardAtPosition.placement) {
    onPurchase("Taken");
    return;
  }
  if (nextCityPrice(board) <= player.points) {
    const points = board.find(b => isEqual(b.position, position))!.points;
    dispatch(placeBoardAction(position));
    dispatch(
      updateCity(position, city => ({
        ...city,
        points: city.points + points
      }))
    );
    dispatch(removeBoardPositionPoints(position));
    onPurchase("Success");
    return;
  }
  onPurchase("Not enough points");
};
