export type MoveAction = {
  type: "World/Move";
  id: "player";
  direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";
};

export const moveAction = (direction: string): MoveAction => ({
  type: "World/Move",
  id: "player",
  direction: direction as MoveAction["direction"]
});

export type EssenceAction = {
  type: "World/AddEssence";
  position: { x: number; y: number };
};

export const essenceAction = (position: {
  x: number;
  y: number;
}): EssenceAction => ({ type: "World/AddEssence", position });
