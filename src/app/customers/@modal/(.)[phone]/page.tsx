import { notFound } from "next/navigation";
import { getCustomerByPhone } from "@/lib/services/customer-service";
import CustomerDetailModal from "@/components/CustomerDetailModal";

export default async function CustomerModalPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  const customer = await getCustomerByPhone(phone);

  if (!customer) {
    notFound();
  }

  return <CustomerDetailModal customer={customer} />;
}
