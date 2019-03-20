import React, { useState, useEffect } from "react";
import invariant from "invariant";

import { Root } from "../store";
import { BoardSquare } from "../reducers/world/world";
import { purchaseCity, addEntityAction } from "../reducers/world/actions";
import { nextCityPrice } from "../reducers/world/city";
import { nextMinionPrice } from "../reducers/world/minion";

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

const usePurchase = (square: BoardSquare) => {
  const [recentCityPurchaseMessage, setRecentCityPurchaseMessage] = useState<
    null | "Taken" | "Success" | "Not enough points"
  >(null);
  const [
    recentEntityPurchaseMessage,
    setRecentEntityPurchaseMessage
  ] = useState<null | "Success" | "Not enough points">(null);
  useEffect(() => {
    setRecentCityPurchaseMessage(null);
    setRecentEntityPurchaseMessage(null);
  }, [square]);
  const handlePurchaseCity = (
    kind: "Taken" | "Success" | "Not enough points"
  ) => {
    setRecentCityPurchaseMessage(kind);
    setTimeout(() => {
      setRecentCityPurchaseMessage(null);
    }, 2500);
  };
  const handlePurchaseEntity = (kind: "Success" | "Not enough points") => {
    setRecentEntityPurchaseMessage(kind);
    setTimeout(() => {
      setRecentEntityPurchaseMessage(null);
    }, 2500);
  };
  return {
    recentCityPurchaseMessage,
    recentEntityPurchaseMessage,
    handlePurchaseCity,
    handlePurchaseEntity
  };
};

export type SquareInfoProps = {
  board: BoardSquare[];
  selectedSquareIndex: number;
  onClickCloseSquare: () => void;
  purchaseCity: typeof purchaseCity;
  addEntity: typeof addEntityAction;
};

export const SquareInfo = (props: SquareInfoProps) => {
  const square = props.board[props.selectedSquareIndex];
  const {
    recentCityPurchaseMessage,
    recentEntityPurchaseMessage,
    handlePurchaseCity,
    handlePurchaseEntity
  } = usePurchase(square);
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
            <span children={["Square", position(square.position)].join(" ")} />
            <span onClick={props.onClickCloseSquare} children="Close" />
          </p>
        }
      />

      <h3 children="Placement" />
      {!square.placement ? (
        <p children="Nothing here" />
      ) : (
        <>
          <p
            children={[
              "Square at",
              position(square.position),
              "with",
              square.points,
              square.points === 1 ? "points" : "point"
            ].join(" ")}
          />
          {square.entity ? (
            <p
              children={`There's a ${square.entity.type.toLowerCase()} here`}
            />
          ) : (
            <p children={`A can be TODO`} />
          )}
        </>
      )}

      <h3 children="Actions" />
      <p>
        {recentCityPurchaseMessage === "Taken" ? (
          <span children="That board position is taken" />
        ) : recentCityPurchaseMessage === "Success" ? (
          <span children="Bought" />
        ) : recentCityPurchaseMessage === "Not enough points" ? (
          "Get some more points"
        ) : !square.placement ? (
          <button
            onClick={() => props.purchaseCity(square, handlePurchaseCity)}
            children={[
              "Buy City for",
              nextCityPrice(props.board),
              nextCityPrice(props.board) === 1 ? "point" : "points"
            ].join(" ")}
          />
        ) : (
          "No actions"
        )}
      </p>
      {square.placement && !square.entity ? (
        <p>
          {recentEntityPurchaseMessage === "Not enough points" ? (
            <span children="Not enough points" />
          ) : recentEntityPurchaseMessage === "Success" ? (
            <span children="Bought" />
          ) : (
            <button
              onClick={() => {
                props.addEntity(square, handlePurchaseEntity);
              }}
              children={[
                "Buy Minion for",
                nextMinionPrice(props.board),
                nextMinionPrice(props.board) === 1 ? "point" : "points"
              ].join(" ")}
            />
          )}
        </p>
      ) : null}
    </>
  );
};
