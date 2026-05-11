"use client";

import { useState } from "react";
import { createCallLog } from "@/lib/services/call-service";
import { CallResponseType } from "@/lib/types";
import { getResponseTypeLabel } from "@/lib/utils";

const responseTypes: CallResponseType[] = [
  "answered_ordered",
  "answered_interested",
  "answered_not_interested",
  "callback_later",
  "no_answer",
  "wrong_number",
  "dnd",
  "not_reachable",
];

interface CallLogFormProps {
  customerPhone: string;
  customerName: string;
  agentName: string;
  onSuccess?: () => void;
}

export default function CallLogForm({
  customerPhone,
  customerName,
  agentName,
  onSuccess,
}: CallLogFormProps) {
  const [responseType, setResponseType] = useState<CallResponseType>(
    "answered_interested",
  );
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCallLog({
        customer_phone: customerPhone,
        customer_name: customerName,
        agent_name: agentName,
        response_type: responseType,
        notes,
        follow_up_date: followUpDate || undefined,
        order_placed: responseType === "answered_ordered",
      });
      setNotes("");
      setFollowUpDate("");
      onSuccess?.();
    } catch {
      // Silenced
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Response Type
        </label>
        <select
          value={responseType}
          onChange={(e) => setResponseType(e.target.value as CallResponseType)}
          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {responseTypes.map((type) => (
            <option key={type} value={type}>
              {getResponseTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="What did the customer say..."
        />
      </div>

      {responseType === "callback_later" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Follow-up Date
          </label>
          <input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? "Saving..." : "Log Call"}
      </button>
    </form>
  );
}
