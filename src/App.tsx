import React, { useRef, useState, useEffect, useReducer, Reducer } from "react";
import { connect } from "react-redux";
import { sample, range, isEqual, isNull, uniqWith } from "lodash";
import invariant from "invariant";

import {
  Info,
  SquareInfoProps,
  InfoProps,
  EntityInfoProps
} from "./components/Info";
import { Board } from "./components/Grid";
import { Player } from "./components/Player";
import { MOVE_KEYS, DIMENSIONS } from "./config";
import {
  moveAction,
  addRandomPoint,
  purchaseCity,
  addEntityAction,
  moveEntityAction
} from "./reducers/world/actions";
import { BoardSquare, Entity } from "./reducers/world/world";
import { Root, store } from "./store";
import {
  RouteList,
  MainContentRouter,
  SecondaryContentRouter
} from "./RouteList";
import { timeout } from "q";
import { addP, distance, closestN, closestWhile } from "./util";

const keys = <O extends {}>(o: O) => Object.keys(o) as (keyof O)[];

type ArrowKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";

interface Timeout {
  going: boolean;
  start(this: Timeout, fn: () => void, timeout: number): () => void;
}

const timer = (): Timeout => ({
  going: false,
  start: function(this, fn, interval) {
    this.going = true;
    const _timeout = setTimeout(() => {
      this.going = false;
      fn();
    }, interval);
    return () => {
      clearTimeout(_timeout);
      this.going = false;
    };
  }
});

const randomTime = (atLeast: number, upperBound: number) =>
  atLeast + Math.random() * (upperBound - atLeast);

const randomPointsTime = () => randomTime(100, 1000);
const useAddRandomPointsToBoard = (randomPoint: typeof addRandomPoint) => {
  let timeout: number;

  const handleRandomPoint = () => {
    randomPoint();
    timeout = setTimeout(handleRandomPoint, randomMove());
  };

  useEffect(() => {
    timeout = setTimeout(handleRandomPoint, randomPointsTime());
  }, []);
};

const randomMove = () => randomTime(1000, 5000);
const usePlayerMovement = (move: typeof moveAction) => {
  let timeout: number;

  const handleMove = (e: KeyboardEvent) => {
    if (MOVE_KEYS.some(key => key === e.key)) {
      move(e.key as ArrowKey);
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleMove);
    return () => {
      document.removeEventListener("keydown", handleMove);
    };
  }, []);
};

const useSecondaryRoute = (board: BoardSquare[]) => {
  const [routeSecondary, dispatch] = useReducer<
    Reducer<
      {
        route: "PlayerInfo" | "SquareInfo";
        selectedSquareIndex: null | number;
      },
      number | "PlayerInfo"
    >
  >(
    (state, action) => {
      if (typeof action === "string") return { ...state, route: "PlayerInfo" };
      return { route: "SquareInfo", selectedSquareIndex: action };
    },
    { route: "PlayerInfo", selectedSquareIndex: null }
  );
  const handleClickSquare = (square: BoardSquare) =>
    dispatch(board.findIndex(b => b === square));
  const handleClickCloseSquare = () => dispatch("PlayerInfo");
  return {
    ...routeSecondary,
    handleClickSquare,
    handleClickCloseSquare
  };
};

const useRouters = (props: {
  accolades: Root["accolades"];
  board: Root["world"]["board"];
  entities: Root["world"]["entities"];
  player: Root["world"]["player"];
  purchaseCity: typeof purchaseCity;
  addEntity: typeof addEntityAction;
}) => {
  const [routeMain, setMainRoute] = useState<"Grid" | "Store">("Grid");
  const {
    route: routeSecondary,
    selectedSquareIndex,
    handleClickSquare,
    handleClickCloseSquare
  } = useSecondaryRoute(props.board);
  const mainRouterProps = {
    ...props,
    onClickSquare: handleClickSquare
  };
  const secondaryRouterProps: SquareInfoProps & InfoProps & EntityInfoProps = {
    ...props,
    selectedSquareIndex: selectedSquareIndex!,
    onClickCloseSquare: handleClickCloseSquare
  };
  return {
    route: {
      main: routeMain,
      secondary: routeSecondary
    },
    setMainRoute,
    routerProps: {
      main: mainRouterProps,
      secondary: secondaryRouterProps
    }
  };
};

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

const getMovements = (
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

const useEntityPurpose = () => {
  const [entityTargetMovement, setEntityTargetMovement] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const entityTargetMovementRef = useRef(entityTargetMovement);

  const updateEntityTargetMovement = (
    entityKey: string,
    position: { x: number; y: number } | null
  ) => {
    setEntityTargetMovement(record => {
      let _: { x: number; y: number };
      let newRecord: Record<string, { x: number; y: number }>;
      if (!position) {
        ({ [entityKey]: _, ...newRecord } = record);
      } else {
        newRecord = {
          ...record,
          [entityKey]: position
        };
      }
      entityTargetMovementRef.current = newRecord;
      return newRecord;
    });
  };
  return {
    updateEntityTargetMovement,
    entityTargetMovementRef
  };
};

const randomMinionMovementTime = () => randomTime(2500, 3500);
const randomMinionSpawnTime = () => randomTime(2500, 5000);
const useEntityMovement = (
  props: {
    board: Root["world"]["board"];
    entities: Root["world"]["entities"];
  },
  handlers: {
    moveEntity: typeof moveEntityAction;
  }
) => {
  const timeoutRecordRef = useRef<Record<string, Timeout>>({});
  const {
    updateEntityTargetMovement,
    entityTargetMovementRef
  } = useEntityPurpose();
  const handleMovement = (
    kind: "No moves" | "Moved" | "Position occupied",
    key: string
  ) => {
    switch (kind) {
      case "No moves": {
        return;
      }
      case "Moved": {
        return;
      }
      case "Position occupied": {
        return;
      }
    }
    invariant(!kind, "case not handled");
    throw new Error();
  };

  const handleGatherPoints = (entityKey: string) => {
    handleMoveTowardClosestPoint(entityKey);
  };

  const handleMoveTowardClosestPoint = (entityKey: string) => {
    const entity = props.entities[entityKey];
    const entities = Object.values(props.entities);
    const previousTarget = entityTargetMovementRef.current[entityKey];
    const squareAtPreviousTarget = props.board.find(square =>
      isEqual(square.position, previousTarget)
    );
    const entityAtPreviousTarget = entities.find(entity =>
      isEqual(entity.position, previousTarget)
    );
    let closest: BoardSquare | undefined;
    if (
      previousTarget &&
      squareAtPreviousTarget!.points &&
      !entityAtPreviousTarget
    ) {
      closest = squareAtPreviousTarget!;
    } else {
      const sortedAvailableSquares = closestWhile(props.board, () => true)
        .filter(square => square.points)
        .filter(s => !entities.some(e => isEqual(e.position, s.position)));
      if (sortedAvailableSquares.length) {
        closest = sortedAvailableSquares[0];
        updateEntityTargetMovement(entityKey, closest.position);
      } else {
        closest = undefined;
      }
    }

    if (isEqual(entity.position, { x: 4, y: 0 })) {
      console.log("My BUTTOHLE");
      console.log(
        closest,
        closest && entities.find(e => isEqual(e.position, closest!.position))
      );
    }

    const direction = closest && {
      x: Math.sign(closest.position.x - entity.position.x),
      y: Math.sign(closest.position.y - entity.position.y)
    };
    const targetPositionsInDirection =
      direction &&
      [direction, { ...direction, x: 0 }, { ...direction, y: 0 }]
        .map(p => addP(entity.position, p))
        .filter(p => !entities.some(e => isEqual(e.position, p)));
    const targetPosition = sample(targetPositionsInDirection);
    const towardClosest = targetPosition
      ? props.board.find(square => isEqual(square.position, targetPosition))
      : undefined;

    handlers.moveEntity(entity, towardClosest, kind =>
      handleMovement(kind, entityKey)
    );
  };

  useEffect(() => {
    Object.keys(timeoutRecordRef.current).forEach(key => {
      if (!props.entities[key]) {
        delete timeoutRecordRef.current[key];
      }
    });
    Object.values(props.entities).forEach(entity => {
      if (!timeoutRecordRef.current[entity.key]) {
        timeoutRecordRef.current[entity.key] = timer();
      }
      if (!timeoutRecordRef.current[entity.key].going) {
        timeoutRecordRef.current[entity.key].start(
          () => handleGatherPoints(entity.key),
          randomMinionMovementTime()
        );
      }
    });
  }, [props.entities]);
};

type Props = {
  accolades: Root["accolades"];
  board: Root["world"]["board"];
  entities: Root["world"]["entities"];
  player: Root["world"]["player"];
  move: typeof moveAction;
  randomPoint: typeof addRandomPoint;
  purchaseCity: typeof purchaseCity;
  addEntity: typeof addEntityAction;
  moveEntity: typeof moveEntityAction;
};

export const App = connect(
  (state: Root) => ({
    accolades: state.accolades,
    board: state.world.board,
    entities: state.world.entities,
    player: state.world.player
  }),
  {
    move: moveAction,
    moveEntity: moveEntityAction,
    randomPoint: addRandomPoint,
    purchaseCity,
    addEntity: addEntityAction
  }
)((props: Props) => {
  usePlayerMovement(props.move);
  useAddRandomPointsToBoard(props.randomPoint);
  useEntityMovement(props, {
    moveEntity: props.moveEntity
  });
  const { setMainRoute, route, routerProps } = useRouters(props);
  return (
    <div style={{ display: "flex" }}>
      <RouteList sendRoute={setMainRoute} />
      <MainContentRouter route={route.main} routerProps={routerProps.main} />
      <SecondaryContentRouter
        route={route.secondary}
        routerProps={routerProps.secondary}
      />
    </div>
  );
});
