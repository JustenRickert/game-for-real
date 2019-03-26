import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { isEqual, partial, sample, isArray } from "lodash";
import invariant from "invariant";

import { Root } from "../../store";
import { checkAccolades } from "../accolades/actions";

import { nextCityPrice, City, stubCity } from "./city";
import {
  Entity,
  movePlayerPositionAction,
  MovePlayerPositionAction,
  removeBoardPositionPoints,
  RemoveBoardPositionPoints,
  AddPlayerPointsAction,
  addPlayerPointsAction,
  addBoardPoint,
  AddBoardPoint,
  WorldState,
  updateCity,
  UpdateCity,
  updatePlayer,
  UpdatePlayer,
  UpdateEntity,
  BoardSquare,
  updateEntity,
  updateSquare,
  updateBoard,
  UpdateBoard
} from "./world";

import { move, getClosestCity } from "./util";
import { stubMinion, nextMinionPrice } from "./minion";
import { closestWhile, addP } from "../../util";
import { isEmpty } from "rxjs/operators";

enum Thunks {
  MovePlayer = "WORLD/MOVE_PLAYER_THUNK"
}

type WorldThunk<A extends AnyAction> = ThunkAction<any, Root, any, A>;

export const addRandomPoint = (): WorldThunk<
  AddBoardPoint | AddPlayerPointsAction | UpdateCity
> => (dispatch, getState) => {
  const {
    world: { board, player, cities }
  } = getState();
  const randomSquare = sample(board)!;
  const cityAtSquare = Object.values(cities).find(c =>
    isEqual(c.position, randomSquare.position)
  );
  if (cityAtSquare)
    dispatch(
      updateCity(cityAtSquare.key, city => ({
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

export const runMinionToClosestCity = (entityKey: string): WorldThunk<any> => (
  dispatch,
  getState
) => {
  const {
    world: { entities, cities, board }
  } = getState();
  const entity = entities[entityKey];
  const closestCitySquare = getClosestCity(cities, entity.position);
  dispatch(
    updateEntity(entityKey, entity => ({
      ...entity,
      position: closestCitySquare.position,
      currentFocus: {
        type: "BRINGING_POINTS_TO_CITY",
        position: closestCitySquare.position
      }
    }))
  );
};

type MovementError =
  | "No moves"
  | "Moved"
  | "Position occupied"
  | "Holding too many points";

export const runMinionToClosePoints = (
  entityKey: string,
  handleMovement: (kind: MovementError, entityKey: string) => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { board, entities: entitiesRecord }
  } = getState();
  const entity = entitiesRecord[entityKey];
  const entities = Object.values(entitiesRecord);
  const { currentFocus } = entity;
  let closest:
    | { x: number; y: number }
    | { x: number; y: number }[]
    | undefined;
  if (
    currentFocus &&
    currentFocus.position &&
    !board.find(s => isEqual(s.position, currentFocus.position))
  ) {
    closest = currentFocus.position;
  } else if (
    closest &&
    !isArray(closest) &&
    isEqual(entity.position, closest)
  ) {
    closest = undefined;
  } else {
    const sortedAvailableSquares = closestWhile(board, entity, () => true)
      .filter(square => square.points)
      .filter(s => !entities.some(e => isEqual(e.position, s.position)))
      .slice(0, 3)
      .map(square => square.position);
    if (sortedAvailableSquares.length) {
      closest = sortedAvailableSquares;
      dispatch(
        updateEntity(entityKey, entity => ({
          ...entity,
          currentFocus: {
            type: "GETTING_POINTS",
            position: sample(closest as { x: number; y: number }[])!
          }
        }))
      );
    }
  }

  invariant(
    isArray(closest) || !closest || !isEqual(closest, entity.position),
    "closest is not valid"
  );

  const targetPosition = isArray(closest) ? sample(closest) : closest;
  const targetSquare = board.find(square =>
    isEqual(square.position, targetPosition)
  );

  dispatch(moveEntityAction(entity, targetSquare, handleMovement));
};

export const runMinionMovement = (
  entityKey: string,
  handlePointsMovement: (kind: MovementError, entityKey: string) => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { entities: entitiesRecord }
  } = getState();
  const entity = entitiesRecord[entityKey];
  const entities = Object.values(entitiesRecord);

  if (entity.points >= entity.maxPoints) {
    if (
      entity.currentFocus &&
      entity.currentFocus.type === "BRINGING_POINTS_TO_CITY"
    ) {
      dispatch(runMinionToClosestCity(entityKey));
    }
  } else {
    dispatch(runMinionToClosePoints(entityKey, handlePointsMovement));
  }
};

export const moveEntityAction = (
  entity: Entity,
  square: BoardSquare | undefined,
  sendMovementStatus: (
    kind:
      | "No moves"
      | "Moved"
      | "Position occupied"
      | "Holding too many points",
    entityKey: string
  ) => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { board, entities }
  } = getState();
  if (entity.maxPoints <= entity.points) {
    sendMovementStatus("Holding too many points", entity.key);
  }
  if (!square) {
    sendMovementStatus("No moves", entity.key);
    return;
  }
  if (Object.values(entities).some(e => isEqual(e.position, square.position))) {
    sendMovementStatus("Position occupied", entity.key);
    return;
  }

  sendMovementStatus("Moved", entity.key);
  const points = Math.max(
    0,
    Math.min(entity.maxPoints - entity.points, square.points)
  );
  [
    updateEntity(entity.key, e => ({
      ...e,
      position: square.position,
      points: e.points + points
    })),
    updateBoard(squares =>
      squares.map(s =>
        isEqual(s.position, square.position)
          ? {
              ...square,
              points: s.points - points
            }
          : s
      )
    )
  ].forEach(dispatch);
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
  const newSquare = board.find(b => isEqual(b.position, newPosition))!;
  [
    updatePlayer(() => ({
      ...player,
      points: player.points + newSquare.points,
      position: newPosition
    })),
    updateBoard(() =>
      board.map(square =>
        square === newSquare
          ? {
              ...square,
              points: 0
            }
          : square
      )
    ),
    checkAccolades
  ].forEach(dispatch);
};

export const purchaseCity = (
  square: BoardSquare,
  onPurchase: (kind: "Taken" | "Success" | "Not enough points") => void
): WorldThunk<UpdateCity | UpdatePlayer | RemoveBoardPositionPoints> => (
  dispatch,
  getState
) => {
  const {
    world: { board, cities, player }
  } = getState();
  const cityAtSquare = Object.values(cities).find(city =>
    isEqual(city.position, square.position)
  );
  if (cityAtSquare) {
    onPurchase("Taken");
    return;
  }
  if (nextCityPrice(board) <= player.points) {
    const points = square.points;
    const newCity = stubCity(square.position);
    console.log("should creat??");
    [
      updateCity(newCity.key, () => ({ ...newCity, points })),
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

export const addEntityAction = (
  square: BoardSquare,
  onPurchase: (kind: "Not enough points" | "Success" | "Position taken") => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { player, board, cities }
  } = getState();
  const cityAtSquare = Object.values(cities).find(c =>
    isEqual(c.position, square.position)
  );
  if (!cityAtSquare) {
    console.log("ERROR?");
    return;
  }
  const pointsCost = nextMinionPrice(board);
  if (pointsCost <= cityAtSquare.points) {
    const minion = stubMinion(square.position);
    [
      updateEntity(minion.key, minion),
      updateSquare(square, square => ({
        ...square,
        placement: {
          ...cityAtSquare,
          points: cityAtSquare.points - pointsCost
        }
      }))
    ].forEach(dispatch);
    onPurchase("Success");
    return;
  }
  onPurchase("Not enough points");
};
