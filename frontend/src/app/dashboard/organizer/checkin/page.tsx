"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Camera, CameraOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import api from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface MyEvent { id: string; title: string; }

const SCANNER_ID = "qr-scanner-region";

export default function CheckinPage() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [result, setResult] = useState<{ valid: boolean; message: string; name?: string } | null>(null);
  const [stats, setStats] = useState<{ total: number; checkedIn: number; remaining: number } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string>("");

  useEffect(() => {
    api.get("/events/my/events").then((res) => setEvents(res.data));
  }, []);

  const loadStats = async (eventId: string) => {
    try {
      const res = await api.get(`/checkin/event/${eventId}/attendance`);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedEvent) loadStats(selectedEvent);
  }, [selectedEvent]);

  const submitScan = async (code: string) => {
    if (!code.trim()) return;

    try {
      const res = await api.post("/checkin/scan", { qrCode: code.trim() });
      setResult({ valid: true, message: res.data.message, name: res.data.attendee.name });
      toast.success("Entree validee");
      if (selectedEvent) loadStats(selectedEvent);
    } catch (err: any) {
      setResult({ valid: false, message: err.response?.data?.error || "Erreur", name: err.response?.data?.attendee?.name });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitScan(qrCode);
    setQrCode("");
  };

  const startCamera = async () => {
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (decodedText === lastScanRef.current) return;
          lastScanRef.current = decodedText;
          await submitScan(decodedText);
          setTimeout(() => { lastScanRef.current = ""; }, 2000);
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'acceder a la camera. Verifie les autorisations du navigateur.");
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-md">
      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-sm font-medium text-ink">Evenement</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink outline-none"
        >
          <option value="">Choisir un evenement...</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-panel rounded-xl border border-border p-3 text-center">
            <p className="font-display font-bold text-lg text-ink">{stats.total}</p>
            <p className="text-xs text-muted">Total</p>
          </div>
          <div className="bg-panel rounded-xl border border-border p-3 text-center">
            <p className="font-display font-bold text-lg text-wa-accentDark">{stats.checkedIn}</p>
            <p className="text-xs text-muted">Presents</p>
          </div>
          <div className="bg-panel rounded-xl border border-border p-3 text-center">
            <p className="font-display font-bold text-lg text-muted">{stats.remaining}</p>
            <p className="text-xs text-muted">Restants</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <Button
          type="button"
          onClick={cameraActive ? stopCamera : startCamera}
          fullWidth
          className={cameraActive ? "!bg-red-500 hover:!bg-red-600" : ""}
        >
          <span className="flex items-center justify-center gap-2">
            {cameraActive ? <CameraOff size={18} /> : <Camera size={18} />}
            {cameraActive ? "Arreter le scanner" : "Ouvrir le scanner camera"}
          </span>
        </Button>

        <div
          id={SCANNER_ID}
          className={`mt-3 rounded-xl overflow-hidden ${cameraActive ? "block" : "hidden"}`}
        />
      </div>

      <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 mb-6">
        <Input
          label="Ou saisis le code manuellement"
          placeholder="Colle le code QR ici"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
        />
        <Button type="submit" fullWidth>Valider l&apos;entree</Button>
      </form>

      {result && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${
          result.valid ? "bg-wa-accent/10 border border-wa-accent/30" : "bg-red-50 border border-red-200"
        }`}>
          {result.valid ? (
            <CheckCircle2 size={20} className="text-wa-accentDark flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-semibold ${result.valid ? "text-wa-accentDark" : "text-red-600"}`}>
              {result.message}
            </p>
            {result.name && <p className="text-sm text-ink/70">{result.name}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
