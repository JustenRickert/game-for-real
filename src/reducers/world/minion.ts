import { sample } from "lodash";

import { BoardSquare } from "./world";

export type Minion = {
  type: "Minion";
  name: string;
  cost: number;
};

const randomName = () => {
  const names = ["Theodore", "Clavastina", "Worldie"];
  return sample(names)!;
};

export const stubMinion = (): Minion => ({
  type: "Minion",
  name: randomName(),
  cost: 1
});

export const nextCityPrice = (board: BoardSquare[]) => {
  return board.map(b => b.placement).filter(Boolean).length + 1;
};
