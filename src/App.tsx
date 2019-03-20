import React, { useRef, useState, useEffect, useReducer, Reducer } from "react";
import { connect } from "react-redux";
import { sample, range, isEqual, isNull } from "lodash";

import { Info, SquareInfoProps, InfoProps } from "./components/Info";
import { Board } from "./components/Grid";
import { Player } from "./components/Player";
import { MOVE_KEYS, DIMENSIONS } from "./config";
import {
  moveAction,
  addRandomPoint,
  purchaseCity,
  addEntityAction
} from "./reducers/world/actions";
import { BoardSquare } from "./reducers/world/world";
import { Root, store } from "./store";
import {
  RouteList,
  MainContentRouter,
  SecondaryContentRouter
} from "./RouteList";

type ArrowKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";

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
  const secondaryRouterProps: SquareInfoProps & InfoProps = {
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
  board: BoardSquare[],
  addEntity: typeof addEntityAction
) => {
  // const spawnTimeoutRefs = useRef<(null | number)[]>(
  //   board.map(b => (b.entity ? randomMinionMovementTime() : null))
  // );
  // const handleRandomSpawn = (i: number) => {
  //   const newTimeout = randomMinionMovementTime();
  //   spawnTimeoutRefs.current[i] = newTimeout;
  //   setTimeout(handleRandomSpawn, newTimeout);
  //   console.log("Wow! A spawn!");
  // };
  // useEffect(() => {
  //   console.log("SPAWN USE RUN");
  //   spawnTimeoutRefs.current.forEach((timeout, i) => {
  //     if (timeout !== null) {
  //       setTimeout(handleRandomSpawn, timeout);
  //       console.log("timeout set", board[i]);
  //     }
  //   });
  // }, board.map(square => square.placement));

  const movementTimeoutRefs = useRef<(null | number)[]>(
    board.map(b => (b.entity ? randomMinionMovementTime() : null))
  );
  const resetMovementTimeoutRefs = () => {
    movementTimeoutRefs.current = board.map((b, i) =>
      b.entity
        ? movementTimeoutRefs.current[i] || randomMinionMovementTime()
        : null
    );
  };
  const handleRandomMovement = (i: number) => {
    const newTimeout = randomMinionMovementTime();
    movementTimeoutRefs.current[i] = newTimeout;
    setTimeout(handleRandomMovement, newTimeout);
    console.log(movementTimeoutRefs.current!.filter(Boolean));
    console.log("Wow!");
  };
  useEffect(() => {
    resetMovementTimeoutRefs();
    movementTimeoutRefs.current.forEach((timeout, i) => {
      if (timeout !== null) {
        setTimeout(handleRandomMovement, timeout);
      }
    });
  }, board.map(square => square.entity));
};

type Props = {
  accolades: Root["accolades"];
  board: Root["world"]["board"];
  player: Root["world"]["player"];
  move: typeof moveAction;
  randomPoint: typeof addRandomPoint;
  purchaseCity: typeof purchaseCity;
  addEntity: typeof addEntityAction;
};

export const App = connect(
  (state: Root) => ({
    accolades: state.accolades,
    board: state.world.board,
    player: state.world.player
  }),
  {
    move: moveAction,
    randomPoint: addRandomPoint,
    purchaseCity,
    addEntity: addEntityAction
  }
)((props: Props) => {
  usePlayerMovement(props.move);
  useAddRandomPointsToBoard(props.randomPoint);
  useEntityMovement(props.board, props.addEntity);
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
