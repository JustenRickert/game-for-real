import { combineReducers, Reducer } from "redux";
import { range } from "lodash";

import { DIMENSIONS } from "../../config";

import { move } from "./util";
import { City, stubCity } from "./city";
import { Minion } from "./minion";

export type BoardSquare = {
  position: { x: number; y: number };
  placement: City | null;
  entity: Minion | null;
  points: number;
};

export type WorldState = {
  player: {
    points: number;
    position: { x: number; y: number };
  };
  board: BoardSquare[];
};

export type WorldAction =
  | AddPlayerPointsAction
  | MovePlayerPositionAction
  | BoardAction;

type BoardAction =
  | UpdatePlayer
  | UpdateEntity
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
  UpdatePlayer = "World/Player/Update",
  UpdateEntity = "World/Board/Entity/Update"
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

export type RemoveBoardPositionPoints = {
  type: Actions.RemoveBoardPoints;
  square: BoardSquare;
};

export const removeBoardPositionPoints = (
  square: BoardSquare
): RemoveBoardPositionPoints => ({
  type: Actions.RemoveBoardPoints,
  square
});

export type AddBoardPoint = {
  type: Actions.AddBoardPoint;
  square: BoardSquare;
};

export const addBoardPoint = (square: BoardSquare): AddBoardPoint => ({
  type: Actions.AddBoardPoint,
  square
});

export type UpdateBoardCity = {
  type: Actions.UpdateBoardCity;
  square: BoardSquare;
  update: (city: City) => City;
};

export const updateCity = (
  square: BoardSquare,
  update: (city: City) => City
): UpdateBoardCity => ({
  type: Actions.UpdateBoardCity,
  square,
  update
});

export type PlaceBoardAction = {
  type: Actions.BoardPlace;
  square: BoardSquare;
  update: (placement: BoardSquare["placement"]) => BoardSquare["placement"];
};

export const placeBoardAction = (
  square: BoardSquare,
  update: (placement: BoardSquare["placement"]) => BoardSquare["placement"]
): PlaceBoardAction => ({
  type: Actions.BoardPlace,
  square,
  update
});

export type UpdateEntity = {
  type: Actions.UpdateEntity;
  square: BoardSquare;
  update: (minion: Minion) => Minion | null;
};

export const updateEntity = (
  square: BoardSquare,
  update: (minion: Minion) => Minion | null
): UpdateEntity => ({
  type: Actions.UpdateEntity,
  square,
  update
});

export const boardReducer: Reducer<BoardSquare[], BoardAction> = (
  state = range(DIMENSIONS.height).reduce<BoardSquare[]>(
    (board, y) =>
      board.concat(
        range(DIMENSIONS.width).map(x => ({
          position: { x, y },
          placement: null,
          entity: null,
          points: 0
        }))
      ),
    []
  ),
  action
) => {
  switch (action.type) {
    case Actions.UpdateEntity: {
      return state.map(square =>
        square === action.square
          ? { ...square, entity: action.update(square.entity!) }
          : square
      );
    }
    case Actions.UpdateBoardCity: {
      return state.map(b => {
        if (b === action.square) {
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
        b === action.square
          ? { ...b, placement: action.update(b.placement) }
          : b
      );
    }
    case Actions.RemoveBoardPoints: {
      return state.map(b => (b === action.square ? { ...b, points: 0 } : b));
    }
    case Actions.AddBoardPoint: {
      return state.map(b =>
        b === action.square ? { ...b, points: b.points + 1 } : b
      );
    }
  }
  return state;
};

export const worldReducer = combineReducers({
  player: playerReducer,
  board: boardReducer
});
