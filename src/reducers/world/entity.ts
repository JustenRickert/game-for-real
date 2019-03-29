import { sample, isEqual, uniqueId } from "lodash";
import { Omit } from "lodash";
import invariant from "invariant";

import { BoardSquare, Entity } from "./world";
import { City } from "./city";

export type EntityBase<T extends "minion" | "stealer"> = {
  type: T;
  key: string;
  name: string;
  position: { x: number; y: number };
};

export type Minion = EntityBase<"minion"> & {
  type: "minion";
  maxPoints: number;
  points: number;
  currentFocus:
    | null
    | {
        type: "BRINGING_POINTS_TO_CITY";
        position: { x: number; y: number };
      }
    | {
        type: "GETTING_POINTS";
        position: { x: number; y: number };
      };
};

export type Stealer = EntityBase<"stealer"> & {
  type: "stealer";
  points: number;
  attack: number;
  currentFocus:
    | null
    | {
        type: "STEALING_POINTS";
      }
    | {
        type: "ATTACKING_MINION";
        minionKey: string;
      };
};

const peopleFirstName = [
  "Alexa",
  "Bob",
  "Carly",
  "Dillon",
  "Erica",
  "Fred",
  "Georgia",
  "Harry",
  "Isabella",
  "Joe",
  "Kayla",
  "Leo",
  "Maxine",
  "Nick",
  "Olivia",
  "Peter",
  "Quinn",
  "Rick",
  "Sarah",
  "Travis",
  "Uma",
  "Victor",
  "Wonda",
  "Xavier",
  "Zoe"
];

const peopleLastName = [
  "Alexander",
  "Berry",
  "Crown",
  "Delight",
  "England",
  "Freed",
  "Gourse",
  "Hilde",
  "Indie",
  "Jackson"
];

const prefix = ["vala", "ohara", "yeekzi", "cola", "coko", "juno", "bran"];

const midfix = ["we", "wo", "wonde", "ynsi", "onsu", "inci"];

const postfix = ["down", "lore", "bloon", "dreek", "zolo", "traz"];

export const randomCityName = () =>
  [sample(prefix), sample(midfix), sample(postfix)].join("'");

const randomName = () =>
  [sample(peopleFirstName)!, sample(peopleLastName)!].join(" ");

export const stubMinion = (position: { x: number; y: number }): Minion => ({
  type: "minion",
  key: uniqueId("minion-"),
  name: randomName(),
  position,
  maxPoints: 10,
  points: 0,
  currentFocus: null
});

export const stubStealer = (position: { x: number; y: number }): Stealer => ({
  type: "stealer",
  attack: 3,
  key: uniqueId("stealer"),
  points: 0,
  position,
  name: randomName(),
  currentFocus: null
});

export const nextMinionPrice = (entities: Record<string, Entity>) => {
  const entitiesLength = Object.values(entities).filter(
    entity => entity.type === "minion"
  ).length;
  return (entitiesLength + 1) ** 2;
};
