import React, { useState, useEffect } from "react";
import invariant from "invariant";

import { Root } from "../store";
import { BoardSquare } from "../reducers/world/world";
import { purchaseCity } from "../reducers/world/actions";

export type InfoProps = { player: Root["world"]["player"] };

export const Info = (props: InfoProps) => {
  return (
    <>
      <h2 children="Player" />
      <ul>
        <li
          children={[
            props.player.points,
            props.player.points === 1 ? "point" : "points"
          ].join(" ")}
        />
      </ul>
    </>
  );
};

const position = ({ x, y }: { x: number; y: number }) => [x, y].join(",");

export const Placement = (props: BoardSquare) => {
  if (!props.placement) {
    return <p children="Nothing here" />;
  }
  return (
    <p
      children={[
        "Square at",
        position(props.position),
        "with",
        props.points,
        props.points === 1 ? "points" : "point"
      ].join(" ")}
    />
  );
};

const usePurchase = (square: BoardSquare) => {
  const [purchase, setPurchase] = useState<
    null | "Taken" | "Success" | "Not enough points"
  >(null);
  useEffect(() => {
    setPurchase(null);
  }, [square]);
  const handlePurchaseCity = (
    kind: "Taken" | "Success" | "Not enough points"
  ) => {
    setPurchase(kind);
    setTimeout(() => {
      setPurchase(null);
    }, 2500);
  };
  return {
    purchase,
    handlePurchaseCity
  };
};

export type SquareInfoProps = {
  square: BoardSquare;
  onClickCloseSquare: () => void;
  purchaseCity: typeof purchaseCity;
};

export const SquareInfo = (props: SquareInfoProps) => {
  invariant(
    props.square,
    "props square should be non-null as it is the heuristic to show this component"
  );
  const { purchase, handlePurchaseCity } = usePurchase(props.square!);
  return (
    <>
      <h2
        style={{ minWidth: "10em" }}
        children={
          <p
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignContent: "space-between"
            }}
          >
            <span
              children={["Square", position(props.square!.position)].join(" ")}
            />
            <span onClick={props.onClickCloseSquare} children="Close" />
          </p>
        }
      />
      <h3 children="Placement" />
      <Placement {...props.square!} />
      <h3 children="Actions" />
      <p>
        {purchase === "Taken" ? (
          <span children="That board position is taken" />
        ) : purchase === "Success" ? (
          <span children="Bought" />
        ) : purchase === "Not enough points" ? (
          "Get some more points"
        ) : !props.square!.placement ? (
          <button
            onClick={() =>
              props.purchaseCity(props.square!, handlePurchaseCity)
            }
            children="Buy City"
          />
        ) : (
          "No actions"
        )}
      </p>
    </>
  );
};
