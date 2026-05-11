"use client";

import Link from "next/link";
import { UnifiedCustomer } from "@/lib/types";
import { formatCurrency, formatPhone, getResponseTypeColor } from "@/lib/utils";
import { Phone, Mail, MapPin, ShoppingBag, Calendar } from "lucide-react";

interface CustomerCardProps {
  customer: UnifiedCustomer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const sourceColor =
    customer.source === "website"
      ? "bg-blue-100 text-blue-800"
      : "bg-orange-100 text-orange-800";

  const sourceLabel = customer.source === "website" ? "Website" : "WordPress";

  return (
    <Link href={`/customers/${customer.phone}`}>
      <div className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-slate-900">
              {customer.fullName || "Unknown"}
            </h3>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${sourceColor}`}
            >
              {sourceLabel}
            </span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(customer.lifetimeValue)}
            </p>
            <p className="text-xs text-slate-500">Lifetime Value</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{formatPhone(customer.phone)}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.city && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{customer.city}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            <span>{customer.orderCount} orders</span>
          </div>
          {customer.lastOrderDate && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>
                Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
