import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { isEqual, partial, sample } from "lodash";

import {
  movePlayerPositionAction,
  MovePlayerPositionAction,
  removeBoardPositionPoints,
  RemoveBoardPositionPoints,
  AddPlayerPointsAction,
  addPlayerPointsAction,
  addBoardPoint,
  AddBoardPoint,
  WorldState
} from "./world";

import { move } from "./util";

import { Root } from "../../store";
import { checkAccolades } from "../accolades/actions";

enum Thunks {
  MovePlayer = "WORLD/MOVE_PLAYER_THUNK"
}

type WorldThunk<A extends AnyAction> = ThunkAction<any, Root, any, A>;

export const addRandomPoint = (): WorldThunk<
  AddBoardPoint | AddPlayerPointsAction
> => (dispatch, getState) => {
  const {
    world: { board, player }
  } = getState();
  const randomBoardPlace = sample(board)!;
  if (isEqual(player.position, randomBoardPlace.position)) {
    dispatch(addPlayerPointsAction(1));
  } else {
    dispatch(addBoardPoint(randomBoardPlace.position));
  }

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
