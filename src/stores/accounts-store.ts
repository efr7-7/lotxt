import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { PlatformId } from "@/lib/platforms";

export interface Account {
  platform: PlatformId;
  accountId: string;
  accountName: string;
  email: string;
  isConnected: boolean;
  publications: Publication[];
}

export interface Publication {
  id: string;
  name: string;
  url: string;
  platform: string;
  subscriberCount: number | null;
  description: string | null;
}

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;

  loadAccounts: () => Promise<void>;
  addAccount: (
    platform: PlatformId,
    fields: Record<string, string>,
  ) => Promise<void>;
  removeAccount: (platform: PlatformId, accountId: string) => Promise<void>;
  testConnection: (
    platform: PlatformId,
    accountId: string,
  ) => Promise<boolean>;
  refreshPublications: (
    platform: PlatformId,
    accountId: string,
  ) => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  loadAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const creds = await invoke<
        {
          platform: string;
          account_id: string;
          account_name: string;
          email: string;
        }[]
      >("list_credentials");

      const accounts: Account[] = creds.map((c) => ({
        platform: c.platform as PlatformId,
        accountId: c.account_id,
        accountName: c.account_name,
        email: c.email,
        isConnected: false,
        publications: [],
      }));

      set({ accounts, isLoading: false });

      // Test connections in background
      for (const acc of accounts) {
        get()
          .testConnection(acc.platform, acc.accountId)
          .catch(() => {});
      }
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addAccount: async (platform, fields) => {
    set({ isLoading: true, error: null });
    try {
      const accountId = crypto.randomUUID();

      let apiKey = fields.api_key || "";
      // For Substack, build JSON config
      if (platform === "substack") {
        apiKey = JSON.stringify({
          subdomain: fields.subdomain || "",
          cookie: fields.cookie || null,
        });
      }

      await invoke("store_credential", {
        platform,
        accountId,
        apiKey,
        accountName: fields.account_name || "",
        email: fields.email || "",
      });

      const newAccount: Account = {
        platform,
        accountId,
        accountName: fields.account_name || "",
        email: fields.email || "",
        isConnected: false,
        publications: [],
      };

      set((state) => ({
        accounts: [...state.accounts, newAccount],
        isLoading: false,
      }));

      // Test connection
      await get().testConnection(platform, accountId);
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  removeAccount: async (platform, accountId) => {
    try {
      await invoke("disconnect_platform", { platform, accountId });
      set((state) => ({
        accounts: state.accounts.filter(
          (a) => !(a.platform === platform && a.accountId === accountId),
        ),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  testConnection: async (platform, accountId) => {
    try {
      const result = await invoke<boolean>("connect_platform", {
        platform,
        accountId,
      });
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.platform === platform && a.accountId === accountId
            ? { ...a, isConnected: result }
            : a,
        ),
      }));
      return result;
    } catch {
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.platform === platform && a.accountId === accountId
            ? { ...a, isConnected: false }
            : a,
        ),
      }));
      return false;
    }
  },

  refreshPublications: async (platform, accountId) => {
    try {
      const pubs = await invoke<Publication[]>("get_publications", {
        platform,
        accountId,
      });
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.platform === platform && a.accountId === accountId
            ? { ...a, publications: pubs }
            : a,
        ),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
