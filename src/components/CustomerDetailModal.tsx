"use client";

import { useRouter } from "next/navigation";
import { UnifiedCustomer } from "@/lib/types";
import { formatCurrency, formatPhone } from "@/lib/utils";
import {
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  User,
  X,
} from "lucide-react";

interface CustomerDetailModalProps {
  customer: UnifiedCustomer;
}

export default function CustomerDetailModal({
  customer,
}: CustomerDetailModalProps) {
  const router = useRouter();

  const sourceBadge =
    customer.source === "website"
      ? "bg-blue-100 text-blue-800"
      : "bg-orange-100 text-orange-800";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) router.back();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {customer.fullName || "Unknown Customer"}
              </h2>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${sourceBadge}`}
              >
                {customer.source === "website" ? "Website" : "WordPress"}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(customer.lifetimeValue)}
              </p>
              <p className="text-xs text-slate-600">Lifetime Value</p>
            </div>
            <div className="bg-blue-50 border rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">
                {customer.orderCount}
              </p>
              <p className="text-xs text-slate-600">Orders</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {formatPhone(customer.phone)}
                </p>
                <p className="text-xs text-slate-500">Phone</p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {customer.email}
                  </p>
                  <p className="text-xs text-slate-500">Email</p>
                </div>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {customer.city}
                  </p>
                  <p className="text-xs text-slate-500">City</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {customer.lastOrderDate && (
            <div className="flex items-center gap-2 text-sm text-slate-600 pt-4 border-t">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>{customer.orderCount} orders</span>
              <span className="text-slate-300">|</span>
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
          <a
            href={`/customers/${customer.phone}`}
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Full Details
          </a>
        </div>
      </div>
    </div>
  );
}
