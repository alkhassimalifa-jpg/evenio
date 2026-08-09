"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Category { id: string; name: string; }
interface MyEvent {
  id: string;
  title: string;
  status: string;
  city: string;
  startDate: string;
  tickets: { id: string; name: string; price: number; quantity: number; quantitySold: number }[];
}

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketModalEventId, setTicketModalEventId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", location: "", city: "",
    startDate: "", endDate: "", capacity: "", categoryId: "", isFree: false,
  });

  const loadData = async () => {
    try {
      const [eventsRes, catRes] = await Promise.all([
        api.get("/events/my/events"),
        api.get("/categories"),
      ]);
      setEvents(eventsRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/events", form);
      toast.success("Evenement cree en brouillon");
      setShowForm(false);
      setForm({ title: "", description: "", location: "", city: "", startDate: "", endDate: "", capacity: "", categoryId: "", isFree: false });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la creation");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/events/${id}/status`, { status: "PUBLISHED" });
      toast.success("Evenement publie");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  if (loading) return <p className="text-muted text-sm">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-ink">Mes evenements</h2>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5">
          <Plus size={16} /> {showForm ? "Annuler" : "Creer un evenement"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-panel rounded-bubble border border-border p-5 mb-6 flex flex-col gap-4">
          <Input label="Titre" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Description</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-wa-teal outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Lieu" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input label="Ville" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de debut" type="datetime-local" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Date de fin" type="datetime-local" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Capacite" type="number" min="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Categorie</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink focus:border-wa-teal outline-none"
              >
                <option value="">Choisir...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} />
            Evenement gratuit
          </label>

          <Button type="submit" disabled={submitting} fullWidth>
            {submitting ? "Creation..." : "Creer l'evenement (brouillon)"}
          </Button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {events.map((e) => (
          <div key={e.id} className="bg-panel rounded-bubble border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-ink">{e.title}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {e.city} · {new Date(e.startDate).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                e.status === "PUBLISHED" ? "bg-wa-accent/20 text-wa-accentDark" : "bg-gray-100 text-gray-600"
              }`}>
                {e.status === "PUBLISHED" ? "Publie" : e.status === "DRAFT" ? "Brouillon" : e.status}
              </span>
            </div>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setTicketModalEventId(e.id)}
                className="text-xs font-semibold text-wa-teal hover:underline"
              >
                Gerer les billets ({e.tickets.length})
              </button>
              {e.status === "DRAFT" && (
                <button onClick={() => handlePublish(e.id)} className="text-xs font-semibold text-wa-accentDark hover:underline">
                  Publier
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {ticketModalEventId && (
        <TicketModal
          eventId={ticketModalEventId}
          onClose={() => { setTicketModalEventId(null); loadData(); }}
        />
      )}
    </div>
  );
}

function TicketModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", type: "STANDARD", price: "", quantity: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const res = await api.get(`/tickets/event/${eventId}`);
    setTickets(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/tickets/event/${eventId}`, form);
      toast.success("Billet ajoute");
      setForm({ name: "", type: "STANDARD", price: "", quantity: "" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-panel">
          <h2 className="font-display font-bold text-ink">Billets</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-2 mb-5">
            {tickets.map((t) => (
              <div key={t.id} className="flex justify-between items-center bg-surface rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{Number(t.price).toLocaleString()} FCFA · {t.quantitySold}/{t.quantity} vendus</p>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-sm text-muted">Aucun billet pour le moment.</p>}
          </div>

          <form onSubmit={handleAdd} className="flex flex-col gap-3 pt-4 border-t border-border">
            <p className="text-sm font-semibold text-ink">Ajouter un type de billet</p>
            <Input label="Nom" placeholder="Standard, VIP..." required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink outline-none"
              >
                <option value="STANDARD">Standard</option>
                <option value="VIP">VIP</option>
                <option value="EARLY_BIRD">Early Bird</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prix (FCFA)" type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input label="Quantite" type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <Button type="submit" disabled={submitting} fullWidth>
              {submitting ? "Ajout..." : "Ajouter le billet"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}