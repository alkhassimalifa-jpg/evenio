"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, PlusCircle, ScanLine, ShieldCheck, Gavel, Users } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user && user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, router]);

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-muted">Acces reserve aux organisateurs.</div>;
  }

  const tabs = [
    { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/dashboard/organizer/events", label: "Mes evenements", icon: PlusCircle },
    { href: "/dashboard/organizer/checkin", label: "Check-in", icon: ScanLine },
    { href: "/dashboard/organizer/verification", label: "Verification", icon: ShieldCheck },
    ...(user.role === "ADMIN" ? [
      { href: "/dashboard/admin/moderation", label: "Moderation", icon: Gavel },
      { href: "/dashboard/admin/users", label: "Utilisateurs", icon: Users },
    ] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Tableau de bord</h1>

      <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active ? "border-wa-teal text-wa-teal" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}