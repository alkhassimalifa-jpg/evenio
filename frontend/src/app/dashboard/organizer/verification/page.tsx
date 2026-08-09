"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldAlert, Phone } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function VerificationPage() {
  const { hydrate } = useAuthStore();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  const loadMe = async () => {
    try {
      const res = await api.get("/auth/me");
      setMe(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
    loadMe();
  }, [hydrate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post("/auth/phone/send-otp", { phone });
      toast.success("Code envoye");
      setDemoOtp(res.data.demoOtp);
      setStep("otp");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi du code");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await api.post("/auth/phone/verify-otp", { otp });
      toast.success("Telephone verifie avec succes");
      setStep("phone");
      setOtp("");
      setDemoOtp("");
      loadMe();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Code incorrect");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <p className="text-muted text-sm">Chargement...</p>;

  if (me?.phoneVerified) {
    return (
      <div className="max-w-md">
        <div className="bg-wa-accent/10 border border-wa-accent/30 rounded-bubble p-6 flex flex-col items-center text-center gap-3">
          <ShieldCheck size={40} className="text-wa-accentDark" />
          <h2 className="font-display font-bold text-ink">Telephone verifie</h2>
          <p className="text-sm text-muted">
            Ton numero {me.phone} est confirme. Tu peux publier tes evenements librement.
          </p>
          {me.trustedOrganizer ? (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-wa-accent/20 text-wa-accentDark">
              Organisateur de confiance
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
              Premier evenement soumis a moderation
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-bubble p-4 mb-6">
        <ShieldAlert size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-800">
          La verification du telephone est obligatoire avant de pouvoir publier un evenement.
          Cela protege les participants contre les faux organisateurs.
        </p>
      </div>

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="bg-panel rounded-bubble border border-border p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-ink">
            <Phone size={18} className="text-wa-teal" />
            <h2 className="font-display font-bold">Verifie ton numero</h2>
          </div>
          <Input
            label="Numero de telephone"
            placeholder="77 123 45 67"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" disabled={sending} fullWidth>
            {sending ? "Envoi..." : "Recevoir le code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="bg-panel rounded-bubble border border-border p-5 flex flex-col gap-4">
          <h2 className="font-display font-bold text-ink">Entre le code recu</h2>
          <p className="text-xs text-muted">
            Code envoye au {phone}. (Mode demonstration : le code est {demoOtp})
          </p>
          <Input
            label="Code a 6 chiffres"
            placeholder="000000"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button type="submit" disabled={verifying} fullWidth>
            {verifying ? "Verification..." : "Valider le code"}
          </Button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="text-xs text-muted hover:text-ink text-center"
          >
            Changer de numero
          </button>
        </form>
      )}
    </div>
  );
}