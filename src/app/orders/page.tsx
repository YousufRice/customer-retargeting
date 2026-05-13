"use client";

import { useEffect, useState } from "react";
import { getAgentOrders, updateAgentOrderStatus } from "@/lib/services/order-service";
import { AgentOrder } from "@/lib/types";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { ShoppingBag, Calendar, MapPin, User, Package } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadOrders = async () => {
    setLoading(true);
    const data = await getAgentOrders(undefined, 200);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, status: AgentOrder["status"]) => {
    await updateAgentOrderStatus(orderId, status);
    await loadOrders();
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    out_for_delivery: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Agent Orders</h1>
        <p className="text-slate-600 mt-1">Orders placed by call center agents</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "confirmed", "out_for_delivery", "delivered", "cancelled"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                filter === s
                  ? "bg-orange-100 text-orange-700 border-orange-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          )
        )}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.$id} className="bg-white border rounded-lg p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Order #{order.$id.slice(-6)}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.$createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[order.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                    <User className="w-3 h-3" /> Customer
                  </p>
                  <p className="font-medium text-slate-900">{order.customer_name}</p>
                  <p className="text-sm text-slate-600">{formatPhone(order.customer_phone)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> Address
                  </p>
                  <p className="text-sm text-slate-700">{order.address}</p>
                  <p className="text-sm text-slate-600">{order.city}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Items</p>
                <div className="space-y-1">
                  {(Array.isArray(order.items) ? order.items : []).map(
                    (item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-slate-700">
                          {item.product_name} x {item.quantity_kg}kg
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {order.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-slate-500">Notes</p>
                  <p className="text-sm text-slate-700">{order.notes}</p>
                </div>
              )}

              {/* Status Actions */}
              <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(order.$id, "confirmed")}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.$id, "cancelled")}
                      className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <button
                    onClick={() => handleStatusUpdate(order.$id, "out_for_delivery")}
                    className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700"
                  >
                    Out for Delivery
                  </button>
                )}
                {order.status === "out_for_delivery" && (
                  <button
                    onClick={() => handleStatusUpdate(order.$id, "delivered")}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700"
                  >
                    Mark Delivered
                  </button>
                )}
                <span className="text-xs text-slate-500 ml-auto flex items-center">
                  Agent: {order.agent_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
