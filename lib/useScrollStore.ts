import { create } from 'zustand';

interface ScrollState {
  scroll: number;
  velocity: number;
  setScroll: (scroll: number) => void;
  setVelocity: (velocity: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scroll: 0,
  velocity: 0,
  setScroll: (scroll) => set({ scroll }),
  setVelocity: (velocity) => set({ velocity }),
}));
