"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, QrCode, X } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  ticket: { name: string; type: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  event: { title: string; slug: string; startDate: string; city: string; imageUrl?: string | null };
  items: OrderItem[];
  payment?: { method: string; status: string };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PAID: { label: "Confirme", color: "bg-wa-accent/20 text-wa-accentDark" },
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  CANCELLED: { label: "Annule", color: "bg-red-100 text-red-600" },
  REFUNDED: { label: "Rembourse", color: "bg-gray-100 text-gray-600" },
};

export default function MyTicketsPage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ orderId: string; eventTitle: string } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/my");
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-muted mb-4">Connecte-toi pour voir tes billets.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Mes billets</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted mb-4">Tu n&apos;as pas encore reserve d&apos;evenement.</p>
          <button onClick={() => router.push("/")} className="text-wa-teal font-semibold hover:underline">
            Decouvrir des evenements
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const startDate = new Date(order.event.startDate);
            const status = statusLabels[order.status] || statusLabels.PENDING;
            const totalTickets = order.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div key={order.id} className="bg-panel rounded-bubble border border-border overflow-hidden">
                <div className="flex">
                  <div className="w-24 md:w-32 bg-gradient-to-br from-wa-teal to-wa-deep flex-shrink-0">
                    {order.event.imageUrl && (
                      <img src={order.event.imageUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-ink">{order.event.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {order.event.city}
                      </span>
                    </div>

                    <p className="text-sm text-ink/80 mt-2">
                      {totalTickets} billet{totalTickets > 1 ? "s" : ""} · {Number(order.totalAmount).toLocaleString()} FCFA
                    </p>

                    {order.status === "PAID" && (
                      <button
                        onClick={() => setQrModal({ orderId: order.id, eventTitle: order.event.title })}
                        className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-wa-teal hover:underline"
                      >
                        <QrCode size={15} /> Voir mes billets QR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {qrModal && <QRModal orderId={qrModal.orderId} eventTitle={qrModal.eventTitle} onClose={() => setQrModal(null)} />}
    </div>
  );
}

function QRModal({ orderId, eventTitle, onClose }: { orderId: string; eventTitle: string; onClose: () => void }) {
  const [attendees, setAttendees] = useState<{ id: string; qrCode: string; checkedIn: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setAttendees(res.data.attendees);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-panel">
          <h2 className="font-display font-bold text-ink">{eventTitle}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {loading ? (
            <p className="text-center text-muted text-sm">Chargement des billets...</p>
          ) : (
            attendees.map((a, i) => (
              <div key={a.id} className="flex flex-col items-center gap-3 pb-5 border-b border-border last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-ink">Billet {i + 1}</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${a.qrCode}`}
                  alt={`QR code billet ${i + 1}`}
                  className="w-40 h-40 rounded-xl border border-border"
                />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  a.checkedIn ? "bg-wa-accent/20 text-wa-accentDark" : "bg-gray-100 text-gray-600"
                }`}>
                  {a.checkedIn ? "Deja scanne" : "Pas encore scanne"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}