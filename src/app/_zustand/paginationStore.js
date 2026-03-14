import { create } from "zustand";

export const usePaginationStore = create((set) => ({
  page: 1,
  incrementPage: () => {
    set((state) => {
      state.page = state.page + 1;
      return { page: state.page };
    });
  },
  decrementPage: () => {
    set((state) => {
      if (state.page !== 1) {
        state.page = state.page - 1;
        return { page: state.page };
      }
      return { page: 1 };
    });
  },
}));
