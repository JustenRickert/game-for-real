import React, {
  useRef,
  useState,
  useEffect,
  useReducer,
  Reducer,
  useMemo
} from "react";
import { connect } from "react-redux";
import { sample, isNull } from "lodash";

import { MOVE_KEYS, DIMENSIONS } from "./config";

import { moveAction, addRandomPoint } from "./reducers/world/actions";
import { essenceAction } from "./reducers/world/world";
import { Info } from "./components/Info";
import { Board } from "./components/Grid";
import { Player } from "./components/Player";
import { Root, store } from "./store";
import { RouteList, MainContentRouter } from "./RouteList";

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

type Props = {
  accolades: Root["accolades"];
  board: Root["world"]["board"];
  player: Root["world"]["player"];
  positions: Root["world"]["positions"];
  move: typeof moveAction;
  essence: typeof essenceAction;
  randomPoint: typeof addRandomPoint;
};

export const App = connect(
  (state: Root) => ({
    accolades: state.accolades,
    board: state.world.board,
    player: state.world.player
  }),
  { move: moveAction, essence: essenceAction, randomPoint: addRandomPoint }
)((props: Props) => {
  const [route, setRoute] = useState<"Grid" | "Store">("Grid");
  usePlayerMovement(props.move);
  useAddRandomPointsToBoard(props.randomPoint);
  const routerProps = useMemo(
    () => ({
      accolades: props.accolades,
      grid: { board: props.board },
      player: props.player
    }),
    [props.accolades, props.board, props.player]
  );
  return (
    <div style={{ display: "flex" }}>
      <RouteList sendRoute={setRoute} />
      <MainContentRouter route={route} routerProps={routerProps} />
      <div>
        <Info player={props.player} />
      </div>
    </div>
  );
});
