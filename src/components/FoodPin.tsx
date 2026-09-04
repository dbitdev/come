"use client";

import { Coffee, CupSoda, Croissant, Fish, IceCream, Pizza, Sandwich, UtensilsCrossed } from "lucide-react";

/** Taco: lucide no trae uno, así que va dibujado a mano. */
export function TacoIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* tortilla */}
      <path d="M2.5 17.5a9.5 9.5 0 0 1 19 0Z" fill="currentColor" opacity=".95" />
      {/* relleno */}
      <path d="M5.6 15.4c1.4-1.9 3.6-3 6.4-3s5 1.1 6.4 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.4 13.6c.6-1 1.5-1.9 2.4-2.6M13.4 11.2c1 .7 1.8 1.5 2.4 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2.5 17.5h19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const REGLAS: [RegExp, (size: number) => React.ReactNode][] = [
  [/taco|taquer|pastor|suadero|birria|barbacoa|antojito|garnach/i, (s) => <TacoIcon size={s} />],
  [/marisc|pescad|ceviche|ostion|mar\b/i, (s) => <Fish size={s} />],
  [/caf[eé]|cafeter|tostador/i, (s) => <Coffee size={s} />],
  [/pan|paniter|panader|reposter|croissant/i, (s) => <Croissant size={s} />],
  [/pizza|italian/i, (s) => <Pizza size={s} />],
  [/hamburgues|burger|sandwich|torter|torta/i, (s) => <Sandwich size={s} />],
  [/helad|postre|nieve|dulce/i, (s) => <IceCream size={s} />],
  [/bar|cantina|pulquer|mezcal|coctel|cervec/i, (s) => <CupSoda size={s} />],
];

/**
 * Icono según la especialidad del lugar. Los Michelin no cambian de icono: se
 * distinguen por el color dorado del marcador, así el pin sigue diciendo qué
 * se come ahí.
 */
export default function FoodPin({ category = "", size = 17 }: { category?: string; size?: number }) {
  const regla = REGLAS.find(([patron]) => patron.test(category));
  return <>{regla ? regla[1](size) : <UtensilsCrossed size={size} />}</>;
}
