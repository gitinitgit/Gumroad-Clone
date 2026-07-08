import { create } from 'zustand';
import api from '../services/api';

/**
 * Local user store — synced from MongoDB (not Clerk).
 * Clerk handles authentication; this store handles the business-layer user profile.
 */

interface LocalUser {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  username: string;
  role: string;
  avatar: string;
  bio: string;
}

interface UserStoreState {
  localUser: LocalUser | null;
  isLoading: boolean;
  hasSynced: boolean;
  syncUser: () => Promise<void>;
  updateLocalUser: (updates: Partial<LocalUser>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  localUser: null,
  isLoading: false,
  hasSynced: false,

  /**
   * Sync the Clerk-authenticated user with the local MongoDB record.
   * Called once after Clerk sign-in completes.
   */
  syncUser: async () => {
    if (get().hasSynced) return;

    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/sync');
      set({ localUser: data.data, isLoading: false, hasSynced: true });
    } catch {
      set({ isLoading: false });
    }
  },

  updateLocalUser: (updates) => {
    set((state) => ({
      localUser: state.localUser ? { ...state.localUser, ...updates } : null,
    }));
  },

  clearUser: () => {
    set({ localUser: null, hasSynced: false });
  },
}));
