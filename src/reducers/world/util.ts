import { range } from "lodash";

import { DIMENSIONS } from "../../config";
import { City } from "./city";
import { BoardSquare } from "./world";
import { distance } from "../../util";

const clamp = (position: { x: number; y: number }) => {
  const { x, y } = position;
  if (x < 0) return { x: 0, y };
  if (y < 0) return { x, y: 0 };
  if (x >= DIMENSIONS.width) return { x: DIMENSIONS.width - 1, y };
  if (y >= DIMENSIONS.height) return { x, y: DIMENSIONS.height - 1 };
  return position;
};

export const move = (key: string, position: { x: number; y: number }) => {
  const { x, y } = position;
  switch (key) {
    case "ArrowLeft":
      return clamp({ y, x: x - 1 });
    case "ArrowRight":
      return clamp({ y, x: x + 1 });
    case "ArrowUp":
      return clamp({ x, y: y - 1 });
    case "ArrowDown":
      return clamp({ x, y: y + 1 });
  }
  return position;
};

export const getClosestCity = (
  cities: Record<string, City>,
  position: { x: number; y: number }
) => {
  const sortedCities = Object.values(cities).sort(
    (c1, c2) =>
      distance(c1.position, position) - distance(c2.position, position)
  );
  return sortedCities[0];
};

export const outerSquaresOfGrid = [
  ...range(DIMENSIONS.width).map(i => ({ x: i, y: 0 })),
  ...range(DIMENSIONS.width).map(i => ({ x: i, y: DIMENSIONS.width - 1 })),
  ...range(DIMENSIONS.height).map(j => ({ x: 0, y: 0 })),
  ...range(DIMENSIONS.height).map(j => ({ x: DIMENSIONS.height - 1, y: j }))
];
