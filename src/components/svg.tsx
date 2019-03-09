import React from "react";

export const Rect = ({
  x,
  y,
  width,
  height,
  color
}: {
  x: string;
  y: string;
  width: string;
  height: string;
  color: "red" | "blue";
}) => (
  <svg>
    <rect x={x} y={y} width={y} height={y} style={{ fill: color }} />
  </svg>
);
