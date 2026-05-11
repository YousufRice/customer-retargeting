import { Suspense } from "react";
import { getCustomersBySource } from "@/lib/services/customer-service";
import CustomersFilter from "@/components/CustomersFilter";

interface CustomersPageProps {
  searchParams: Promise<{ source?: string }>;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;
  const source: "website" | "wordpress" =
    params.source === "wordpress" ? "wordpress" : "website";

  const customers = await getCustomersBySource(source);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={null}>
        <CustomersFilter customers={customers} source={source} />
      </Suspense>
    </div>
  );
}
