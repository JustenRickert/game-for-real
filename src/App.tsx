import React, { useRef, useState, useEffect, useReducer, Reducer } from "react";
import { connect } from "react-redux";
import { sample, isNull } from "lodash";

import { DIMENSIONS } from "./config";

import { moveAction, essenceAction } from "./reducers/world/world-action";

import { Grid } from "./components/Grid";
import { Player } from "./components/Player";
import { Root, store } from "./store";

const randomTime = (atLeast: number, upperBound: number) =>
  atLeast + Math.random() * (upperBound - atLeast);

const randomEssence = () => randomTime(2500, 10000);
const usePlayerEssencePosition = (
  essence: typeof essenceAction,
  playerPosition: { x: number; y: number }
) => {
  const [currentTimeout, setCurrentTimeout] = useState<null | number>(null);
  useEffect(() => {
    if (!isNull(currentTimeout)) essence(playerPosition);
    const newTimeout = randomEssence();
    setTimeout(() => setCurrentTimeout(newTimeout), newTimeout);
  }, [currentTimeout]);
};

const randomMove = () => randomTime(1000, 5000);
const usePlayerMovement = (move: typeof moveAction) => {
  let timeout: number;

  const handleRandomMove = () => {
    move(sample(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"])!);
    timeout = setTimeout(handleRandomMove, randomMove());
  };
  const handleMove = (e: KeyboardEvent) => {
    move(e.key);
    clearTimeout(timeout);
    timeout = setTimeout(handleRandomMove, 5000);
  };

  useEffect(() => {
    timeout = setTimeout(handleRandomMove, randomMove());
    document.addEventListener("keydown", handleMove);
    return () => {
      document.removeEventListener("keydown", handleMove);
    };
  }, []);
};

type Props = {
  playerPosition: Root["world"]["playerPosition"];
  positions: Root["world"]["positions"];
  move: typeof moveAction;
  essence: typeof essenceAction;
};

export const App = connect(
  (state: Root) => ({ ...state.world }),
  { move: moveAction, essence: essenceAction }
)((props: Props) => {
  usePlayerMovement(props.move);
  usePlayerEssencePosition(props.essence, props.playerPosition);
  return (
    <div>
      <Player position={props.playerPosition} />
      <Grid size={DIMENSIONS} positions={props.positions} />
    </div>
  );
});
