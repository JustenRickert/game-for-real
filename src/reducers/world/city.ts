import { sample, uniqueId } from "lodash";

import { BoardSquare } from "./world";

export type City = {
  type: "City";
  key: string;
  name: string;
  health: number;
  points: number;
  position: { x: number; y: number };
};

const randomName = () => {
  const names = ["Minneapolis", "Toogalooga", "Airplane City"];
  return sample(names)!;
};

export const stubCity = (position: { x: number; y: number }): City => ({
  type: "City",
  key: uniqueId("city-"),
  name: randomName(),
  health: 100,
  points: 0,
  position
});

export const nextCityPrice = (cities: Record<"string", City>) => {
  const citiesLength = Object.values(cities).length;
  return (citiesLength + 1) ** 2;
};
