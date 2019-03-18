import { combineReducers, Reducer } from "redux";
import { isEqual, range } from "lodash";

import { DIMENSIONS } from "../../config";

import { move } from "./util";
import { number } from "prop-types";

export type WorldState = {
  player: {
    points: number;
    position: { x: number; y: number };
  };
  board: Board;
  positions: { essence: number; position: { x: number; y: number } }[];
};

type Board = {
  position: { x: number; y: number };
  placement: "City" | null;
  points: number;
}[];

export type WorldAction =
  | AddPlayerPointsAction
  | MovePlayerPositionAction
  | EssenceAction
  | BoardAction;

type BoardAction = PlaceBoardAction | AddBoardPoint | RemoveBoardPositionPoints;

enum Actions {
  AddPlayerPoints = "World/AddPlayerPoints",
  BoardPlace = "World/Board/Place",
  MovePlayerPosition = "World/MovePlayerPosition",
  RemoveBoardPoints = "World/Board/RemoveBoardPoints",
  AddBoardPoint = "World/Board/AddPoint"
}

export type AddPlayerPointsAction = {
  type: Actions.AddPlayerPoints;
  points: number;
};

export const addPlayerPointsAction = (
  points: number
): AddPlayerPointsAction => ({
  type: Actions.AddPlayerPoints,
  points
});

export type MovePlayerPositionAction = {
  type: Actions.MovePlayerPosition;
  position: { x: number; y: number };
};

export const movePlayerPositionAction = (position: {
  x: number;
  y: number;
}): MovePlayerPositionAction => ({
  type: Actions.MovePlayerPosition,
  position
});

export type RemoveBoardPositionPoints = {
  type: Actions.RemoveBoardPoints;
  position: { x: number; y: number };
};

export const removeBoardPositionPoints = (position: {
  x: number;
  y: number;
}): RemoveBoardPositionPoints => ({
  type: Actions.RemoveBoardPoints,
  position
});

export type AddBoardPoint = {
  type: Actions.AddBoardPoint;
  position: { x: number; y: number };
};

export const addBoardPoint = (position: {
  x: number;
  y: number;
}): AddBoardPoint => ({
  type: Actions.AddBoardPoint,
  position
});

type PlaceBoardAction = {
  type: Actions.BoardPlace;
  position: { x: number; y: number };
};

export const placeBoardAction = (position: {
  x: number;
  y: number;
}): PlaceBoardAction => ({
  type: Actions.BoardPlace,
  position
});

export type EssenceAction = {
  type: "World/AddEssence";
  position: { x: number; y: number };
};

export const essenceAction = (position: {
  x: number;
  y: number;
}): EssenceAction => ({ type: "World/AddEssence", position });

const playerReducer: Reducer<WorldState["player"], WorldAction> = (
  state = {
    points: 0,
    position: { x: 0, y: 0 }
  },
  action
) => {
  switch (action.type) {
    case Actions.AddPlayerPoints: {
      return { ...state, points: state.points + action.points };
    }
    case Actions.MovePlayerPosition: {
      return {
        ...state,
        position: action.position
      };
    }
  }
  return state;
};

export const boardReducer: Reducer<Board, BoardAction> = (
  state = range(DIMENSIONS.height).reduce<Board>(
    (board, y) =>
      board.concat(
        range(DIMENSIONS.width).map(x => ({
          position: { x, y },
          placement: null,
          points: 0
        }))
      ),
    []
  ),
  action
) => {
  switch (action.type) {
    case Actions.BoardPlace: {
      return state.map(b =>
        isEqual(b.position, action.position)
          ? { ...b, placement: "City" as "City" }
          : b
      );
    }
    case Actions.RemoveBoardPoints: {
      return state.map(b =>
        isEqual(b.position, action.position) ? { ...b, points: 0 } : b
      );
    }
    case Actions.AddBoardPoint: {
      return state.map(b =>
        isEqual(b.position, action.position)
          ? { ...b, points: b.points + 1 }
          : b
      );
    }
  }
  return state;
};

const positionsReducer: Reducer<WorldState["positions"], WorldAction> = (
  state = range(DIMENSIONS.height).reduce<WorldState["positions"]>(
    (positions, y) =>
      positions.concat(
        range(DIMENSIONS.width).map(x => ({
          position: { x, y },
          essence: 0
        }))
      ),
    []
  ),
  action
) => {
  switch (action.type) {
    case "World/AddEssence": {
      return state.map(p =>
        isEqual(p.position, action.position)
          ? { ...p, essence: p.essence + 1 }
          : p
      );
    }
  }
  return state;
};

export const worldReducer = combineReducers({
  player: playerReducer,
  positions: positionsReducer,
  board: boardReducer
});
