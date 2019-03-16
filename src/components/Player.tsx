import React, { useRef, MutableRefObject, useEffect, useState } from "react";

import gridStyles from "./grid.module.css";
import styles from "./player.module.css";

const calcTranslate = (
  position: { x: number; y: number },
  playerRef: MutableRefObject<null | HTMLDivElement>
) => {
  const { width, height } = playerRef.current
    ? playerRef.current.getBoundingClientRect()
    : { width: 0, height: 0 };
  // prettier-ignore
  const translateX = [
    "calc(",
    `${position.x} * (${gridStyles.squareLength} + ${gridStyles.gridGap} + 2 * ${gridStyles.squareBorder})`,
    ` + (${gridStyles.squareLength} - ${width}px) / 2`,
    ` + ${gridStyles.squareBorder}`,
    ")"
  ].join("");
  // prettier-ignore
  const translateY = [
    "calc(",
    `${position.y} * (${gridStyles.squareLength} + ${gridStyles.gridGap} + 2 * ${gridStyles.squareBorder})`,
    ` + (${gridStyles.squareLength} - ${height}px) / 2`,
    ` + ${gridStyles.squareBorder}`,
    ")"
  ].join("");
  return `translate(${translateX}, ${translateY})`;
};

const useSingleResetToAllowRefSet = () => {
  const [reset, setReset] = useState(false);
  useEffect(() => {
    if (!reset) setReset(reset => !reset);
  }, [reset]);
};

const usePlayerScrollIntoView = (
  ref: MutableRefObject<null | HTMLDivElement>,
  position: { x: number; y: number }
) => {
  let movementBoundary: number;
  useEffect(() => {
    addEventListener("resize", () => {
      movementBoundary = window.innerWidth / 20;
    });
    if (ref.current) {
      const playerRect = ref.current.getBoundingClientRect();
      if (
        playerRect.top > movementBoundary &&
        window.innerHeight - playerRect.bottom > movementBoundary &&
        playerRect.left < movementBoundary &&
        window.innerWidth - playerRect.right > movementBoundary
      )
        ref.current.scrollIntoView({ inline: "center" });
    }
  }, [position]);
};

export const Player = (props: { position: { x: number; y: number } }) => {
  const ref = useRef<HTMLDivElement>(null);
  useSingleResetToAllowRefSet();
  usePlayerScrollIntoView(ref, props.position);
  const transform = calcTranslate(props.position, ref);
  return (
    <div
      ref={ref}
      className={styles.player}
      style={{
        visibility: ref.current ? "visible" : "hidden",
        transform
      }}
    >
      player
    </div>
  );
};
