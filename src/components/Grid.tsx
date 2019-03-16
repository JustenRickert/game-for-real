import React, { forwardRef, MutableRefObject } from "react";
import { range } from "lodash";

import styles from "./grid.module.css";
import { Root } from "../store";

export const Grid = (props: {
  size: { width: number; height: number };
  positions: Root["world"]["board"];
}) => {
  const {
    size: { width, height },
    positions
  } = props;
  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`
      }}
    >
      {positions.map((p, i) => {
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
