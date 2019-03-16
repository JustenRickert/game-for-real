import React, { useRef, useState, useEffect, useReducer, Reducer } from "react";
import { connect } from "react-redux";
import { sample, isNull } from "lodash";

import { MOVE_KEYS, DIMENSIONS } from "./config";

import { moveAction, addRandomPoint } from "./reducers/world/actions";
import { essenceAction } from "./reducers/world/world";
import { Info } from "./components/Info";
import { Grid } from "./components/Grid";
import { Player } from "./components/Player";
import { Root, store } from "./store";

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
  player: Root["world"]["player"];
  positions: Root["world"]["board"];
  move: typeof moveAction;
  essence: typeof essenceAction;
  randomPoint: typeof addRandomPoint;
};

export const App = connect(
  (state: Root) => ({
    player: state.world.player,
    positions: state.world.board
  }),
  { move: moveAction, essence: essenceAction, randomPoint: addRandomPoint }
)((props: Props) => {
  usePlayerMovement(props.move);
  useAddRandomPointsToBoard(props.randomPoint);
  return (
    <div style={{ display: "flex" }}>
      <div>
        <Player position={props.player.position} />
        <Grid size={DIMENSIONS} positions={props.positions} />
      </div>
      <div>
        <Info player={props.player} />
      </div>
    </div>
  );
});
