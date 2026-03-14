import { create } from "zustand";

export const useSortStore = create((set) => ({
  sortBy: "defaultSort",
  changeSortBy: (mode) => {
    set((state) => {
      return { sortBy: mode };
    });
  },
}));
