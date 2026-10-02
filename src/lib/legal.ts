/**
 * Versiones vigentes de los documentos legales. Al cambiar un documento de forma
 * sustancial, sube su versión: quien aceptó una anterior verá de nuevo el aviso
 * de aceptación (sitio y app) antes de seguir usando su cuenta.
 *
 * La app replica estos valores en comeapp/src/lib/legal.ts: mantenlos iguales.
 */
export const TERMINOS_VERSION = "2026-10-02";
export const PRIVACIDAD_VERSION = "2026-10-02";
export const LEGAL_ACTUALIZADO = "2 de octubre de 2026";
export const LEGAL_CONTACTO = "legal@comeapp.com.mx";

/** Enlace público de la app en la App Store. */
export const APP_STORE_URL = "https://apps.apple.com/mx/app/come/id6809052402";
export const APP_STORE_ID = "6809052402";
export const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.mxica.come";

/** Registro que se guarda en users/{uid}.aceptacionLegal. */
export interface AceptacionLegal {
  terminos: string;
  privacidad: string;
  fechaMs: number;
  origen: "web" | "app";
}

/** Si una aceptación guardada cubre las versiones vigentes. */
export function aceptacionVigente(a: unknown): boolean {
  const x = a as Partial<AceptacionLegal> | undefined;
  return x?.terminos === TERMINOS_VERSION && x?.privacidad === PRIVACIDAD_VERSION;
}

/**
 * Razón social y domicilio del responsable. La ley de datos personales exige el
 * domicilio en el aviso de privacidad: complétalo antes de publicar.
 */
export const LEGAL_RAZON_SOCIAL = "Mexica Gourmet";
export const LEGAL_DOMICILIO = "";
