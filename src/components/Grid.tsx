import React, { forwardRef, MutableRefObject } from "react";
import { range } from "lodash";

import styles from "./grid.module.css";

export const Grid = (props: { size: { width: number; height: number } }) => {
  const {
    size: { width, height }
  } = props;
  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`
      }}
    >
      {range(width * height).map(i => (
        <div className={styles.square} key={i} children="" />
      ))}
    </div>
  );
};
