import React from "react";

import { Root } from "../store";

export const Info = (props: { player: Root["world"]["player"] }) => {
  return (
    <div>
      <h2 children="Player" />
      <ul>
        <li children={props.player.points} />
      </ul>
    </div>
  );
};
