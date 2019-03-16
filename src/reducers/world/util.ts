import { DIMENSIONS } from "../../config";

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
