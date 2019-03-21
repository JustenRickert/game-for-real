import React, { SetStateAction, Dispatch } from "react";
import { Omit } from "lodash";

import { DIMENSIONS } from "./config";
import { Player, PlayerProps } from "./components/Player";
import {
  Info,
  InfoProps,
  EntityInfo,
  EntityInfoProps,
  SquareInfo,
  SquareInfoProps
} from "./components/Info";
import { Board, GridProps } from "./components/Grid";
import { Store, StoreProps } from "./components/Store";
import { BoardSquare } from "./reducers/world/world";
import { Root } from "./store";

const keys = <T extends {}>(t: T) => Object.keys(t) as (keyof T)[];

type GridPlayerProps = {
  board: GridProps["board"];
  entities: Root["world"]["entities"];
  player: PlayerProps;
  onClickSquare: (square: BoardSquare) => void;
};

const GridPlayer = (props: GridPlayerProps) => {
  return (
    <div>
      <h1 children="The Grid" />
      <Player position={props.player.position} />
      <Board
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
  EntityInfo: EntityInfo,
  PlayerInfo: Info,
  SquareInfo: SquareInfo
};

export const SecondaryContentRouter = (props: {
  route: "PlayerInfo" | "SquareInfo" | "EntityInfo";
  routerProps: InfoProps & SquareInfoProps & EntityInfoProps;
}) => {
  return <div>{secondaryRoutes[props.route](props.routerProps)}</div>;
};
