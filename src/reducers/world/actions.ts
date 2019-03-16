import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { isEqual, sample } from "lodash";

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

type WorldRoot = {
  world: WorldState;
};

enum Thunks {
  MovePlayer = "WORLD/MOVE_PLAYER_THUNK"
}

type WorldThunk<A extends AnyAction> = ThunkAction<any, WorldRoot, any, A>;

export const addRandomPoint = (): WorldThunk<AddBoardPoint> => (
  dispatch,
  getState
) => {
  const {
    world: { board }
  } = getState();
  const randomBoardPlace = sample(board)!;
  dispatch(addBoardPoint(randomBoardPlace.position));
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
  dispatch(removeBoardPositionPoints(newPosition));
  dispatch(addPlayerPointsAction(boardAtNewPosition.points));
};
