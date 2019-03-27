import { sample, uniqueId } from "lodash";

import { BoardSquare } from "./world";
import { randomCityName } from "./entity";

export type City = {
  type: "City";
  key: string;
  name: string;
  health: number;
  points: number;
  position: { x: number; y: number };
};

export const stubCity = (position: { x: number; y: number }): City => ({
  type: "City",
  key: uniqueId("city-"),
  name: randomCityName(),
  health: 100,
  points: 0,
  position
});

export const nextCityPrice = (cities: Record<"string", City>) => {
  const citiesLength = Object.values(cities).length;
  return (citiesLength + 1) ** 2;
};
