import React from "react";

import { Root } from "../store";

export type StoreProps = {
  accolades: Root["accolades"];
};

export const Store = (props: StoreProps) => {
  return (
    <div>
      <h1 children="Store" />
      <h2 children="Accolades" />
      <ul>
        {props.accolades.attained.length
          ? props.accolades.attained.map(attained => (
              <li children={[attained, "Accolade"].join(" ")} />
            ))
          : "No accolades"}
      </ul>
    </div>
  );
};
