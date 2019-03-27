import { AnyAction, Action } from "redux";
import { Epic, combineEpics } from "redux-observable";
import { of } from "rxjs";
import { delay, map } from "rxjs/operators";
import { isEqual } from "lodash";

import { moveMinionToPositionAction } from "./actions";
import { BoardSquare, Entity } from "./world";

import { Root } from "../../store";
import { closestWhile } from "../../util";

enum EpicKind {
  MinionStart = "ENTITIES/MINION/START"
}

export const moveEntity: Epic<AnyAction, AnyAction, Root> = (
  action$,
  state$
) => {
  return action$;
};

interface ClosestMinionAction extends Action<EpicKind.MinionStart> {
  minionKey: string;
}

const DIRECTIONS = {
  Left: { x: -1, y: 0 },
  Up: { x: 0, y: -1 },
  UpLeft: { x: -1, y: -1 },
  Right: { x: 1, y: 0 },
  UpRight: { x: 1, y: -1 },
  DownRight: { x: 1, y: 1 },
  Down: { x: 0, y: 1 },
  DownLeft: { x: -1, y: 1 }
};

const getSingleSpaceMovements = (
  props: { entities: Record<string, Entity>; board: BoardSquare[] },
  entity: Entity
) => {
  const entities = Object.values(props.entities);
  return Object.values(DIRECTIONS)
    .map(direction => ({
      x: direction.x + entity.position.x,
      y: direction.y + entity.position.y
    }))
    .map(q => props.board.find(s => isEqual(s.position, q)))
    .filter(
      square =>
        square && !entities.some(e => isEqual(e.position, square.position))
    );
};

const findClosestAvailableSquareWithPoints = (
  props: { entities: Record<string, Entity>; board: BoardSquare[] },
  entity: Entity
) => {
  const entities = Object.values(props.entities);
  const availableSquaresWithPoints = closestWhile(
    props.board,
    () => true
  ).filter(
    s =>
      Boolean(s.points) && !entities.some(e => isEqual(e.position, s.position))
  );
  return availableSquaresWithPoints.length
    ? availableSquaresWithPoints[0]
    : undefined;
};

export const minionClosestPointEpic: Epic<ClosestMinionAction, any, Root> = (
  action$,
  state$
) => {
  const { player, board, entities } = state$.value.world;
  return action$.ofType(EpicKind.MinionStart).pipe(
    map(a => {
      const entity = entities[a.minionKey];
      const square = findClosestAvailableSquareWithPoints(
        { entities, board },
        entity
      );
      return moveMinionToPositionAction(entity, square);
    })
  );
};

export const rootEpic = combineEpics(moveEntity, minionClosestPointEpic);
