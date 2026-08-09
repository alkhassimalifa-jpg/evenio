"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", role: "PARTICIPANT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        contactMethod === "email"
          ? { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role }
          : { firstName: form.firstName, lastName: form.lastName, phone: form.phone, password: form.password, role: form.role };

      const res = await api.post("/auth/register", payload);
      setAuth(res.data.user, res.data.token);
      toast.success("Compte cree avec succes");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Erreur lors de la creation du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-panel rounded-bubble border border-border p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-wa-deep mb-1">Creer un compte</h1>
        <p className="text-sm text-muted mb-6">Rejoins Evenio pour decouvrir et organiser des evenements.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="Prenom"
              placeholder="Jean"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              id="lastName"
              label="Nom"
              placeholder="Dupont"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Je m&apos;inscris avec</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContactMethod("email")}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  contactMethod === "email"
                    ? "border-wa-teal bg-wa-teal/10 text-wa-teal"
                    : "border-border text-muted"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactMethod("phone")}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  contactMethod === "phone"
                    ? "border-wa-teal bg-wa-teal/10 text-wa-teal"
                    : "border-border text-muted"
                }`}
              >
                Telephone
              </button>
            </div>
          </div>

          {contactMethod === "email" ? (
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="toi@exemple.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          ) : (
            <Input
              id="phone"
              type="tel"
              label="Numero de telephone"
              placeholder="77 123 45 67"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          )}

          <Input
            id="password"
            type="password"
            label="Mot de passe"
            placeholder="6 caracteres minimum"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Je m&apos;inscris en tant que</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "PARTICIPANT", label: "Participant" },
                { value: "ORGANIZER", label: "Organisateur" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    form.role === opt.value
                      ? "border-wa-teal bg-wa-teal/10 text-wa-teal"
                      : "border-border text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={loading} fullWidth className="mt-2">
            {loading ? "Creation..." : "Creer mon compte"}
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Deja un compte ?{" "}
          <Link href="/connexion" className="text-wa-teal font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}