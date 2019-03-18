import React, { forwardRef, MutableRefObject } from "react";
import { range } from "lodash";

import styles from "./grid.module.css";
import { Root } from "../store";

export type GridProps = {
  size: { width: number; height: number };
  board: Root["world"]["board"];
};

export const Board = (props: GridProps) => {
  const {
    size: { width, height },
    board
  } = props;
  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`
      }}
    >
      {board.map((p, i) => {
        const { x, y } = p.position;
        return (
          <div key={i} className={styles.square}>
            <div children={`x:${x},y:${y}`} />
            <div children={p.points} />
          </div>
        );
      })}
    </div>
  );
};
