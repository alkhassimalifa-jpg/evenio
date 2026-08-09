"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Star, Flag } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useCheckoutStore } from "@/store/checkout.store";
import Button from "@/components/ui/Button";

interface Ticket {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
  quantitySold: number;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  isFree: boolean;
  category: { name: string };
  organizer: { firstName: string; lastName: string };
  tickets: Ticket[];
  reviews: { rating: number; comment?: string; user: { firstName: string; lastName: string } }[];
  _count: { attendees: number };
}

export default function EventDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const setCheckout = useCheckoutStore((s) => s.setCheckout);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/slug/${slug}`);
        setEvent(res.data);

        if (user) {
          try {
            const wlRes = await api.get(`/waitlist/${res.data.id}/status`);
            setOnWaitlist(wlRes.data.onWaitlist);
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchEvent();
  }, [slug, user]);

  const updateCart = (ticketId: string, delta: number, max: number) => {
    setCart((prev) => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [ticketId]: next };
    });
  };

  const totalAmount = event
    ? event.tickets.reduce((sum, t) => sum + (cart[t.id] || 0) * Number(t.price), 0)
    : 0;
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleBuy = () => {
    if (!user) {
      toast.error("Connecte-toi pour reserver des billets");
      router.push("/connexion");
      return;
    }
    if (!event) return;

    const items = event.tickets
      .filter((t) => (cart[t.id] || 0) > 0)
      .map((t) => ({
        ticketId: t.id,
        name: t.name,
        price: Number(t.price),
        quantity: cart[t.id],
      }));

    if (items.length === 0) {
      toast.error("Selectionne au moins un billet");
      return;
    }

    setCheckout(event.id, event.title, items);
    router.push("/checkout");
  };

  const handleReport = async () => {
    if (!user) {
      toast.error("Connecte-toi pour signaler un evenement");
      router.push("/connexion");
      return;
    }
    if (!reportReason.trim()) {
      toast.error("Precise le motif du signalement");
      return;
    }
    setReporting(true);
    try {
      await api.post("/events/report", { eventId: event!.id, reason: reportReason.trim() });
      toast.success("Signalement envoye, merci pour ta vigilance");
      setShowReportModal(false);
      setReportReason("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors du signalement");
    } finally {
      setReporting(false);
    }
  };
  const handleJoinWaitlist = async () => {
    if (!user) {
      toast.error("Connecte-toi pour rejoindre la liste d'attente");
      router.push("/connexion");
      return;
    }
    setWaitlistLoading(true);
    try {
      await api.post("/waitlist", { eventId: event!.id });
      toast.success("Tu es inscrit sur la liste d'attente");
      setOnWaitlist(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur");
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-muted">Chargement...</div>;
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-muted">Evenement introuvable.</p>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const avgRating = event.reviews.length
    ? (event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="h-56 md:h-80 bg-gradient-to-br from-wa-teal to-wa-deep relative">
        {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-wa-teal uppercase tracking-wide">{event.category.name}</span>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink mt-1">{event.title}</h1>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-red-500 transition-colors flex-shrink-0 mt-1"
            >
              <Flag size={14} /> Signaler
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} />
              {startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={16} />
              {event.location}, {event.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={16} />
              {event._count.attendees} participant{event._count.attendees > 1 ? "s" : ""}
            </span>
            {avgRating && (
              <span className="flex items-center gap-1.5">
                <Star size={16} className="fill-wa-accent text-wa-accent" />
                {avgRating} ({event.reviews.length} avis)
              </span>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h2 className="font-display font-bold text-ink mb-2">A propos de cet evenement</h2>
            <p className="text-ink/80 whitespace-pre-line leading-relaxed">{event.description}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h2 className="font-display font-bold text-ink mb-2">Organise par</h2>
            <p className="text-ink/80">{event.organizer.firstName} {event.organizer.lastName}</p>
          </div>

          {event.reviews.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h2 className="font-display font-bold text-ink mb-4">Avis ({event.reviews.length})</h2>
              <div className="flex flex-col gap-4">
                {event.reviews.map((r, i) => (
                  <div key={i} className="bg-panel rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-ink">{r.user.firstName} {r.user.lastName}</span>
                      <span className="flex items-center gap-1 text-xs text-wa-accentDark">
                        <Star size={12} className="fill-wa-accent text-wa-accent" /> {r.rating}/5
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bloc billetterie */}
        <div className="md:col-span-1">
          <div className="sticky top-20 bg-panel rounded-bubble border border-border p-5">
            <h2 className="font-display font-bold text-ink mb-4">Billets</h2>

            {event.tickets.length === 0 ? (
              <p className="text-sm text-muted">Aucun billet disponible pour le moment.</p>
            ) : event.tickets.every((t) => t.quantity - t.quantitySold <= 0) ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <p className="text-sm font-semibold text-ink">Complet</p>
                <p className="text-xs text-muted">
                  Tous les billets sont ecoules. Inscris-toi sur la liste d&apos;attente pour etre prevenu si une place se libere.
                </p>
                {onWaitlist ? (
                  <span className="text-xs font-semibold px-3 py-2 rounded-full bg-wa-accent/20 text-wa-accentDark">
                    Tu es sur la liste d&apos;attente
                  </span>
                ) : (
                  <Button onClick={handleJoinWaitlist} disabled={waitlistLoading} fullWidth>
                    {waitlistLoading ? "Inscription..." : "Rejoindre la liste d'attente"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {event.tickets.map((t) => {
                  const available = t.quantity - t.quantitySold;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-ink">{t.name}</p>
                        <p className="text-xs text-muted">
                          {Number(t.price) === 0 ? "Gratuit" : `${Number(t.price).toLocaleString()} FCFA`}
                          {" · "}{available} restant{available > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCart(t.id, -1, available)}
                          disabled={!cart[t.id]}
                          className="w-7 h-7 rounded-full border border-border text-ink disabled:opacity-30 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{cart[t.id] || 0}</span>
                        <button
                          onClick={() => updateCart(t.id, 1, available)}
                          disabled={available === 0 || (cart[t.id] || 0) >= available}
                          className="w-7 h-7 rounded-full border border-border text-ink disabled:opacity-30 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted">Total</span>
                  <span className="font-display font-bold text-lg text-ink">{totalAmount.toLocaleString()} FCFA</span>
                </div>

                <Button onClick={handleBuy} disabled={totalItems === 0} fullWidth>
                  {totalItems > 0 ? `Continuer vers le paiement (${totalItems})` : "Selectionner des billets"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-panel rounded-2xl max-w-sm w-full p-5">
            <h2 className="font-display font-bold text-ink mb-1">Signaler cet evenement</h2>
            <p className="text-sm text-muted mb-4">
              Explique brievement pourquoi cet evenement te semble suspect ou problematique.
            </p>
            <textarea
              rows={4}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Ex: Informations incoherentes, organisateur injoignable..."
              className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-wa-teal outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowReportModal(false); setReportReason(""); }}
                className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold text-ink"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={reporting}
                className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {reporting ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}