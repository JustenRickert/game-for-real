import { clone, isEqual, range, memoize, uniqWith } from "lodash";

import { BoardSquare } from "./reducers/world/world";

export const closest = <P extends { position: { x: number; y: number } }>(
  ps: P[],
  op: P
) =>
  ps.reduce((closest, p) =>
    distance(closest.position, op.position) < distance(p.position, op.position)
      ? closest
      : p
  );

export const closestWhile = <P extends { position: { x: number; y: number } }>(
  ps: P[],
  f: (p: P) => boolean
) => {
  const sortedPs = clone(ps).sort((p1, p2) =>
    distance(p1.position, p2.position)
  );
  const i = sortedPs.findIndex(p => !f(p));
  return i === -1 ? sortedPs.slice() : sortedPs.slice(0, i);
};

export const closestN = <P extends { position: { x: number; y: number } }>(
  ps: P[],
  op: P,
  n: number
) =>
  clone(ps)
    .sort((p1, p2) => distance(p1.position, p2.position))
    .slice(0, n);

export const distance = <P extends { x: number; y: number }>(p1: P, p2: P) =>
  Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

export const addP = <P extends { x: number; y: number }>(o: P, p: P) => ({
  x: o.x + p.x,
  y: o.y + p.y
});
