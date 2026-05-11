"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UnifiedCustomer } from "@/lib/types";
import CustomerCard from "@/components/CustomerCard";
import { Search, Users, SlidersHorizontal } from "lucide-react";

type SortOption = "value" | "orders" | "recent" | "name";

interface CustomersFilterProps {
  customers: UnifiedCustomer[];
  source: "website" | "wordpress";
}

export default function CustomersFilter({ customers, source }: CustomersFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("value");
  const [cityFilter, setCityFilter] = useState("");

  const filtered = useMemo(() => {
    let result = [...customers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q),
      );
    }

    if (cityFilter) {
      result = result.filter((c) =>
        c.city.toLowerCase().includes(cityFilter.toLowerCase()),
      );
    }

    switch (sortBy) {
      case "value":
        result.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
        break;
      case "orders":
        result.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case "recent":
        result.sort((a, b) => {
          if (!a.lastOrderDate) return 1;
          if (!b.lastOrderDate) return -1;
          return (
            new Date(b.lastOrderDate).getTime() -
            new Date(a.lastOrderDate).getTime()
          );
        });
        break;
      case "name":
        result.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
    }

    return result;
  }, [customers, search, sortBy, cityFilter]);

  const cities = useMemo(
    () =>
      Array.from(new Set(customers.map((c) => c.city).filter(Boolean))).sort(),
    [customers],
  );

  const handleSourceChange = (newSource: "website" | "wordpress") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", newSource);
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
        <p className="text-slate-600 mt-1">
          {customers.length} total customers —{" "}
          <span className="font-medium capitalize">{source}</span>
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="value">Sort by Value</option>
              <option value="orders">Sort by Orders</option>
              <option value="recent">Sort by Recent</option>
              <option value="name">Sort by Name</option>
            </select>
            <select
              value={source}
              onChange={(e) =>
                handleSourceChange(e.target.value as "website" | "wordpress")
              }
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="website">Website Only</option>
              <option value="wordpress">WordPress Only</option>
            </select>
          </div>
        </div>
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 mt-1" />
            <button
              onClick={() => setCityFilter("")}
              className={`text-xs px-2 py-1 rounded-full border ${
                cityFilter === ""
                  ? "bg-orange-100 text-orange-700 border-orange-200"
                  : "bg-white text-slate-600"
              }`}
            >
              All Cities
            </button>
            {cities.slice(0, 15).map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city === cityFilter ? "" : city)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  cityFilter === city
                    ? "bg-orange-100 text-orange-700 border-orange-200"
                    : "bg-white text-slate-600"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-lg">No customers found</p>
          <p className="text-slate-400 text-sm mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">
            {filtered.length} results
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((customer) => (
              <CustomerCard key={customer.phone} customer={customer} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
