"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { BadgeCheck, Building2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./claim.module.css";

export default function ClaimProfilePage() {
  const params = useParams<{ tipo: string; id: string }>();
  const query = useSearchParams();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ relationship: "", businessEmail: "", phone: "", website: "", proofUrl: "", notes: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const entityType = params.tipo === "chef" ? "chef" : "place";
  const name = query.get("nombre") || (entityType === "chef" ? "este perfil de chef" : "este lugar");

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSending(true); setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, entityType, entityId: params.id, entityName: name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo enviar la solicitud.");
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo enviar la solicitud.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <main className={styles.state}>Comprobando tu cuenta…</main>;
  if (!user) return (
    <main className={styles.state}>
      <ShieldCheck size={42} />
      <h1>Inicia sesión para reclamar un perfil</h1>
      <p>Necesitamos asociar la solicitud a una cuenta verificable.</p>
      <Link href="/login">Iniciar sesión</Link>
    </main>
  );
  if (sent) return (
    <main className={styles.state}>
      <BadgeCheck size={46} />
      <h1>Solicitud recibida</h1>
      <p>La redacción revisará la identidad, la relación con {name} y la evidencia. El perfil no se asigna hasta completar esa verificación.</p>
      <Link href={entityType === "chef" ? `/chefs/${params.id}` : `/lugares/${params.id}`}>Volver al perfil</Link>
    </main>
  );

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <Building2 size={30} />
        <span>VERIFICACIÓN DE PROPIEDAD</span>
        <h1>Reclamar {name}</h1>
        <p>Envía datos que sólo la persona responsable o su representante pueda acreditar. Come revisará la solicitud antes de otorgar acceso.</p>
      </section>
      <form className={styles.form} onSubmit={submit}>
        <label>Tu relación con el perfil<input required value={form.relationship} onChange={(e) => update("relationship", e.target.value)} placeholder="Propietaria, chef, representante legal…" /></label>
        <div className={styles.row}>
          <label>Correo corporativo<input required type="email" value={form.businessEmail} onChange={(e) => update("businessEmail", e.target.value)} /></label>
          <label>Teléfono de contacto<input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
        </div>
        <label>Sitio oficial<input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://…" /></label>
        <label>Evidencia pública<input type="url" value={form.proofUrl} onChange={(e) => update("proofUrl", e.target.value)} placeholder="Perfil oficial, aviso legal o página donde apareces" /></label>
        <label>Información para verificar<textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Explica cómo podemos confirmar que administras la marca o el perfil." /></label>
        <p className={styles.notice}>No incluyas contraseñas, documentos bancarios ni identificaciones sensibles. Si se requieren documentos privados, la redacción te contactará por un canal protegido.</p>
        {error && <p className={styles.error}>{error}</p>}
        <button disabled={sending}>{sending ? "Enviando…" : "Enviar para revisión"}</button>
      </form>
    </main>
  );
}
