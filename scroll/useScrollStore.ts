import { create } from "zustand";

type ScrollState = {
    progress: number;
    velocity: number;
    setProgress: (p: number) => void;
    setVelocity: (v: number) => void;
};

export const useScrollStore = create<ScrollState>((set) => ({
    progress: 0,
    velocity: 0,
    setProgress: (p) => set({ progress: p }),
    setVelocity: (v) => set({ velocity: v }),
}));
