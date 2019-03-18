import React from "react";

import { DIMENSIONS } from "../config";

import { Board, GridProps } from "./Grid";
import { Player, PlayerProps } from "./Player";

type GameStoreProps = {};

const GameStore = (props: GameStoreProps) => {
  return <div>I am the store</div>;
};

export const StoreGridTabbedView = <Route extends "Store" | "Grid">(props: {
  route: Route;
  routeProps: { grid: GridProps; player: PlayerProps };
}) => {
  switch (props.route) {
    case "Store":
      return <GameStore />;
    case "Grid":
      return <GridPlayer {...props.routeProps} />;
  }
  throw new Error("Route not found: " + props.route);
};
