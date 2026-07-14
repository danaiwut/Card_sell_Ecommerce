"use client";

import { CheckCircle, X } from "lucide-react";

export function SuccessBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      <CheckCircle size={18} className="mt-0.5 shrink-0 text-green-600" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-green-600 hover:text-green-800">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
