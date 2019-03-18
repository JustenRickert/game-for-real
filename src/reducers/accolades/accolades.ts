import { combineReducers, Reducer } from "redux";

import { Root } from "../../store";

enum AccoladeKind {
  Points100 = "100Points",
  Points1_000 = "1_000Points",
  Points10_000 = "10_000Points",
  Points100_000 = "100_000Points",
  Points1_000_000 = "1_000_000Points"
}

type Accolade = {
  type: AccoladeKind;
  meetsRequirement: (root: Root) => boolean;
};

export type AccoladesState = {
  attained: AccoladeKind[];
};

export const accolades: Accolade[] = [
  {
    type: AccoladeKind.Points100,
    meetsRequirement: root => {
      const { points } = root.world.player;
      return points > 100;
    }
  },
  {
    type: AccoladeKind.Points1_000,
    meetsRequirement: root => {
      const { points } = root.world.player;
      return points > 1_000;
    }
  },
  {
    type: AccoladeKind.Points10_000,
    meetsRequirement: root => {
      const { points } = root.world.player;
      return points > 10_000;
    }
  },
  {
    type: AccoladeKind.Points100_000,
    meetsRequirement: root => {
      const { points } = root.world.player;
      return points > 100_000;
    }
  },
  {
    type: AccoladeKind.Points1_000_000,
    meetsRequirement: root => {
      const { points } = root.world.player;
      return points > 1_000_000;
    }
  }
];

export const accoladesAction = <T>(
  operation: (t: AccoladeKind[]) => AccoladeKind[]
) => ({
  type: "Accolades/Attained/Action" as "Accolades/Attained/Action",
  operation
});

const attainedReducer: Reducer<
  AccoladesState["attained"],
  ReturnType<typeof accoladesAction>
> = (state = [], action) => {
  switch (action.type) {
    case "Accolades/Attained/Action":
      return action.operation(state);
  }
  return state;
};

export const accoladesReducer = combineReducers({
  attained: attainedReducer
});
