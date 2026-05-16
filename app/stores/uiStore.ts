import { create } from 'zustand';

interface UIState {
  tabBarHidden: boolean;
  adHidden: boolean;
  setTabBarHidden: (v: boolean) => void;
  setAdHidden: (v: boolean) => void;
}

export const useUiStore = create<UIState>((set) => ({
  tabBarHidden: false,
  adHidden: false,
  setTabBarHidden: (v) => set({ tabBarHidden: v }),
  setAdHidden: (v) => set({ adHidden: v }),
}));
