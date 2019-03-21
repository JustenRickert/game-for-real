import { sample, uniqueId } from "lodash";

import { BoardSquare } from "./world";

export type Minion = {
  type: "Minion";
  key: string;
  name: string;
  position: { x: number; y: number };
  maxPoints: number;
  points: number;
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
  points: 0
});

export const nextMinionPrice = (board: BoardSquare[]) => {
  return 1;
};
