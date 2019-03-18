import React from "react";

import { Root } from "../store";

export type InfoProps = { player: Root["world"]["player"] };

export const Info = (props: InfoProps) => {
  return (
    <div>
      <h2 children="Player" />
      <ul>
        <li
          children={[
            props.player.points,
            props.player.points === 1 ? "point" : "points"
          ].join(" ")}
        />
      </ul>
    </div>
  );
};
