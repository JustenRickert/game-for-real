import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { isEqual, partial, sample } from "lodash";
import invariant from "invariant";

import { Root } from "../../store";
import { checkAccolades } from "../accolades/actions";

import { nextCityPrice, City, stubCity } from "./city";
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
  updateCity,
  updatePlayer,
  UpdatePlayer,
  UpdateEntity,
  BoardSquare,
  updateEntity
} from "./world";

import { move } from "./util";
import { stubMinion } from "./minion";

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
  const randomSquare = sample(board)!;
  if (randomSquare.placement && randomSquare.placement.type === "City")
    dispatch(
      updateCity(randomSquare, city => ({
        ...city,
        points: city.points + 1
      }))
    );
  else if (isEqual(player.position, randomSquare.position))
    dispatch(addPlayerPointsAction(1));
  else dispatch(addBoardPoint(randomSquare));

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
  [
    movePlayerPositionAction(newPosition),
    addPlayerPointsAction(boardAtNewPosition.points),
    removeBoardPositionPoints(boardAtNewPosition),
    checkAccolades
  ].forEach(dispatch);
};

export const purchaseCity = (
  square: BoardSquare,
  onPurchase: (kind: "Taken" | "Success" | "Not enough points") => void
): WorldThunk<
  PlaceBoardAction | UpdateBoardCity | UpdatePlayer | RemoveBoardPositionPoints
> => (dispatch, getState) => {
  const {
    world: { board, player }
  } = getState();
  if (square.placement) {
    onPurchase("Taken");
    return;
  }
  if (nextCityPrice(board) <= player.points) {
    const points = square.points;
    [
      placeBoardAction(square, () => ({ ...stubCity(), points: points })),
      updatePlayer(player => ({
        ...player,
        points: player.points - nextCityPrice(board)
      })),
      removeBoardPositionPoints(square)
    ].forEach(dispatch);
    onPurchase("Success");
    return;
  }
  onPurchase("Not enough points");
};

export const addEntity = (square: BoardSquare): WorldThunk<any> => (
  dispatch,
  getState
) => {
  invariant(!square.entity, "There is already something here");
  [updateEntity(square, entity => stubMinion())].forEach(dispatch);
};

export const moveEntity = (
  fromSquare: BoardSquare,
  toSquare: BoardSquare
): WorldThunk<UpdateEntity> => (dispatch, getState) => {
  invariant(!toSquare.entity, "There is already something here");
  const {
    world: { board }
  } = getState();
  if (toSquare)
    [
      updateEntity(toSquare, minion => fromSquare.entity!),
      updateEntity(fromSquare, minion => null)
    ].forEach(dispatch);
};
