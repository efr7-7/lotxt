import { useState } from "react";
import { useRevenueStore } from "@/stores/revenue-store";
import { X, DollarSign } from "lucide-react";
import { toast } from "@/stores/toast-store";

interface Props {
  onClose: () => void;
}

export function AddRevenueDialog({ onClose }: Props) {
  const { addEntry } = useRevenueStore();
  const [source, setSource] = useState("stripe");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("recurring");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.warning("Enter a valid amount");
      return;
    }
    setIsSubmitting(true);
    try {
      await addEntry({
        source,
        amountCents: Math.round(amountNum * 100),
        type,
        description: description || undefined,
        recordedAt: new Date(date).toISOString(),
      });
      toast.success("Revenue entry added");
      onClose();
    } catch {
      toast.error("Failed to add entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-popover border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Add Revenue</h2>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="29.99"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="manual">Manual</option>
              <option value="sponsorship">Sponsorship</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Type</label>
            <div className="flex gap-1">
              {["recurring", "one_time", "refund"].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 h-7 rounded-md text-[10px] font-medium transition-colors ${
                    type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Monthly subscription"
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Adding…" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
