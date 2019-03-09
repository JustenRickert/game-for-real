import { Reducer } from "redux";
import { isEqual, range } from "lodash";

import { DIMENSIONS } from "../../config";

import { MoveAction, EssenceAction } from "./world-action";

const clamp = (position: { x: number; y: number }) => {
  const { x, y } = position;
  if (x < 0) return { x: 0, y };
  if (y < 0) return { x, y: 0 };
  if (x >= DIMENSIONS.width) return { x: DIMENSIONS.width - 1, y };
  if (y >= DIMENSIONS.height) return { x, y: DIMENSIONS.height - 1 };
  return position;
};

type WorldAction = MoveAction | EssenceAction;

type WorldState = {
  playerPosition: { x: number; y: number };
  positions: { essence: number; position: { x: number; y: number } }[];
};

const move = (key: string, position: { x: number; y: number }) => {
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

export const worldReducer: Reducer<WorldState, WorldAction> = (
  state = {
    playerPosition: { x: 0, y: 0 },
    positions: range(DIMENSIONS.height).reduce<WorldState["positions"]>(
      (positions, y) =>
        positions.concat(
          range(DIMENSIONS.width).map(x => ({
            position: { x, y },
            essence: 0
          }))
        ),
      []
    )
  },
  action
) => {
  switch (action.type) {
    case "World/Move": {
      if (action.id === "player") {
        return {
          ...state,
          playerPosition: move(action.direction, state.playerPosition)
        };
      }
      throw new Error("Add enemy?");
    }
    case "World/AddEssence": {
      return {
        ...state,
        positions: state.positions.map(p =>
          isEqual(p.position, action.position)
            ? { ...p, essence: p.essence + 1 }
            : p
        )
      };
    }
  }
  return state;
};
