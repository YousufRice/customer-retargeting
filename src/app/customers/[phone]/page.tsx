import { notFound } from "next/navigation";
import { getUnifiedCustomerByPhone, getExistingCustomerOrders, getOrderItems, getOrderAddress } from "@/lib/services/customer-service";
import { getCallLogs } from "@/lib/services/call-service";
import { formatCurrency, formatPhone, getResponseTypeLabel, getResponseTypeColor } from "@/lib/utils";
import { Phone, Mail, MapPin, ShoppingBag, Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CallLogForm from "@/components/CallLogForm";
import OrderForm from "@/components/OrderForm";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  const customer = await getUnifiedCustomerByPhone(phone);

  if (!customer) {
    notFound();
  }

  const [callLogs, orders] = await Promise.all([
    getCallLogs(customer.phone, 20),
    customer.websiteData ? getExistingCustomerOrders(customer.websiteData.$id) : Promise.resolve([]),
  ]);

  // Fetch order details
  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      const [items, address] = await Promise.all([
        getOrderItems(order.$id),
        getOrderAddress(order.$id),
      ]);
      return { ...order, items, address };
    })
  );

  const sourceBadge =
    customer.source === "both"
      ? "bg-green-100 text-green-800"
      : customer.source === "website"
      ? "bg-blue-100 text-blue-800"
      : "bg-orange-100 text-orange-800";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      {/* Customer Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-slate-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {customer.fullName || "Unknown Customer"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge}`}>
                  {customer.source === "both" ? "WordPress + Website" : customer.source === "website" ? "Website" : "WordPress"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.lifetimeValue)}</p>
            <p className="text-sm text-slate-500">Lifetime Value</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900">{formatPhone(customer.phone)}</p>
              <p className="text-xs text-slate-500">Phone</p>
            </div>
          </div>
          {customer.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">{customer.email}</p>
                <p className="text-xs text-slate-500">Email</p>
              </div>
            </div>
          )}
          {customer.city && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">{customer.city}</p>
                <p className="text-xs text-slate-500">City</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order History */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Order History</h2>
            <span className="ml-auto text-sm text-slate-500">{ordersWithDetails.length} orders</span>
          </div>

          {ordersWithDetails.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No orders from website yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {ordersWithDetails.map((order) => (
                <div key={order.$id} className="border rounded-md p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">Order #{order.$id.slice(-6)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "returned"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.$id} className="flex justify-between text-sm">
                        <span className="text-slate-700">{item.product_name} x {item.quantity_kg}kg</span>
                        <span className="font-medium">{formatCurrency(item.total_after_discount)}</span>
                      </div>
                    ))}
                  </div>
                  {order.address && (
                    <p className="text-xs text-slate-500 mt-2">{order.address.address_line}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.$createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-slate-900">{formatCurrency(order.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Call Log + Order Form */}
        <div className="space-y-6">
          {/* Place Order */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Place Order</h2>
            <OrderForm
              customerPhone={customer.phone}
              customerName={customer.fullName}
              city={customer.city}
              agentName="Agent"
            />
          </div>

          {/* Log Call */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Log Call</h2>
            <CallLogForm
              customerPhone={customer.phone}
              customerName={customer.fullName}
              agentName="Agent"
            />
          </div>

          {/* Call History */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Call History</h2>
            {callLogs.length === 0 ? (
              <p className="text-slate-500 text-sm">No calls logged yet.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {callLogs.map((log) => (
                  <div key={log.$id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getResponseTypeColor(log.response_type)}`}>
                        {getResponseTypeLabel(log.response_type)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.$createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.notes && <p className="text-sm text-slate-700 mt-1">{log.notes}</p>}
                    {log.follow_up_date && (
                      <p className="text-xs text-amber-600 mt-1">
                        Follow-up: {new Date(log.follow_up_date).toLocaleString()}
                      </p>
                    )}
                    {log.order_placed && (
                      <p className="text-xs text-green-600 mt-1 font-medium">Order placed</p>
                    )}
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
