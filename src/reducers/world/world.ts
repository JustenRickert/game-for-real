import { combineReducers, Reducer } from "redux";
import { isEqual, range } from "lodash";

import { DIMENSIONS } from "../../config";

import { move } from "./util";
import { City, stubCity } from "./city";

export type WorldState = {
  player: {
    points: number;
    position: { x: number; y: number };
  };
  board: Board;
};

export type BoardSquare = {
  position: { x: number; y: number };
  placement: City | null;
  points: number;
};

type Board = BoardSquare[];

export type WorldAction =
  | AddPlayerPointsAction
  | MovePlayerPositionAction
  | BoardAction;

type BoardAction =
  | UpdatePlayer
  | UpdateBoardCity
  | PlaceBoardAction
  | AddBoardPoint
  | RemoveBoardPositionPoints;

enum Actions {
  AddPlayerPoints = "World/AddPlayerPoints",
  BoardPlace = "World/Board/Place",
  MovePlayerPosition = "World/MovePlayerPosition",
  RemoveBoardPoints = "World/Board/RemoveBoardPoints",
  UpdateBoardCity = "World/Board/UpdateCity",
  AddBoardPoint = "World/Board/AddPoint",
  UpdatePlayer = "World/Player/Update"
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

export type UpdateBoardCity = {
  type: Actions.UpdateBoardCity;
  position: { x: number; y: number };
  update: (city: City) => City;
};

export const updateCity = (
  position: { x: number; y: number },
  update: (city: City) => City
): UpdateBoardCity => ({
  type: Actions.UpdateBoardCity,
  position,
  update
});

export type PlaceBoardAction = {
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

export type UpdatePlayer = {
  type: Actions.UpdatePlayer;
  update: (player: WorldState["player"]) => WorldState["player"];
};

export const updatePlayer = (
  update: (player: WorldState["player"]) => WorldState["player"]
): UpdatePlayer => ({
  type: Actions.UpdatePlayer,
  update
});

const playerReducer: Reducer<WorldState["player"], WorldAction> = (
  state = {
    points: 0,
    position: { x: 0, y: 0 }
  },
  action
) => {
  switch (action.type) {
    case Actions.UpdatePlayer: {
      return action.update(state);
    }
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
    case Actions.UpdateBoardCity: {
      console.log("should run this shit");
      return state.map(b => {
        if (isEqual(b.position, action.position)) {
          if (!b.placement || b.placement.type !== "City") {
            throw new Error(`cant action ${action.type} on b.placement.type`);
          }
          return { ...b, placement: action.update(b.placement) };
        }
        return b;
      });
    }
    case Actions.BoardPlace: {
      return state.map(b =>
        isEqual(b.position, action.position)
          ? { ...b, placement: stubCity() }
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

export const worldReducer = combineReducers({
  player: playerReducer,
  board: boardReducer
});
