"use client";

import { useState } from "react";
import { createAgentOrder } from "@/lib/services/order-service";
import { createCallLog } from "@/lib/services/call-service";
import { AgentOrderItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface OrderFormProps {
  customerPhone: string;
  customerName: string;
  city: string;
  agentName: string;
  onSuccess?: () => void;
}

export default function OrderForm({
  customerPhone,
  customerName,
  city,
  agentName,
  onSuccess,
}: OrderFormProps) {
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<AgentOrderItem[]>([
    { product_name: "", quantity_kg: 1, price_per_kg: 0, total: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  const updateItem = (
    index: number,
    field: keyof AgentOrderItem,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "quantity_kg" || field === "price_per_kg") {
      newItems[index].total =
        newItems[index].quantity_kg * newItems[index].price_per_kg;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { product_name: "", quantity_kg: 1, price_per_kg: 0, total: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalPrice = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const order = await createAgentOrder({
        customer_phone: customerPhone,
        customer_name: customerName,
        address,
        city,
        items,
        total_price: totalPrice,
        agent_name: agentName,
        notes,
      });

      if (order) {
        await createCallLog({
          customer_phone: customerPhone,
          customer_name: customerName,
          agent_name: agentName,
          response_type: "answered_ordered",
          notes: `Order placed: ${order.$id}. ${notes}`,
          order_placed: true,
          order_id: order.$id,
        });
      }

      setAddress("");
      setNotes("");
      setItems([
        { product_name: "", quantity_kg: 1, price_per_kg: 0, total: 0 },
      ]);
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
          Delivery Address
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          required
          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Full delivery address..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Order Items
        </label>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={item.product_name}
                  onChange={(e) =>
                    updateItem(index, "product_name", e.target.value)
                  }
                  placeholder="Product name"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  value={item.quantity_kg}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "quantity_kg",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="KG"
                  min="0.5"
                  step="0.5"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="w-28">
                <input
                  type="number"
                  value={item.price_per_kg}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "price_per_kg",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="Price/kg"
                  min="0"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="w-24 text-right text-sm font-medium text-slate-700 py-2">
                {formatCurrency(item.total)}
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 text-sm px-2"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          + Add Item
        </button>
      </div>

      <div className="flex justify-between items-center pt-3 border-t">
        <span className="text-sm text-slate-600">Total:</span>
        <span className="text-xl font-bold text-green-600">
          {formatCurrency(totalPrice)}
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Order Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Any special instructions..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || items.some((i) => !i.product_name)}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? "Placing Order..." : "Place Order"}
      </button>
    </form>
  );
}
