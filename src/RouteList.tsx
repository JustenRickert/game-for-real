import React, { SetStateAction, Dispatch } from "react";
import { Omit } from "lodash";

import { DIMENSIONS } from "./config";
import { Player, PlayerProps } from "./components/Player";
import {
  Info,
  InfoProps,
  SquareInfo,
  SquareInfoProps
} from "./components/Info";
import { Board, GridProps } from "./components/Grid";
import { Store, StoreProps } from "./components/Store";
import { BoardSquare } from "./reducers/world/world";

const keys = <T extends {}>(t: T) => {
  return Object.keys(t) as (keyof T)[];
};

type GridPlayerProps = {
  board: GridProps["board"];
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
  SquareInfo: SquareInfo
};

export const SecondaryContentRouter = (props: {
  route: "PlayerInfo" | "SquareInfo";
  routerProps: InfoProps & SquareInfoProps;
}) => {
  return <div>{secondaryRoutes[props.route](props.routerProps)}</div>;
};
