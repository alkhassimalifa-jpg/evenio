"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Ticket, User, LogOut, Search, Bell } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrate, logout } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const handleOpenNotifs = () => {
    setShowNotifs((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { href: "/", label: "Decouvrir", icon: Search },
    { href: "/mes-billets", label: "Mes billets", icon: Ticket },
    { href: user?.role === "ORGANIZER" || user?.role === "ADMIN" ? "/dashboard" : "/profil", label: user?.role === "ORGANIZER" || user?.role === "ADMIN" ? "Organiser" : "Profil", icon: user?.role === "ORGANIZER" || user?.role === "ADMIN" ? Calendar : User },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header desktop/mobile */}
      <header className="bg-wa-deep text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-extrabold text-xl tracking-tight">
            Evenio
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-medium text-sm">
            <Link href="/" className="hover:text-wa-accent transition-colors">Decouvrir</Link>
            {user && <Link href="/mes-billets" className="hover:text-wa-accent transition-colors">Mes billets</Link>}
            {(user?.role === "ORGANIZER" || user?.role === "ADMIN") && (
              <Link href="/dashboard" className="hover:text-wa-accent transition-colors">Tableau de bord</Link>
            )}
            {user && (
              <Link href="/profil" className="hover:text-wa-accent transition-colors">Profil</Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <div className="relative">
                <button
                  onClick={handleOpenNotifs}
                  className="relative p-2 hover:text-wa-accent transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-wa-accent text-wa-deep text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-panel text-ink rounded-2xl border border-border shadow-lg z-50">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="font-display font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-wa-teal font-semibold hover:underline">
                          Tout marquer lu
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted text-center py-8">Aucune notification.</p>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                            className={`text-left p-4 border-b border-border last:border-0 hover:bg-surface transition-colors ${
                              !n.isRead ? "bg-wa-accent/5" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-wa-accent mt-1.5 flex-shrink-0" />}
                              <div>
                                <p className="text-sm font-semibold text-ink">{n.title}</p>
                                <p className="text-xs text-muted mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-muted mt-1">
                                  {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user ? (
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-wa-accent transition-colors"
              >
                <LogOut size={16} /> Deconnexion
              </button>
            ) : (
              <>
                <Link href="/connexion" className="text-sm font-medium hover:text-wa-accent transition-colors">
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="bg-wa-accent hover:bg-wa-accentDark text-wa-deep font-semibold text-sm px-4 py-2 rounded-full transition-colors"
                >
                  Creer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Navigation basse mobile, style tabs WhatsApp */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-panel border-t border-border z-40">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 text-xs font-medium ${
                    active ? "text-wa-teal" : "text-muted"
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}