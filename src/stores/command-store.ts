import { create } from "zustand";

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  category: "navigation" | "editor" | "view" | "platform" | "general";
  action: () => void;
}

interface CommandState {
  isOpen: boolean;
  commands: Command[];
  search: string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearch: (search: string) => void;
  registerCommand: (command: Command) => void;
  registerCommands: (commands: Command[]) => void;
  unregisterCommand: (id: string) => void;
  filteredCommands: () => Command[];
}

export const useCommandStore = create<CommandState>((set, get) => ({
  isOpen: false,
  commands: [],
  search: "",
  open: () => set({ isOpen: true, search: "" }),
  close: () => set({ isOpen: false, search: "" }),
  toggle: () =>
    set((state) => ({ isOpen: !state.isOpen, search: "" })),
  setSearch: (search) => set({ search }),
  registerCommand: (command) =>
    set((state) => ({
      commands: [
        ...state.commands.filter((c) => c.id !== command.id),
        command,
      ],
    })),
  registerCommands: (commands) =>
    set((state) => {
      const ids = new Set(commands.map((c) => c.id));
      return {
        commands: [
          ...state.commands.filter((c) => !ids.has(c.id)),
          ...commands,
        ],
      };
    }),
  unregisterCommand: (id) =>
    set((state) => ({
      commands: state.commands.filter((c) => c.id !== id),
    })),
  filteredCommands: () => {
    const { commands, search } = get();
    if (!search.trim()) return commands;
    const lower = search.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(lower) ||
        c.description?.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower),
    );
  },
}));
