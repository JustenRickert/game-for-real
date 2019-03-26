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
  cities: Root["world"]["cities"];
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
        const city = Object.values(props.cities).find(c =>
          isEqual(square.position, c.position)
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
            {city && <div children={city.type} />}
            <div
              children={
                entity ? "M" + (entity.points ? `(${entity.points})` : "") : ""
              }
            />
            <div
              children={
                city && city.type === "City"
                  ? `${city.points} CP`
                  : square.points
              }
            />
          </div>
        );
      })}
    </div>
  );
};
