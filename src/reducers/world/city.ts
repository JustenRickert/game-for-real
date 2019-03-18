import { sample } from "lodash";

import { BoardSquare } from "./world";

export type City = {
  type: "City";
  name: string;
  health: number;
  points: number;
};

const randomName = () => {
  const names = ["Minneapolis", "Toogalooga", "Airplane City"];
  return sample(names)!;
};

export const stubCity = (): City => ({
  type: "City",
  name: randomName(),
  health: 100,
  points: 0
});

export const nextCityPrice = (board: BoardSquare[]) => {
  return board.map(b => b.placement).filter(Boolean).length + 1;
};
