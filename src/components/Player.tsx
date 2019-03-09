import React, { useRef, MutableRefObject, useEffect, useState } from "react";

import gridStyles from "./grid.module.css";
import styles from "./player.module.css";

const useSingleResetToAllowRefSet = () => {
  const [reset, setReset] = useState(false);
  useEffect(() => {
    if (!reset) setReset(reset => !reset);
  }, [reset]);
};

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

export const Player = (props: { position: { x: number; y: number } }) => {
  const ref = useRef<HTMLDivElement>(null);
  useSingleResetToAllowRefSet();
  const { position } = props;
  return (
    <div
      ref={ref}
      className={styles.player}
      style={{
        visibility: ref.current ? "visible" : "hidden",
        transform: calcTranslate(position, ref)
      }}
    >
      player
    </div>
  );
};
