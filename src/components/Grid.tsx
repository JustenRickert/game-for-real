import React, {
  useState,
  forwardRef,
  MutableRefObject,
  useRef,
  useEffect,
  useLayoutEffect
} from "react";
import { isEqual, range } from "lodash";

import styles from "./grid.module.css";
import { Root } from "../store";
import { BoardSquare } from "../reducers/world/world";

export type GridProps = {
  size: { width: number; height: number };
  board: Root["world"]["board"];
  entities: Root["world"]["entities"];

  onClickSquare: (square: BoardSquare) => void;
};

export const Board = (props: GridProps) => {
  const [selectionType, setSelectionType] = useState<"entity" | "placement">(
    "entity"
  );
  const [selection, setSelection] = useState(-1);
  const handleClickSquare = (square: BoardSquare, i: number) => {
    setSelection(i);
    props.onClickSquare(square);
  };
  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${props.size.width}, 1fr)`
      }}
    >
      {props.board.map((square, i) => {
        const entity = Object.values(props.entities).find(entity =>
          isEqual(square.position, entity.position)
        );
        return (
          <div
            key={i}
            onClick={() => handleClickSquare(square, i)}
            className={styles.square}
            style={{
              backgroundColor: selection === i ? "lightgreen" : undefined
            }}
          >
            <div children={square.placement ? square.placement.type : ""} />
            <div
              children={
                entity ? "M" + (entity.points ? `(${entity.points})` : "") : ""
              }
            />
            <div
              children={
                square.placement && square.placement.type === "City"
                  ? `${square.placement.points} CP`
                  : square.points
              }
            />
          </div>
        );
      })}
    </div>
  );
};
