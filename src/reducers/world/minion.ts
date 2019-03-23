import { sample, uniqueId } from "lodash";

import { BoardSquare, Entity } from "./world";

export type Minion = {
  type: "Minion";
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
  type: "Minion",
  key: uniqueId("minion-"),
  name: randomName(),
  position,
  maxPoints: 10,
  points: 0,
  currentFocus: null
});

export const nextMinionPrice = (board: BoardSquare[]) => {
  return 1;
};
