"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { CalendarDays, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ESTADOS, OCUPAN_CUPO, fechaLegible, type EstadoReserva } from "@/lib/reservas";
import { slugify } from "@/lib/utils";
import styles from "./reservas.module.css";

interface MiReserva {
  id: string;
  codigo: string;
  lugarId: string;
  lugarNombre: string;
  personas: number;
  fecha: string;
  hora: string;
  inicioMs: number;
  estado: EstadoReserva;
}

/** Reservaciones del usuario en sesión, en vivo, con opción de cancelar. */
export default function MisReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<MiReserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db || !user) return;
    // Sólo igualdad por userId: no requiere índice compuesto; se ordena aquí.
    return onSnapshot(
      query(collection(db, "reservations"), where("userId", "==", user.uid)),
      (snap) => {
        setReservas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MiReserva, "id">) })));
        setCargando(false);
      },
      () => setCargando(false),
    );
  }, [user]);

  const cancelar = async (r: MiReserva) => {
    if (!user || !window.confirm(`¿Cancelar tu reservación en ${r.lugarNombre} (${fechaLegible(r.fecha, r.hora)})?`)) return;
    setTrabajando(r.id);
    setError("");
    try {
      const respuesta = await fetch(`/api/reservas/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ estado: "cancelada" }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || "No se pudo cancelar.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar.");
    } finally {
      setTrabajando(null);
    }
  };

  if (cargando) return <div className={styles.vacio}>Buscando tus reservaciones…</div>;

  const ahora = Date.now();
  const proximas = reservas.filter((r) => r.inicioMs >= ahora && OCUPAN_CUPO.includes(r.estado)).sort((a, b) => a.inicioMs - b.inicioMs);
  const resto = reservas.filter((r) => !proximas.includes(r)).sort((a, b) => b.inicioMs - a.inicioMs).slice(0, 10);

  if (reservas.length === 0) {
    return (
      <div className={styles.vacio}>
        Aún no tienes reservaciones. Busca un restaurante con <b>Reservar mesa</b> en su ficha.
      </div>
    );
  }

  const renglon = (r: MiReserva, activa: boolean) => (
    <article key={r.id} className={`${styles.renglon} ${activa ? "" : styles.pasadas}`}>
      <div>
        <h4><Link href={`/lugares/${slugify(r.lugarNombre)}`}>{r.lugarNombre}</Link></h4>
        <div className={styles.renglonMeta}>
          <span><CalendarDays size={14} /> {fechaLegible(r.fecha, r.hora)}</span>
          <span><Users size={14} /> {r.personas}</span>
          <span>Código <b className={styles.codigo}>{r.codigo}</b></span>
        </div>
      </div>
      <div className={styles.renglonAcciones}>
        <span className={`${styles.estado} ${styles[`estado_${r.estado}`]}`}>{ESTADOS[r.estado]}</span>
        {activa && (
          <button type="button" className={styles.botonPeligro} disabled={trabajando === r.id} onClick={() => cancelar(r)}>
            {trabajando === r.id ? "Cancelando…" : "Cancelar"}
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div className={styles.lista}>
      {error && <p className={styles.error}>{error}</p>}
      {proximas.map((r) => renglon(r, true))}
      {resto.length > 0 && <span className={styles.etiqueta}>Anteriores y canceladas</span>}
      {resto.map((r) => renglon(r, false))}
    </div>
  );
}
