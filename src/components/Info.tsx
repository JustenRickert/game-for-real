import React, { useState, useEffect } from "react";
import { isEqual } from "lodash";
import invariant from "invariant";

import { Root } from "../store";
import { BoardSquare, Entity } from "../reducers/world/world";
import { purchaseCity, addEntityAction } from "../reducers/world/actions";
import { nextCityPrice, City } from "../reducers/world/city";
import { nextMinionPrice, Minion } from "../reducers/world/entity";

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
  ] = useState<null | "Success" | "Not enough points" | "Position taken">(null);
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
  const handlePurchaseEntity = (
    kind: "Success" | "Not enough points" | "Position taken"
  ) => {
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

const Square = (props: {
  position: { x: number; y: number };
  onClickCloseSquare: () => void;
}) => {
  return (
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
          <span children={["Square", position(props.position)].join(" ")} />
          <span onClick={props.onClickCloseSquare} children="Close" />
        </p>
      }
    />
  );
};

const Placement = (props: {
  city: City | undefined;
  square: BoardSquare;
  entity: Entity | undefined;
}) => {
  return !props.city ? null : (
    <>
      <h3 children="Placement" />
      <p
        children={[
          "Square at",
          position(props.square.position),
          "with",
          props.square.points,
          props.square.points === 1 ? "points" : "point"
        ].join(" ")}
      />
      {!props.entity ? (
        <p children="No entity" />
      ) : (
        <p children={`There's a ${props.entity!.type.toLowerCase()} here`} />
      )}
    </>
  );
};

const Actions = (props: {
  city: City | undefined;
  nextCityPrice: number;
  nextMinionPrice: number;
  recentCityPurchaseMessage: "Taken" | "Success" | "Not enough points" | null;
  recentEntityPurchaseMessage:
    | "Success"
    | "Position taken"
    | "Not enough points"
    | null;
  purchaseCity: () => void;
  addEntity: () => void;
}) => {
  return (
    <>
      <h3 children="Actions" />
      {!props.city && (
        <p>
          {props.recentCityPurchaseMessage === "Taken" ? (
            <span children="That board position is taken" />
          ) : props.recentCityPurchaseMessage === "Success" ? (
            <span children="Bought" />
          ) : props.recentCityPurchaseMessage === "Not enough points" ? (
            "City needs more points"
          ) : (
            <button
              onClick={props.purchaseCity}
              children={[
                "Buy City for",
                props.nextCityPrice,
                props.nextCityPrice === 1 ? "point" : "points"
              ].join(" ")}
            />
          )}
        </p>
      )}
      {props.city && (
        <p>
          {props.recentEntityPurchaseMessage === "Not enough points" ? (
            <span children="Not enough points" />
          ) : props.recentEntityPurchaseMessage === "Success" ? (
            <span children="Bought" />
          ) : (
            <button
              onClick={props.addEntity}
              children={[
                "Buy Minion for",
                props.nextMinionPrice,
                props.nextMinionPrice === 1 ? "point" : "points"
              ].join(" ")}
            />
          )}
        </p>
      )}
    </>
  );
};

const Minion = (minion: Minion) => {
  return;
};

const disptachEntityInfo = (entity: Entity) => {
  let children: React.ReactNode;
  switch (entity.type) {
    case "stealer":
      {
        children = [
          [
            `Stealer ${entity.name}`,
            entity.currentFocus &&
              entity.currentFocus.type === "ATTACKING_MINION" &&
              `(${entity.attack})`
          ]
            .filter(Boolean)
            .join(""),
          `Point${entity.points === 1 ? "" : "s"} stolen ${entity.points}`
        ].map(stat => <li children={stat} />);
      }
      break;
    case "minion": {
      children = [
        `Minion ${entity.name}`,
        `Points ${entity.points}/${entity.maxPoints}`
      ].map(stat => <li children={stat} />);
      break;
    }
    default:
      throw new Error();
  }
  return <ul children={children} />;
};

const EntityInfo = (props: { entity: Entity | undefined }) => {
  return !props.entity ? null : (
    <>
      <h2 children="Entity" />
      {disptachEntityInfo(props.entity)}
    </>
  );
};

export type SelectedInfoProps = {
  board: BoardSquare[];
  entities: Record<string, Entity>;
  cities: Record<string, City>;
  selectedSquareIndex: number;
  onClickCloseSquare: () => void;
  purchaseCity: typeof purchaseCity;
  addEntity: typeof addEntityAction;
};

export const SelectedInfo = (props: SelectedInfoProps) => {
  const square = props.board[props.selectedSquareIndex];
  const {
    recentCityPurchaseMessage,
    recentEntityPurchaseMessage,
    handlePurchaseCity,
    handlePurchaseEntity
  } = usePurchase(square);
  const entity = Object.values(props.entities).find(entity =>
    isEqual(entity.position, square.position)
  );
  const city = Object.values(props.cities).find(c =>
    isEqual(c.position, square.position)
  );
  return (
    <>
      <Square
        position={square.position}
        onClickCloseSquare={props.onClickCloseSquare}
      />
      <EntityInfo entity={entity} />
      <Placement city={city} square={square} entity={entity} />
      <Actions
        city={city}
        nextCityPrice={nextCityPrice(props.cities)}
        nextMinionPrice={nextMinionPrice(props.entities)}
        recentCityPurchaseMessage={recentCityPurchaseMessage}
        recentEntityPurchaseMessage={recentEntityPurchaseMessage}
        purchaseCity={() => props.purchaseCity(square, handlePurchaseCity)}
        addEntity={() =>
          props.addEntity(square, "minion", handlePurchaseEntity)
        }
      />
    </>
  );
};
