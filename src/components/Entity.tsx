import React, { useRef } from "react";

import { calcTranslate, useSingleResetToAllowRefSet } from "./Player";
import styles from "./player.module.css";
import { Entity } from "../reducers/world/world";

export type EntityViewProps = { entity: Entity };

export const EntityView = (props: EntityViewProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useSingleResetToAllowRefSet();
  const transform = calcTranslate(props.entity.position, ref);
  const { points } = props.entity;
  return (
    <div
      ref={ref}
      className={styles.player}
      style={{
        visibility: ref.current ? "visible" : "hidden",
        transform
      }}
    >
      {`M(${points})`}
    </div>
  );
};
