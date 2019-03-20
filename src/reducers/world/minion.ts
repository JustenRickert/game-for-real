import { sample } from "lodash";

import { BoardSquare } from "./world";

export type Minion = {
  type: "Minion";
  name: string;
};

const randomName = () => {
  const names = ["Theodore", "Clavastina", "Worldie"];
  return sample(names)!;
};

export const stubMinion = (): Minion => ({
  type: "Minion",
  name: randomName()
});

export const nextMinionPrice = (board: BoardSquare[]) => {
  return board.map(b => b.entity).filter(Boolean).length + 1;
};
