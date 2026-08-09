"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Phone, PhoneOff } from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";

interface PendingEvent {
  id: string;
  title: string;
  city: string;
  startDate: string;
  organizer: { firstName: string; lastName: string; email: string; phoneVerified: boolean };
  category: { name: string };
}

export default function ModerationPage() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get("/events/admin/pending");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      await api.patch(`/events/admin/${id}/moderate`, { decision });
      toast.success(decision === "APPROVED" ? "Evenement approuve et publie" : "Evenement rejete");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p className="text-muted text-sm">Chargement...</p>;

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Aucun evenement en attente de moderation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display font-bold text-ink mb-2">
        Evenements en attente ({events.length})
      </h2>

      {events.map((e) => (
        <div key={e.id} className="bg-panel rounded-bubble border border-border p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-ink">{e.title}</h3>
              <p className="text-xs text-muted mt-0.5">
                {e.category.name} · {e.city} · {new Date(e.startDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <div className="flex-1">
              <p className="text-sm text-ink">{e.organizer.firstName} {e.organizer.lastName}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                {e.organizer.phoneVerified ? (
                  <><Phone size={12} className="text-wa-accentDark" /> Telephone verifie</>
                ) : (
                  <><PhoneOff size={12} className="text-red-500" /> Telephone non verifie</>
                )}
              </p>
            </div>

            <button
              onClick={() => handleDecision(e.id, "REJECTED")}
              disabled={processingId === e.id}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
            >
              <XCircle size={15} /> Rejeter
            </button>
            <Button
              onClick={() => handleDecision(e.id, "APPROVED")}
              disabled={processingId === e.id}
              className="flex items-center gap-1.5 !py-2 !px-3 text-xs"
            >
              <CheckCircle2 size={15} /> Approuver
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}