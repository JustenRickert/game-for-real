import React, { SetStateAction, Dispatch } from "react";
import { Omit } from "lodash";

import { DIMENSIONS } from "./config";
import { Player, PlayerProps } from "./components/Player";
import {
  Info,
  InfoProps,
  SelectedInfo,
  SelectedInfoProps
} from "./components/Info";
import { Board, GridProps } from "./components/Grid";
import { EntityView, EntityViewProps } from "./components/Entity";
import { Store, StoreProps } from "./components/Store";
import { BoardSquare } from "./reducers/world/world";
import { Root } from "./store";

const keys = <T extends {}>(t: T) => Object.keys(t) as (keyof T)[];

type GridPlayerProps = {
  board: GridProps["board"];
  cities: Root["world"]["cities"];
  entities: Root["world"]["entities"];
  player: PlayerProps;
  onClickSquare: (square: BoardSquare) => void;
};

const GridPlayer = (props: GridPlayerProps) => {
  return (
    <div>
      <h1 children="The Grid" />
      <Player position={props.player.position} />
      {Object.values(props.entities).map(entity => (
        <EntityView entity={entity} />
      ))}
      <Board
        cities={props.cities}
        onClickSquare={props.onClickSquare}
        size={DIMENSIONS}
        board={props.board}
        entities={props.entities}
      />
    </div>
  );
};

const routes = {
  Grid: GridPlayer,
  Store: Store
};

export const RouteList = (props: {
  sendRoute: Dispatch<SetStateAction<"Grid" | "Store">>;
}) => {
  return (
    <ul>
      {keys(routes).map(key => (
        <li onClick={() => props.sendRoute(key)} children={key} />
      ))}
    </ul>
  );
};

export const MainContentRouter = (props: {
  route: "Grid" | "Store";
  routerProps: GridPlayerProps & StoreProps;
}) => {
  return routes[props.route](props.routerProps);
};

const secondaryRoutes = {
  PlayerInfo: Info,
  SquareInfo: SelectedInfo
};

export const SecondaryContentRouter = (props: {
  route: "PlayerInfo" | "SquareInfo";
  routerProps: InfoProps & SelectedInfoProps;
}) => {
  return <div>{secondaryRoutes[props.route](props.routerProps)}</div>;
};
