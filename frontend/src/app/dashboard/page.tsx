"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Ticket, Calendar, Users, Download, Wallet, Clock } from "lucide-react";
import api from "@/lib/api";

interface EventStat {
  id: string;
  title: string;
  status: string;
  capacity: number;
  ticketsSold: number;
  fillRate: number;
  revenue: number;
  availableRevenue: number;
  pendingRevenue: number;
  unlockDate: string | null;
  attendeesCount: number;
  reviewsCount: number;
}

interface Stats {
  summary: {
    totalEvents: number;
    totalRevenue: number;
    totalAvailable: number;
    totalPending: number;
    totalTicketsSold: number;
    globalFillRate: number;
  };
  events: EventStat[];
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExport = async (eventId: string, title: string) => {
    try {
      const res = await api.get(`/dashboard/export/${eventId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `participants-${title}.csv`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-muted text-sm">Chargement des statistiques...</p>;
  if (!stats) return <p className="text-muted text-sm">Aucune donnee disponible.</p>;

  const cards = [
    { label: "Evenements", value: stats.summary.totalEvents, icon: Calendar },
    { label: "Revenu total", value: `${stats.summary.totalRevenue.toLocaleString()} FCFA`, icon: TrendingUp },
    { label: "Disponible", value: `${stats.summary.totalAvailable.toLocaleString()} FCFA`, icon: Wallet, highlight: true },
    { label: "En attente", value: `${stats.summary.totalPending.toLocaleString()} FCFA`, icon: Clock },
    { label: "Billets vendus", value: stats.summary.totalTicketsSold, icon: Ticket },
    { label: "Taux de remplissage", value: `${stats.summary.globalFillRate}%`, icon: Users },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-bubble border p-4 ${
                c.highlight ? "bg-wa-accent/10 border-wa-accent/30" : "bg-panel border-border"
              }`}
            >
              <Icon size={18} className={c.highlight ? "text-wa-accentDark mb-2" : "text-wa-teal mb-2"} />
              <p className="font-display font-bold text-xl text-ink">{c.value}</p>
              <p className="text-xs text-muted">{c.label}</p>
            </div>
          );
        })}
      </div>

      <h2 className="font-display font-bold text-ink mb-4">Performance par evenement</h2>

      {stats.events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-3">Tu n&apos;as pas encore cree d&apos;evenement.</p>
          <Link href="/dashboard/organizer/events" className="text-wa-teal font-semibold hover:underline">
            Creer mon premier evenement
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {stats.events.map((e) => (
            <div key={e.id} className="bg-panel rounded-bubble border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-ink">{e.title}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {e.ticketsSold}/{e.capacity} billets · {e.revenue.toLocaleString()} FCFA · {e.attendeesCount} participant{e.attendeesCount > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleExport(e.id, e.title)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-wa-teal hover:underline flex-shrink-0"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>

              {e.revenue > 0 && (
                <div className="mt-3">
                  {e.availableRevenue > 0 ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-wa-accent/20 text-wa-accentDark">
                      {e.availableRevenue.toLocaleString()} FCFA disponible
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      {e.pendingRevenue.toLocaleString()} FCFA en attente
                      {e.unlockDate && ` · debloque le ${new Date(e.unlockDate).toLocaleDateString("fr-FR")}`}
                    </span>
                  )}
                </div>
              )}

              <div className="w-full h-2 bg-surface rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-wa-accent rounded-full transition-all"
                  style={{ width: `${e.fillRate}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">{e.fillRate}% de remplissage</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}