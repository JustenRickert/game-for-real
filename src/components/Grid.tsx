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
import { BoardSquare, Entity } from "../reducers/world/world";
import { City } from "../reducers/world/city";

export type GridProps = {
  size: { width: number; height: number };
  cities: Root["world"]["cities"];
  board: Root["world"]["board"];
  entities: Root["world"]["entities"];
  onClickSquare: (square: BoardSquare) => void;
};

const BoardSquare = (props: {
  highlighted: boolean;
  square: BoardSquare;
  city: City | undefined;
  entity: Entity | undefined;
  onClickSquare: () => void;
}) => {
  const { x, y } = props.square.position;
  return (
    <div
      key={[x, ",", y].join()}
      onClick={props.onClickSquare}
      className={styles.square}
      style={{
        backgroundColor: props.highlighted ? "lightgreen" : undefined
      }}
    >
      {props.city && <div children={props.city.type} />}
      <div
        children={props.city ? `${props.city.points} $` : props.square.points}
      />
    </div>
  );
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
          <BoardSquare
            city={city}
            entity={entity}
            highlighted={selection === i}
            square={square}
            onClickSquare={() => handleClickSquare(square, i)}
          />
        );
      })}
    </div>
  );
};
