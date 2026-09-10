/**
 * Convierte el campo de texto libre `come.chef` en la relación estructurada.
 *
 * Antes un restaurante con dos chefs se guardaba como "Julio Castillo, Hugo
 * Jimenez" en una sola cadena. Con eso, el perfil de cada chef no encontraba su
 * restaurante (la consulta era igualdad exacta) y el enlace del lugar apuntaba a
 * un slug que no existe. Este script rellena, por cada lugar:
 *
 *   chefsNombres  los nombres ya separados
 *   chefIds       los que tienen ficha en la colección `chefs`
 *   chef          el texto normalizado, que se conserva por compatibilidad
 *
 * Por defecto sólo simula. Para escribir de verdad:
 *   node src/scripts/vincular-chefs.mjs --aplicar
 */

import { execFileSync } from "node:child_process";

const PROYECTO = "mxicapp";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;
const APLICAR = process.argv.includes("--aplicar");

const SEPARADORES = /\s*(?:,|\/|&|\sy\s|\se\s)\s*/gi;

const separarNombres = (texto) =>
  !texto ? [] : texto.split(SEPARADORES).map((p) => p.trim()).filter(Boolean);

const normalizar = (nombre) =>
  nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const token = () =>
  execFileSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" }).trim();

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(ruta.startsWith("http") ? ruta : `${BASE}/${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token()}`,
      "x-goog-user-project": PROYECTO,
      "Content-Type": "application/json",
      ...(opciones.headers || {}),
    },
  });
  if (!respuesta.ok) throw new Error(`${respuesta.status} ${(await respuesta.text()).slice(0, 400)}`);
  return respuesta.json();
}

const texto = (campos, clave) => campos?.[clave]?.stringValue ?? "";
const idDe = (doc) => doc.name.split("/").pop();

async function traerTodo(coleccion) {
  const datos = await pedir(`${coleccion}?pageSize=300`);
  return datos.documents ?? [];
}

async function principal() {
  const [lugares, chefs] = await Promise.all([traerTodo("come"), traerTodo("chefs")]);

  // Un nombre repetido entre fichas se marca como ambiguo: no se adivina.
  const porNombre = new Map();
  for (const chef of chefs) {
    const clave = normalizar(texto(chef.fields, "name"));
    porNombre.set(clave, porNombre.has(clave) ? null : idDe(chef));
  }

  const cambios = [];
  const sinFicha = new Set();

  for (const lugar of lugares) {
    const nombreLugar = texto(lugar.fields, "restaurantName") || texto(lugar.fields, "name");
    const nombres = separarNombres(texto(lugar.fields, "chef"));
    if (nombres.length === 0) continue;

    const ids = [];
    const faltantes = [];
    for (const nombre of nombres) {
      const id = porNombre.get(normalizar(nombre));
      if (id) ids.push(id);
      else {
        faltantes.push(nombre);
        sinFicha.add(nombre);
      }
    }

    const yaTiene = lugar.fields?.chefIds?.arrayValue?.values?.map((v) => v.stringValue) ?? [];
    const igual =
      yaTiene.length === ids.length && yaTiene.every((v, i) => v === ids[i]) && nombres.length === 1;
    if (igual) continue;

    cambios.push({ id: idDe(lugar), nombreLugar, nombres, ids, faltantes });
  }

  console.log(`Lugares: ${lugares.length} · Fichas de chef: ${chefs.length}\n`);
  for (const c of cambios) {
    const detalle = c.nombres
      .map((n, i) => (c.ids[i] ? `${n} ✓` : `${n} (sin ficha)`))
      .join(" · ");
    console.log(`  ${c.nombreLugar.padEnd(30)} ${detalle}`);
  }

  if (sinFicha.size > 0) {
    console.log(`\nChefs mencionados que no tienen ficha (${sinFicha.size}):`);
    console.log("  " + [...sinFicha].join(", "));
    console.log("  Se guardan como texto; en cuanto se cree su ficha, el admin los engancha solo.");
  }

  if (!APLICAR) {
    console.log(`\nSimulación. ${cambios.length} lugar(es) se actualizarían.`);
    console.log("Para escribir: node src/scripts/vincular-chefs.mjs --aplicar");
    return;
  }

  for (const c of cambios) {
    const campos = {
      chefsNombres: { arrayValue: { values: c.nombres.map((n) => ({ stringValue: n })) } },
      chefIds: { arrayValue: { values: c.ids.map((id) => ({ stringValue: id })) } },
      chef: { stringValue: c.nombres.join(", ") },
    };
    const mascara = Object.keys(campos).map((k) => `updateMask.fieldPaths=${k}`).join("&");
    await pedir(`come/${c.id}?${mascara}`, { method: "PATCH", body: JSON.stringify({ fields: campos }) });
    console.log(`  actualizado: ${c.nombreLugar}`);
  }
  console.log(`\nListo. ${cambios.length} lugar(es) actualizados.`);
}

principal().catch((e) => {
  console.error("Falló:", e.message);
  process.exit(1);
});
