import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 12)}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `+92 ${digits.slice(1, 4)} ${digits.slice(4, 11)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return "92" + digits.slice(1);
  }
  if (digits.length === 10) {
    return "92" + digits;
  }
  return digits;
}

export function getResponseTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    answered_ordered: "Answered & Ordered",
    answered_interested: "Answered - Interested",
    answered_not_interested: "Answered - Not Interested",
    callback_later: "Callback Later",
    no_answer: "No Answer",
    wrong_number: "Wrong Number",
    dnd: "DND / Do Not Disturb",
    not_reachable: "Not Reachable",
  };
  return labels[type] || type;
}

export function getResponseTypeColor(type: string): string {
  const colors: Record<string, string> = {
    answered_ordered: "bg-green-100 text-green-800 border-green-200",
    answered_interested: "bg-blue-100 text-blue-800 border-blue-200",
    answered_not_interested: "bg-red-100 text-red-800 border-red-200",
    callback_later: "bg-yellow-100 text-yellow-800 border-yellow-200",
    no_answer: "bg-gray-100 text-gray-800 border-gray-200",
    wrong_number: "bg-orange-100 text-orange-800 border-orange-200",
    dnd: "bg-purple-100 text-purple-800 border-purple-200",
    not_reachable: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}
