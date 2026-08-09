"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Smartphone, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useCheckoutStore } from "@/store/checkout.store";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const paymentMethods = [
  { id: "CARD", label: "Carte bancaire", icon: CreditCard, hint: "Visa, Mastercard" },
  { id: "WAVE", label: "Wave", icon: Smartphone, hint: "Paiement mobile" },
  { id: "ORANGE_MONEY", label: "Orange Money", icon: Smartphone, hint: "Paiement mobile" },
];

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const formatPhone = (value: string) => {
  return value.replace(/\D/g, "").slice(0, 9);
};

export default function CheckoutPage() {
  const router = useRouter();
  const { eventId, eventTitle, items, clear } = useCheckoutStore();
  const [method, setMethod] = useState("CARD");
  const [processing, setProcessing] = useState(false);

  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [phone, setPhone] = useState("");

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!eventId || items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-muted mb-4">Aucune reservation en cours.</p>
        <Button onClick={() => router.push("/")}>Retour a l&apos;accueil</Button>
      </div>
    );
  }

  const isFormValid = () => {
    if (method === "CARD") {
      return (
        card.number.replace(/\s/g, "").length === 16 &&
        card.name.trim().length > 2 &&
        card.expiry.length === 5 &&
        card.cvc.length === 3
      );
    }
    return phone.length === 9;
  };

  const handlePay = async () => {
    if (!isFormValid()) {
      toast.error("Verifie les informations de paiement");
      return;
    }

    setProcessing(true);
    try {
      // Simulation du delai de traitement du paiement
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await api.post("/orders", {
        eventId,
        items: items.map((i) => ({ ticketId: i.ticketId, quantity: i.quantity })),
      });

      toast.success("Paiement confirme, billets generes !");
      clear();
      router.push("/mes-billets");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors du paiement");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Paiement</h1>
      <p className="text-sm text-muted mb-6">{eventTitle}</p>

      {/* Recapitulatif */}
      <div className="bg-panel rounded-bubble border border-border p-5 mb-6">
        <h2 className="font-semibold text-sm text-ink mb-3">Recapitulatif</h2>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.ticketId} className="flex justify-between text-sm">
              <span className="text-ink/80">{item.quantity} x {item.name}</span>
              <span className="text-ink font-medium">{(item.price * item.quantity).toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-3 mt-3 border-t border-border">
          <span className="font-semibold text-ink">Total</span>
          <span className="font-display font-bold text-lg text-wa-deep">{total.toLocaleString()} FCFA</span>
        </div>
      </div>

      {/* Choix du mode de paiement */}
      <h2 className="font-semibold text-sm text-ink mb-3">Mode de paiement</h2>
      <div className="flex flex-col gap-3 mb-5">
        {paymentMethods.map((m) => {
          const Icon = m.icon;
          const selected = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected ? "border-wa-teal bg-wa-teal/5" : "border-border bg-panel"
              }`}
            >
              <Icon size={20} className={selected ? "text-wa-teal" : "text-muted"} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{m.label}</p>
                <p className="text-xs text-muted">{m.hint}</p>
              </div>
              {selected && <CheckCircle2 size={18} className="text-wa-teal" />}
            </button>
          );
        })}
      </div>

      {/* Formulaire carte bancaire */}
      {method === "CARD" && (
        <div className="bg-panel rounded-bubble border border-border p-5 mb-6 flex flex-col gap-4">
          <Input
            label="Numero de carte"
            placeholder="1234 5678 9012 3456"
            value={card.number}
            onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
            inputMode="numeric"
          />
          <Input
            label="Nom sur la carte"
            placeholder="JEAN DUPONT"
            value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiration"
              placeholder="MM/AA"
              value={card.expiry}
              onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
              inputMode="numeric"
            />
            <Input
              label="CVC"
              placeholder="123"
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 3) })}
              inputMode="numeric"
              type="password"
            />
          </div>
        </div>
      )}

      {/* Formulaire mobile money */}
      {(method === "WAVE" || method === "ORANGE_MONEY") && (
        <div className="bg-panel rounded-bubble border border-border p-5 mb-6">
          <Input
            label="Numero de telephone"
            placeholder="77 123 45 67"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            inputMode="numeric"
          />
          <p className="text-xs text-muted mt-2">
            Tu recevras une demande de confirmation sur ton telephone.
          </p>
        </div>
      )}

      <p className="text-xs text-muted text-center mb-4">
        Mode demonstration — aucun paiement reel n&apos;est effectue.
      </p>

      <Button onClick={handlePay} disabled={processing || !isFormValid()} fullWidth>
        {processing ? "Traitement du paiement..." : `Payer ${total.toLocaleString()} FCFA`}
      </Button>
    </div>
  );
}