"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import EventCard from "@/components/events/EventCard";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  city: string;
  startDate: string;
  imageUrl?: string | null;
  isFree: boolean;
  category: { name: string };
  tickets: { price: number }[];
}

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEvents = async (query = "") => {
    setLoading(true);
    try {
      const res = await api.get("/events", { params: query ? { search: query } : {} });
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(search);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-wa-deep text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold max-w-2xl leading-tight">
            Trouve ton prochain evenement, reserve ta place en 2 minutes
          </h1>
          <p className="text-white/80 mt-4 max-w-xl">
            Conferences, concerts, ateliers, formations — decouvre ce qui se passe pres de toi.
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-xl">
            <div className="flex items-center bg-white rounded-full pl-5 pr-2 py-2 gap-2">
              <Search size={18} className="text-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Rechercher un evenement, une ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-ink text-sm outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                className="bg-wa-accent hover:bg-wa-accentDark text-wa-deep font-semibold text-sm px-5 py-2.5 rounded-full transition-colors flex-shrink-0"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Liste des evenements */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-display text-xl font-bold text-ink mb-6">
          {search ? `Resultats pour "${search}"` : "Evenements a venir"}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-panel rounded-bubble border border-border animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted">Aucun evenement trouve pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard
                key={event.id}
                slug={event.slug}
                title={event.title}
                city={event.city}
                startDate={event.startDate}
                imageUrl={event.imageUrl}
                isFree={event.isFree}
                category={event.category}
                minPrice={event.tickets?.length ? Math.min(...event.tickets.map((t) => t.price)) : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}