import React, {
  useState,
  forwardRef,
  MutableRefObject,
  useRef,
  useEffect,
  useLayoutEffect
} from "react";
import { range } from "lodash";

import styles from "./grid.module.css";
import { Root } from "../store";

export type GridProps = {
  size: { width: number; height: number };
  board: Root["world"]["board"];

  onClickSquare: (position: { x: number; y: number }) => void;
};

export const Board = (props: GridProps) => {
  const [selection, setSelection] = useState(-1);
  const handleClickSquare = (position: { x: number; y: number }, i: number) => {
    setSelection(i);
    props.onClickSquare(position);
  };
  console.log(props.board);
  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${props.size.width}, 1fr)`
      }}
    >
      {props.board.map((b, i) => {
        const { x, y } = b.position;
        return (
          <div
            key={i}
            onClick={() => handleClickSquare(b.position, i)}
            className={styles.square}
            style={{
              backgroundColor: selection === i ? "green" : undefined
            }}
          >
            <div children={b.placement ? b.placement.type : ""} />
            <div
              children={
                b.placement && b.placement.type === "City"
                  ? `${b.placement.points} CP`
                  : b.points
              }
            />
          </div>
        );
      })}
    </div>
  );
};
