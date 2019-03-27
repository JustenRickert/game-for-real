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
  updateEntity,
  BoardSquare,
  updateSquare,
  updateBoard,
  UpdateBoard
} from "./world";

import { move, getClosestCity, outerSquaresOfGrid } from "./util";
import {
  stubMinion,
  nextMinionPrice,
  Minion,
  stubStealer,
  Stealer
} from "./entity";
import { closestWhile, addP } from "../../util";

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
  switch (entity.type) {
    case "minion":
      dispatch(
        updateEntity(entityKey, (entity: Minion) => ({
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

type MovementError =
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

export const runMinionMovement = (
  minionKey: string,
  handlePointsMovement: (kind: MovementError, entityKey: string) => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { entities: entitiesRecord, cities }
  } = getState();
  const minion = entitiesRecord[minionKey] as Minion;
  const stateMinion = entitiesRecord[minionKey] as Minion;
  const start = () =>
    dispatch(runMinionToClosePoints(minionKey, handlePointsMovement));
  if (!minion.currentFocus) {
    start();
    return;
  }

  switch (minion.currentFocus.type) {
    case "BRINGING_POINTS_TO_CITY": {
      if (stateMinion.points > 0) {
        dispatch(runMinionDeliverPoints(minion));
      } else {
        dispatch(runMinionToClosePoints(minionKey, handlePointsMovement));
      }
      return;
    }
    case "GETTING_POINTS": {
      if (stateMinion.points >= stateMinion.maxPoints) {
        dispatch(runMinionToClosestCity(minion.key));
      } else {
        dispatch(runMinionToClosePoints(minionKey, handlePointsMovement));
      }
      return;
    }
  }
};

export const runStealer = (stealerKey: string): WorldThunk<any> => (
  dispatch,
  getState
) => {
  const {
    world: { entities }
  } = getState();
  const stealer = entities[stealerKey] as Stealer;
  if (!stealer.currentFocus) {
    return;
  }
  switch (stealer.currentFocus.type) {
    case "STEALING_POINTS":
    // if (entity nearby) {
    //   dispatch(runStealerAttackEnemy())
    //   break
    // }
    // dispatch(runStealerMoveToNearbyPoints())
    case "ATTACKING_ENTITY":
    // if (minion within range) {
    //   dispatch(runStealAttackMinion)
    //   break
    // }
    // dispatch(runStealerMoveToNearbyMinion)
  }
};

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
  if (nextCityPrice(cities) <= player.points) {
    const points = square.points;
    const newCity = stubCity(square.position);
    console.log("should creat??");
    [
      updateCity(newCity.key, () => ({ ...newCity, points })),
      updatePlayer(player => ({
        ...player,
        points: player.points - nextCityPrice(cities)
      })),
      removeBoardPositionPoints(square)
    ].forEach(dispatch);
    onPurchase("Success");
    return;
  }
  onPurchase("Not enough points");
};

export const addEntityAction = (
  square: BoardSquare | undefined,
  kind: "minion" | "stealer",
  onPurchase: (kind: "Not enough points" | "Success" | "Position taken") => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { player, board, cities, entities }
  } = getState();
  let cityAtSquare =
    square &&
    Object.values(cities).find(c => isEqual(c.position, square.position));
  const pointsCost = nextMinionPrice(entities);
  let newPosition: { x: number; y: number };
  if (pointsCost <= cityAtSquare!.points) {
    let entity: Entity;
    switch (kind) {
      case "minion":
        if (!square) {
          throw new Error();
        }
        entity = stubMinion(square.position);
        break;
      case "stealer":
        newPosition = Object.values(cities).find(square =>
          isEqual(square.position, sample(outerSquaresOfGrid)!)
        )!.position;
        entity = stubStealer(square ? square.position : newPosition);
        break;
      default:
        throw new Error();
    }
    const squareAtNewPosition =
      square || board.find(square => isEqual(square.position, newPosition))!;
    [
      updateEntity(entity.key, entity),
      updateSquare(squareAtNewPosition, square => ({
        ...square,
        placement: {
          ...cityAtSquare,
          points: cityAtSquare!.points - pointsCost
        }
      }))
    ].forEach(dispatch);
    onPurchase("Success");
    return;
  }
  onPurchase("Not enough points");
};
