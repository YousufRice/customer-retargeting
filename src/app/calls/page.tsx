"use client";

import { useEffect, useState } from "react";
import { getCallLogsToday, getPendingFollowUps } from "@/lib/services/call-service";
import { CallLog } from "@/lib/types";
import { formatPhone, getResponseTypeLabel, getResponseTypeColor } from "@/lib/utils";
import { Phone, Clock, Calendar, AlertCircle } from "lucide-react";

export default function CallsPage() {
  const [todayCalls, setTodayCalls] = useState<CallLog[]>([]);
  const [followUps, setFollowUps] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [calls, followups] = await Promise.all([
      getCallLogsToday(),
      getPendingFollowUps(),
    ]);
    setTodayCalls(calls);
    setFollowUps(followups);
    setLoading(false);
  };

  const responseCounts = todayCalls.reduce((acc, call) => {
    acc[call.response_type] = (acc[call.response_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Call Center</h1>
        <p className="text-slate-600 mt-1">Track calls, follow-ups, and agent performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-slate-600">Calls Today</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayCalls.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-600">Answered</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {todayCalls.filter((c) =>
              ["answered_ordered", "answered_interested", "answered_not_interested"].includes(c.response_type)
            ).length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-slate-600">Follow-ups</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{followUps.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-slate-600">No Answer</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {todayCalls.filter((c) => c.response_type === "no_answer").length}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Calls */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Today's Calls</h2>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : todayCalls.length === 0 ? (
            <p className="text-slate-500 text-sm">No calls logged today.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {todayCalls.map((log) => (
                <div key={log.$id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-medium text-slate-900">{log.customer_name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{formatPhone(log.customer_phone)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getResponseTypeColor(log.response_type)}`}>
                      {getResponseTypeLabel(log.response_type)}
                    </span>
                  </div>
                  {log.notes && <p className="text-sm text-slate-700 mt-1">{log.notes}</p>}
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                    <span>Agent: {log.agent_name}</span>
                    <span>{new Date(log.$createdAt).toLocaleTimeString()}</span>
                  </div>
                  {log.order_placed && (
                    <p className="text-xs text-green-600 mt-1 font-medium">Order placed</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response Breakdown + Follow-ups */}
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Response Breakdown</h2>
            {Object.keys(responseCounts).length === 0 ? (
              <p className="text-slate-500 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(responseCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getResponseTypeColor(type)}`}>
                        {getResponseTypeLabel(type)}
                      </span>
                      <div className="flex items-center gap-2 flex-1 mx-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{
                              width: `${(count / todayCalls.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Follow-ups</h2>
            {followUps.length === 0 ? (
              <p className="text-slate-500 text-sm">No pending follow-ups.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {followUps.map((log) => (
                  <div key={log.$id} className="border rounded-md p-3 bg-amber-50 border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900">{log.customer_name || "Unknown"}</p>
                      <span className="text-xs text-amber-700 font-medium">
                        {log.follow_up_date
                          ? new Date(log.follow_up_date).toLocaleDateString()
                          : "No date"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{formatPhone(log.customer_phone)}</p>
                    {log.notes && <p className="text-sm text-slate-700 mt-1">{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
