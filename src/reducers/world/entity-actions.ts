import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { isEqual, partial, sample, isArray } from "lodash";
import invariant from "invariant";

import { WorldThunk } from "./actions";
import {
  stubMinion,
  nextMinionPrice,
  Minion,
  stubStealer,
  Stealer
} from "./entity";
import { move, getClosestCity, outerSquaresOfGrid } from "./util";
import {
  updateEntity,
  updateBoard,
  updateCity,
  BoardSquare,
  updatePlayer,
  updateSquare
} from "./world";
import { closestWhile, addP } from "../../util";

export const moveMinionToPositionAction = (
  minion: Minion,
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
  if (!square) {
    sendMovementStatus("No moves", minion.key);
    return;
  }
  if (Object.values(entities).some(e => isEqual(e.position, square.position))) {
    sendMovementStatus("Position occupied", minion.key);
    return;
  }

  sendMovementStatus("Moved", minion.key);
  const points = Math.max(
    0,
    Math.min(minion.maxPoints - minion.points, square.points)
  );
  [
    updateEntity<Minion>(minion.key, minion => ({
      ...minion,
      position: square.position,
      points: minion.points + points
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

export const runMinionToClosestCity = (entityKey: string): WorldThunk<any> => (
  dispatch,
  getState
) => {
  const {
    world: { entities, cities, board }
  } = getState();
  const entity = entities[entityKey];
  const closestCitySquare = getClosestCity(cities, entity.position);
  switch (entity.type) {
    case "minion":
      dispatch(
        updateEntity<Minion>(entityKey, entity => ({
          ...entity,
          position: closestCitySquare.position,
          currentFocus: {
            type: "BRINGING_POINTS_TO_CITY",
            position: closestCitySquare.position
          }
        }))
      );
      break;
  }
};

export const runMinionDeliverPoints = (minion: Minion): WorldThunk<any> => (
  dispatch,
  getState
) => {
  const {
    world: { cities }
  } = getState();
  const cityAtMinion = Object.values(cities).find(city =>
    isEqual(city.position, minion.position)
  )!;
  invariant(cityAtMinion, "Minion must be at a city");
  [
    updateCity(cityAtMinion.key, city => ({
      ...city,
      points: city.points + 1
    })),
    updateEntity<Minion>(minion.key, minion => ({
      ...minion,
      points: minion.points - 1
    }))
  ].forEach(dispatch);
};

export type MovementError =
  | "No moves"
  | "Moved"
  | "Position occupied"
  | "Holding too many points";

export const runMinionToClosePoints = (
  minionKey: string,
  handleMovement: (kind: MovementError, entityKey: string) => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { board, entities: entitiesRecord }
  } = getState();
  const entities = Object.values(entitiesRecord);
  const minion = entitiesRecord[minionKey] as Minion;
  const { currentFocus } = minion;
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
    isEqual(minion.position, closest)
  ) {
    closest = undefined;
  } else {
    const sortedAvailableSquares = closestWhile(board, minion, () => true)
      .filter(square => square.points)
      .filter(s => !entities.some(e => isEqual(e.position, s.position)))
      .slice(0, 3)
      .map(square => square.position);
    if (sortedAvailableSquares.length) {
      closest = sortedAvailableSquares;
      dispatch(
        updateEntity<Minion>(minion.key, minion => ({
          ...minion,
          currentFocus: {
            type: "GETTING_POINTS",
            position: sample(closest as { x: number; y: number }[])!
          }
        }))
      );
    }
  }

  invariant(
    isArray(closest) || !closest || !isEqual(closest, minion.position),
    "closest is not valid"
  );

  const targetPosition = isArray(closest) ? sample(closest) : closest;
  const targetSquare = board.find(square =>
    isEqual(square.position, targetPosition)
  );

  dispatch(moveMinionToPositionAction(minion, targetSquare, handleMovement));
};

export const runStealerAttackMinion = (
  stealer: Stealer,
  minion: Minion
): WorldThunk<any> => (dispatch, getState) => {};

export const runStealerStealPoints = (stealerKey: string): WorldThunk<any> => (
  dispatch,
  getState
) => {
  const {
    world: { entities, board }
  } = getState();
  const stealer = entities[stealerKey] as Stealer;
  const closestPoints = closestWhile(board, stealer, () => true).slice(0, 5);
  const newSquare = sample(closestPoints);
  if (!newSquare) {
    return;
  }
  [
    updateEntity<Stealer>(stealerKey, stealer => ({
      ...stealer,
      currentFocus: {
        type: "STEALING_POINTS"
      },
      points: stealer.points + newSquare.points,
      position: newSquare.position
    })),
    updateSquare(newSquare, square => ({
      ...square,
      points: 0
    }))
  ].forEach(dispatch);
};
