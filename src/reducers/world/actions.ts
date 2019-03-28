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
import {
  MovementError,
  runMinionToClosePoints,
  runMinionToClosestCity,
  runMinionDeliverPoints,
  runStealerStealPoints,
  runStealerAttackMinion
} from "./entity-actions";
import { closestWhile, addP, distance } from "../../util";

enum Thunks {
  MovePlayer = "WORLD/MOVE_PLAYER_THUNK"
}

export type WorldThunk<A extends AnyAction> = ThunkAction<any, Root, any, A>;

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

export const runStealerMovement = (stealerKey: string): WorldThunk<any> => (
  dispatch,
  getState
) => {
  const {
    world: { entities }
  } = getState();
  const stealer = entities[stealerKey] as Stealer;
  const minions = Object.values(entities).filter(
    entity => entity.key === "minion"
  ) as Minion[];
  const closestMinion = closestWhile(minions, stealer, () => true)[0];
  if (!stealer.currentFocus || !closestMinion) {
    dispatch(runStealerStealPoints(stealerKey));
    return;
  }
  switch (stealer.currentFocus.type) {
    case "STEALING_POINTS":
      if (distance(closestMinion.position, stealer.position) < 2) {
        dispatch(runStealerAttackMinion(stealer, closestMinion));
        break;
      }
      dispatch(runStealerStealPoints(stealerKey));
      break;
    case "ATTACKING_MINION":
      if (distance(closestMinion.position, stealer.position) < 2) {
        dispatch(runStealerAttackMinion(stealer, closestMinion));
        break;
      }
      dispatch(runStealerStealPoints(stealerKey));
      break;
  }
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
  } else {
    onPurchase("Not enough points");
  }
};
