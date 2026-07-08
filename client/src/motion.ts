import type { Transition } from "motion/react";

export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 30, mass: 0.5 };
export const springSmooth: Transition = { type: "spring", stiffness: 380, damping: 28, mass: 0.7 };
export const springGentle: Transition = { type: "spring", stiffness: 300, damping: 32, mass: 0.8 };
