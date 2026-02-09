import { useAccountsStore, type Account } from "@/stores/accounts-store";
import { getPlatform } from "@/lib/platforms";
import {
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface Props {
  account: Account;
}

export function AccountCard({ account }: Props) {
  const { removeAccount, testConnection, refreshPublications } = useAccountsStore();
  const platform = getPlatform(account.platform);
  const [isTesting, setIsTesting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    await testConnection(account.platform, account.accountId);
    await refreshPublications(account.platform, account.accountId);
    setIsTesting(false);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    await removeAccount(account.platform, account.accountId);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-4">
        {/* Platform icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: platform?.color || "#666" }}
        >
          {platform?.name[0] || "?"}
        </div>

        {/* Account info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {account.accountName || "Unnamed Account"}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {platform?.name || account.platform}
            </span>
            {account.isConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{account.email}</p>

          {/* Publications */}
          {account.publications.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {account.publications.map((pub) => (
                <div
                  key={pub.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span className="font-medium text-foreground">{pub.name}</span>
                  {pub.subscriberCount !== null && (
                    <span>· {pub.subscriberCount.toLocaleString()} subscribers</span>
                  )}
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warning for Substack */}
          {account.platform === "substack" && (
            <p className="text-[11px] text-yellow-500/80 mt-2">
              ⚠️ Substack has no official API. Some features may be limited or stop working.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Test connection"
          >
            {isTesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remove account"
          >
            {isRemoving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
