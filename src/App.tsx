import React, { useRef, useState, useEffect, useReducer, Reducer } from "react";

import { Grid } from "./components/Grid";
import { Player } from "./components/Player";

const DIMENSIONS = { width: 10, height: 10 };

const clamp = ({ x, y }: { x: number; y: number }) => {
  if (x < 0) return { x: 0, y };
  if (y < 0) return { x, y: 0 };
  if (x >= DIMENSIONS.width) return { x: DIMENSIONS.width - 1, y };
  if (y >= DIMENSIONS.height) return { x, y: DIMENSIONS.height - 1 };
  return { x, y };
};

type KeydownAction =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | string;

const usePosition = () => {
  const [position, dispatch] = useReducer<
    Reducer<{ x: number; y: number }, KeydownAction>
  >(
    (state, key) => {
      const { x, y } = state;
      switch (key) {
        case "ArrowLeft":
          return clamp({ y, x: x - 1 });
        case "ArrowRight":
          return clamp({ y, x: x + 1 });
        case "ArrowUp":
          return clamp({ x, y: y - 1 });
        case "ArrowDown":
          return clamp({ x, y: y + 1 });
      }
      return state;
    },
    { x: 0, y: 0 }
  );
  const handleKeydown = (e: KeyboardEvent) => {
    dispatch(e.key);
  };
  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);
  return { position };
};

export const App = () => {
  const { position } = usePosition();
  return (
    <div>
      <Player position={position} />
      <Grid size={DIMENSIONS} />
    </div>
  );
};
