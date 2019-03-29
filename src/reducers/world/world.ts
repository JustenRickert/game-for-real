import { combineReducers, Reducer } from "redux";
import { range, isEqual } from "lodash";
import invariant from "invariant";

import { DIMENSIONS } from "../../config";

import { move } from "./util";
import { City, stubCity } from "./city";
import { Minion, Stealer } from "./entity";

export type Entity = Minion | Stealer;

export type BoardSquare = {
  position: { x: number; y: number };
  points: number;
};

export type WorldState = {
  player: {
    points: number;
    maxPoints: number;
    position: { x: number; y: number };
  };
  entities: Record<string, Entity>;
  cities: Record<string, City>;
  board: BoardSquare[];
};

export type CityAction = UpdateCity;

export type WorldAction =
  | AddPlayerPointsAction
  | MovePlayerPositionAction
  | BoardAction;

type BoardAction =
  | UpdatePlayer
  | UpdateBoard
  | UpdateEntity<Entity>
  | UpdateSquare
  | AddBoardPoint
  | RemoveBoardPositionPoints;

enum Actions {
  AddPlayerPoints = "World/AddPlayerPoints",
  BoardPlace = "World/Board/Place",
  MovePlayerPosition = "World/MovePlayerPosition",
  RemoveBoardPoints = "World/Board/RemoveBoardPoints",
  AddBoardPoint = "World/Board/AddPoint",
  UpdatePlayer = "World/Player/Update",
  UpdateEntity = "World/Board/Entity/Update",
  UpdateSquare = "World/Board/Square/Update",
  UpdateBoard = "woarld/Board/Update",
  UpdateCity = "World/City/Update"
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
    maxPoints: 100,
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

export type UpdateEntity<T extends Entity> = {
  type: Actions.UpdateEntity;
  key: string;
  update: T | ((entity: T) => T);
};

export const updateEntity = <T extends Entity>(
  key: string,
  update: T | ((entity: T) => T)
): UpdateEntity<T> => ({
  type: Actions.UpdateEntity,
  key,
  update
});

const entitiesReducer: Reducer<WorldState["entities"], UpdateEntity<Entity>> = (
  state = {},
  action
) => {
  switch (action.type) {
    case Actions.UpdateEntity: {
      return {
        ...state,
        [action.key]:
          typeof action.update === "function"
            ? action.update(state[action.key])
            : action.update
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

export type UpdateBoard = {
  type: Actions.UpdateBoard;
  update: (board: BoardSquare[]) => BoardSquare[];
};

export const updateBoard = (
  update: (board: BoardSquare[]) => BoardSquare[]
): UpdateBoard => ({
  type: Actions.UpdateBoard,
  update
});

export type AddBoardPoint = {
  type: Actions.AddBoardPoint;
  square: BoardSquare;
};

export const addBoardPoint = (square: BoardSquare): AddBoardPoint => ({
  type: Actions.AddBoardPoint,
  square
});

export type UpdateSquare = {
  type: Actions.UpdateSquare;
  square: BoardSquare;
  update: (square: BoardSquare) => BoardSquare;
};

export const updateSquare = (
  square: BoardSquare,
  update: (square: BoardSquare) => BoardSquare
): UpdateSquare => ({
  type: Actions.UpdateSquare,
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
    case Actions.UpdateBoard: {
      return action.update(state);
    }
    case Actions.UpdateSquare: {
      return state.map(square =>
        square === action.square ? action.update(square) : square
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

export type UpdateCity = {
  type: Actions.UpdateCity;
  cityKey: string;
  update: (city: City) => City;
};

export const updateCity = (
  key: string,
  update: (city: City) => City
): UpdateCity => ({
  type: Actions.UpdateCity,
  cityKey: key,
  update
});

const citiesReducer: Reducer<WorldState["cities"], UpdateCity> = (
  state = {},
  action
) => {
  switch (action.type) {
    case Actions.UpdateCity: {
      return {
        ...state,
        [action.cityKey]: action.update(state[action.cityKey])
      };
    }
  }
  return state;
};

export const worldReducer = combineReducers({
  player: playerReducer,
  cities: citiesReducer,
  entities: entitiesReducer,
  board: boardReducer
});
