import Link from "next/link";
import {
  getWebsiteCustomers,
  getWordPressCustomers,
} from "@/lib/services/customer-service";
import { getCallStats } from "@/lib/services/call-service";
import { getAgentOrdersToday } from "@/lib/services/order-service";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Phone,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Upload,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const [websiteCustomers, wpCustomers, callStats, todayOrders] =
    await Promise.all([
      getWebsiteCustomers(),
      getWordPressCustomers(),
      getCallStats(),
      getAgentOrdersToday(),
    ]);

  const wpCount = wpCustomers.length;
  const webCount = websiteCustomers.length;
  const totalUnique = wpCount + webCount;
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_price, 0);

  const stats = [
    {
      label: "WordPress Customers",
      value: wpCount,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Website Customers",
      value: webCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Unique",
      value: totalUnique,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Calls Today",
      value: callStats.totalCallsToday,
      icon: Phone,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Orders Today",
      value: todayOrders.length,
      icon: ShoppingBag,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Revenue Today",
      value: formatCurrency(todayRevenue),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  // Top customers by value
  // Combine for dashboard displays (website + deduplicated wordpress)
  const allCustomers = [...websiteCustomers, ...wpCustomers];
  const topCustomers = [...allCustomers]
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
    .slice(0, 5);

  // Customers who haven't ordered recently (retargeting candidates)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const retargetingCandidates = allCustomers
    .filter(
      (c) => !c.lastOrderDate || new Date(c.lastOrderDate) < thirtyDaysAgo,
    )
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Retargeting Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Call center overview and customer retargeting metrics
          <span className="ml-2 text-orange-600 font-medium">
            — Agent dashboard
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-lg p-4 border`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Customers */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Top Customers by Value
            </h2>
            <Link
              href="/customers"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topCustomers.map((customer) => (
              <Link
                key={customer.phone}
                href={`/customers/${customer.phone}`}
                className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {customer.fullName || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(customer.lifetimeValue)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {customer.orderCount} orders
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Retargeting Candidates */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Retargeting Candidates
            </h2>
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">No recent orders</span>
            </div>
          </div>
          <div className="space-y-3">
            {retargetingCandidates.map((customer) => (
              <Link
                key={customer.phone}
                href={`/customers/${customer.phone}`}
                className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {customer.fullName || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(customer.lifetimeValue)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Last:{" "}
                    {customer.lastOrderDate
                      ? new Date(customer.lastOrderDate).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Link
          href="/upload"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Upload CSV</p>
            <p className="text-xs text-slate-500">Import WordPress customers</p>
          </div>
        </Link>
        <Link
          href="/customers"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Browse Customers</p>
            <p className="text-xs text-slate-500">Search by phone or name</p>
          </div>
        </Link>
        <Link
          href="/calls"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Call Logs</p>
            <p className="text-xs text-slate-500">
              View call history & follow-ups
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
