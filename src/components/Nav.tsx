"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Phone,
  ShoppingBag,
  Upload,
  Target,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appwriteAccount } from "@/lib/appwrite-auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/upload", label: "Upload CSV", icon: Upload },
];

interface NavProps {
  agentName?: string;
}

export default function Nav({ agentName }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await appwriteAccount.deleteSession("current");
    } catch {
      // ignore if already logged out
    }
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 mr-8">
              <Target className="w-6 h-6 text-orange-400" />
              <span className="font-bold text-lg">Retargeting</span>
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-800 text-orange-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {agentName && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-slate-300">
                <User className="w-4 h-4" />
                <span className="capitalize">{agentName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
