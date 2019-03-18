import React, { SetStateAction, Dispatch } from "react";
import { Omit } from "lodash";

import { DIMENSIONS } from "./config";
import { Player, PlayerProps } from "./components/Player";
import { Info, InfoProps } from "./components/Info";
import { Board, GridProps } from "./components/Grid";
import { Store, StoreProps } from "./components/Store";

const keys = <T extends {}>(t: T) => {
  return Object.keys(t) as (keyof T)[];
};

type GridPlayerProps = {
  grid: Omit<GridProps, "size">;
  player: PlayerProps;
};

const GridPlayer = (props: GridPlayerProps) => {
  return (
    <div>
      <h1 children="The Grid" />
      <Player position={props.player.position} />
      <Board size={DIMENSIONS} board={props.grid.board} />
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
