import { useEffect } from "react";
import { useAccountsStore } from "@/stores/accounts-store";
import { AccountCard } from "./AccountCard";
import { AddAccountDialog } from "./AddAccountDialog";
import { AiProviderSettings } from "./AiProviderSettings";
import { Plus, Loader2, Plug, ArrowRight, Zap, PenLine } from "lucide-react";
import { useState } from "react";

export default function AccountsWorkspace() {
  const { accounts, isLoading, error, loadAccounts } = useAccountsStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground/90">Accounts</h1>
            <p className="text-[13px] text-muted-foreground/50 mt-0.5">
              Manage your newsletter platform connections
            </p>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/5 border border-destructive/15 text-[13px] text-destructive/80">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && accounts.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
          </div>
        )}

        {/* Empty state — onboarding flow */}
        {!isLoading && accounts.length === 0 && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h3 className="text-[15px] font-semibold text-foreground/90 mb-1">
                Welcome to your command center
              </h3>
              <p className="text-[13px] text-muted-foreground/50 max-w-[360px] mx-auto leading-relaxed">
                Three steps to unlock the full power of Station. Let's get you connected.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Step 1 — Connect a Platform */}
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="group relative text-left rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 hover:bg-primary/[0.07] hover:border-primary/30 transition-all duration-200"
              >
                <div className="absolute top-4 right-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">
                  Step 1
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Plug className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-[13px] font-semibold text-foreground mb-1">Connect a Platform</h4>
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed mb-3">
                  Beehiiv, Substack, or Ghost — publish and pull analytics directly.
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary group-hover:gap-2 transition-all">
                  Add account <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Step 2 — Set Up AI */}
              <div className="relative text-left rounded-2xl border border-border/30 bg-card/20 p-5">
                <div className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground/25 uppercase tracking-widest">
                  Step 2
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="text-[13px] font-semibold text-foreground/70 mb-1">Set Up AI</h4>
                <p className="text-[11px] text-muted-foreground/40 leading-relaxed mb-3">
                  Your writing assistant gets smarter with platform context. Add an AI key below.
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/30">
                  Available after Step 1
                </span>
              </div>

              {/* Step 3 — Start Creating */}
              <div className="relative text-left rounded-2xl border border-border/30 bg-card/20 p-5">
                <div className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground/25 uppercase tracking-widest">
                  Step 3
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <PenLine className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="text-[13px] font-semibold text-foreground/70 mb-1">Start Creating</h4>
                <p className="text-[11px] text-muted-foreground/40 leading-relaxed mb-3">
                  Open the editor and write your first piece — AI-assisted, beautifully formatted.
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/30">
                  Ready when you are
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Account cards */}
        <div className="space-y-3">
          {accounts.map((account) => (
            <AccountCard
              key={`${account.platform}-${account.accountId}`}
              account={account}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/30 my-8" />

        {/* AI Provider Settings */}
        <AiProviderSettings />
      </div>

      {/* Add account dialog */}
      {isAddDialogOpen && (
        <AddAccountDialog onClose={() => setIsAddDialogOpen(false)} />
      )}
    </div>
  );
}
