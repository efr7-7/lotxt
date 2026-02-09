import { useEffect } from "react";
import { useAccountsStore } from "@/stores/accounts-store";
import { AccountCard } from "./AccountCard";
import { AddAccountDialog } from "./AddAccountDialog";
import { Plus, Loader2 } from "lucide-react";
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
            <h1 className="text-xl font-semibold text-foreground">Accounts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your newsletter platform connections
            </p>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && accounts.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && accounts.length === 0 && (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              No accounts connected
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Beehiiv, Substack, or Kit account to start publishing
            </p>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Add Your First Account
            </button>
          </div>
        )}

        {/* Account cards */}
        <div className="space-y-4">
          {accounts.map((account) => (
            <AccountCard
              key={`${account.platform}-${account.accountId}`}
              account={account}
            />
          ))}
        </div>
      </div>

      {/* Add account dialog */}
      {isAddDialogOpen && (
        <AddAccountDialog onClose={() => setIsAddDialogOpen(false)} />
      )}
    </div>
  );
}
