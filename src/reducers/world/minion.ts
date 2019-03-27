import { sample, isEqual, uniqueId } from "lodash";
import { Omit } from "lodash";
import invariant from "invariant";

import { BoardSquare, Entity } from "./world";
import { City } from "./city";

export type Minion = {
  type: "minion";
  key: string;
  name: string;
  position: { x: number; y: number };
  maxPoints: number;
  points: number;
  currentFocus:
    | null
    | {
        type: "BRINGING_POINTS_TO_CITY";
        position: { x: number; y: number };
      }
    | {
        type: "GETTING_POINTS";
        position: { x: number; y: number };
      };
};

const randomName = () => {
  const names = ["Theodore", "Clavastina", "Worldie"];
  return sample(names)!;
};

export const stubMinion = (position: { x: number; y: number }): Minion => ({
  type: "minion",
  key: uniqueId("minion-"),
  name: randomName(),
  position,
  maxPoints: 10,
  points: 0,
  currentFocus: null
});

export const nextMinionPrice = (entities: Record<string, Entity>) => {
  const entitiesLength = Object.values(entities).filter(
    entity => entity.type === "minion"
  ).length;
  return (entitiesLength + 1) ** 2;
};
