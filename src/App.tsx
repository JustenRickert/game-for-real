import React, {
  useRef,
  useState,
  useEffect,
  useReducer,
  Reducer,
  useMemo
} from "react";
import { connect } from "react-redux";
import { sample, isEqual, isNull } from "lodash";

import { Info } from "./components/Info";
import { Board } from "./components/Grid";
import { Player } from "./components/Player";
import { MOVE_KEYS, DIMENSIONS } from "./config";
import {
  moveAction,
  addRandomPoint,
  purchaseCity
} from "./reducers/world/actions";
import { essenceAction, BoardSquare } from "./reducers/world/world";
import { Root, store } from "./store";
import {
  RouteList,
  MainContentRouter,
  SecondaryContentRouter
} from "./RouteList";

type ArrowKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";

const randomTime = (atLeast: number, upperBound: number) =>
  atLeast + Math.random() * (upperBound - atLeast);

const randomPointsTime = () => randomTime(1000, 10000);
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

const useSecondaryRoute = () => {
  const [routeSecondary, dispatch] = useReducer<
    Reducer<
      {
        route: "PlayerInfo" | "SquareInfo";
        lastSquare: null | BoardSquare;
      },
      BoardSquare | "PlayerInfo"
    >
  >(
    (state, action) => {
      if (typeof action === "string") return { ...state, route: "PlayerInfo" };
      return { route: "SquareInfo", lastSquare: action };
    },
    { route: "PlayerInfo", lastSquare: null }
  );
  const handleClickSquare = (square: BoardSquare) => dispatch(square);
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
}) => {
  const [routeMain, setMainRoute] = useState<"Grid" | "Store">("Grid");
  const {
    route: routeSecondary,
    lastSquare,
    handleClickSquare,
    handleClickCloseSquare
  } = useSecondaryRoute();
  const mainRouterProps = useMemo(
    () => ({
      accolades: props.accolades,
      board: props.board,
      player: props.player,
      onClickSquare: (position: { x: number; y: number }) =>
        handleClickSquare(props.board.find(b => isEqual(b.position, position))!)
    }),
    [props.accolades, props.board, props.player]
  );
  const secondaryRouterProps = useMemo(
    () => ({
      player: props.player,
      square: lastSquare,
      onClickCloseSquare: handleClickCloseSquare,
      purchaseCity: props.purchaseCity
    }),
    [props.board, props.player, lastSquare]
  );
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

type Props = {
  accolades: Root["accolades"];
  board: Root["world"]["board"];
  player: Root["world"]["player"];
  positions: Root["world"]["positions"];
  move: typeof moveAction;
  randomPoint: typeof addRandomPoint;
  purchaseCity: typeof purchaseCity;
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
    purchaseCity
  }
)((props: Props) => {
  usePlayerMovement(props.move);
  useAddRandomPointsToBoard(props.randomPoint);
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
