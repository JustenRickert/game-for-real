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
  updateEntity,
  updateSquare,
  updateBoard,
  UpdateBoard
} from "./world";

import { move } from "./util";
import { stubMinion, nextMinionPrice } from "./minion";
import { closestWhile, addP } from "../../util";

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

export const runMinionMovement = (
  entityKey: string,
  handleMovement: (
    kind:
      | "No moves"
      | "Moved"
      | "Position occupied"
      | "Holding too many points",
    entityKey: string
  ) => void
): WorldThunk<any> => (dispatch, getState) => {
  const {
    world: { board, entities: entitiesRecord }
  } = getState();
  const entity = entitiesRecord[entityKey];
  const entities = Object.values(entitiesRecord);
  const { currentFocus } = entity;
  let closest: BoardSquare | BoardSquare[] | undefined;
  if (
    currentFocus &&
    currentFocus.placement.points &&
    !board.find(s => isEqual(s.position, currentFocus.placement.position))
  ) {
    closest = currentFocus.placement;
  } else if (
    closest &&
    !isArray(closest) &&
    isEqual(entity.position, closest.position)
  ) {
    closest = undefined;
  } else {
    const sortedAvailableSquares = closestWhile(board, entity, () => true)
      .filter(square => square.points)
      .filter(s => !entities.some(e => isEqual(e.position, s.position)))
      .slice(0, 3);
    if (sortedAvailableSquares.length) {
      closest = sortedAvailableSquares;
      dispatch(
        updateEntity(entityKey, entity => ({
          ...entity,
          currentFocus: {
            placement: (closest as BoardSquare[])[0],
            entity: null
          }
        }))
      );
    }
  }

  invariant(
    isArray(closest) || !closest || !isEqual(closest.position, entity.position),
    "closest is not valid"
  );

  const targetPosition = isArray(closest) ? sample(closest) : closest;
  const targetSquare = targetPosition;

  dispatch(moveEntityAction(entity, targetSquare, handleMovement));
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

export const addEntityAction = (
  square: BoardSquare,
  onPurchase: (kind: "Not enough points" | "Success" | "Position taken") => void
): WorldThunk<any> => (dispatch, getState) => {
  invariant(
    square.placement,
    "UI enforces only adding entities where there is a placement"
  );
  square;
  const {
    world: { player, board }
  } = getState();
  const pointsCost = nextMinionPrice(board);
  if (pointsCost <= square.placement!.points) {
    const minion = stubMinion(square.position);
    [
      updateEntity(minion.key, minion),
      updateSquare(square, square => ({
        ...square,
        placement: {
          ...square.placement!,
          points: square.placement!.points - pointsCost
        }
      }))
    ].forEach(dispatch);
    onPurchase("Success");
    return;
  }
  onPurchase("Not enough points");
};
