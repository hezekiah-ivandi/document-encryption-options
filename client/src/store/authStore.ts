import { tokenizedAxios } from "@/lib/axios";
import { create } from "zustand";

type authStore = {
  user: null | { id: number; email: string };
  checkAuth: () => Promise<void>;
  isLoading: boolean;
};

const useAuthStore = create<authStore>((set, get) => ({
  user: null,
  isLoading: false,
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await tokenizedAxios.get("/auth/me");
      set({ user: res.data });
    } catch (e) {
      console.log(e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
useAuthStore.getState().checkAuth();
export default useAuthStore;
