import { useEffect } from "react";
import { useAccountsStore } from "@/stores/accounts-store";
import { AccountCard } from "./AccountCard";
import { AddAccountDialog } from "./AddAccountDialog";
import { AiProviderSettings } from "./AiProviderSettings";
import { Plus, Loader2, Plug } from "lucide-react";
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

        {/* Empty state */}
        {!isLoading && accounts.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border/40 rounded-2xl bg-card/20">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
              <Plug className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground/80 mb-1.5">
              No accounts connected
            </h3>
            <p className="text-[13px] text-muted-foreground/45 mb-5 max-w-[280px] mx-auto leading-relaxed">
              Connect your Beehiiv, Substack, or Kit account to start publishing directly from Station.
            </p>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              Add Your First Account
            </button>
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
