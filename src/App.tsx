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
  moveEntityAction,
  runMinionMovement
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

const randomMinionMovementTime = () => randomTime(2500, 3500);
const randomMinionSpawnTime = () => randomTime(2500, 5000);
const useEntityMovement = (
  props: {
    board: Root["world"]["board"];
    entities: Root["world"]["entities"];
  },
  handlers: {
    moveEntity: typeof moveEntityAction;
    runMinion: typeof runMinionMovement;
  }
) => {
  const timeoutRecordRef = useRef<Record<string, Timeout>>({});
  const handleMovement = (kind: "No moves" | "Moved" | "Position occupied") => {
    switch (kind) {
      case "No moves": {
        console.log("no moves");
        return;
      }
      case "Moved": {
        console.log("moved");
        return;
      }
      case "Position occupied": {
        console.log("position occupied");
        return;
      }
    }
    invariant(!kind, "case not handled");
    throw new Error();
  };

  useEffect(() => {
    Object.keys(timeoutRecordRef.current).forEach(key => {
      if (!props.entities[key]) {
        delete timeoutRecordRef.current[key];
      }
    });
    Object.values(props.entities).forEach(entity => {
      let timeout: Timeout = timeoutRecordRef.current[entity.key];
      if (!timeout) {
        timeout = timeoutRecordRef.current[entity.key] = timer();
      }
      if (!timeout!.going) {
        timeout!.start(
          () => handlers.runMinion(entity.key, handleMovement),
          randomMinionMovementTime()
        );
      }
    });
  }, [props.board, props.entities]);
};

// prettier-ignore
type Props = {
  accolades: Root["accolades"];
  board:     Root["world"]["board"];
  entities:  Root["world"]["entities"];
  player:    Root["world"]["player"];
  move:         typeof moveAction;
  randomPoint:  typeof addRandomPoint;
  purchaseCity: typeof purchaseCity;
  addEntity:    typeof addEntityAction;
  moveEntity:   typeof moveEntityAction;
  runMinion:    typeof runMinionMovement;
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
    addEntity: addEntityAction,
    runMinion: runMinionMovement
  }
)((props: Props) => {
  usePlayerMovement(props.move);
  useAddRandomPointsToBoard(props.randomPoint);
  useEntityMovement(props, {
    runMinion: props.runMinion,
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
