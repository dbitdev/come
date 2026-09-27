export const SEO_CIUDADES = [
  { slug: "ciudad-de-mexico", nombre: "Ciudad de México", filtro: "CDMX" },
  { slug: "puebla", nombre: "Puebla", filtro: "Puebla" },
  { slug: "oaxaca", nombre: "Oaxaca", filtro: "Oaxaca" },
] as const;

export const SEO_COCINAS = [
  { slug: "tacos", nombre: "Tacos", terminos: ["taco", "taquería"] },
  { slug: "comida-mexicana", nombre: "Comida mexicana", terminos: ["mexicana", "mexicano"] },
  { slug: "cocina-poblana", nombre: "Cocina poblana", terminos: ["poblana", "poblano"] },
  { slug: "cocina-oaxaquena", nombre: "Cocina oaxaqueña", terminos: ["oaxaqueña", "oaxaqueño"] },
  { slug: "mariscos", nombre: "Mariscos", terminos: ["marisco", "pescado"] },
  { slug: "desayunos", nombre: "Desayunos", terminos: ["desayuno", "brunch"] },
  { slug: "postres-y-cafe", nombre: "Postres y café", terminos: ["postre", "café", "panadería", "churrería"] },
  { slug: "cocina-italiana", nombre: "Cocina italiana", terminos: ["italiana", "pizza", "pasta"] },
  { slug: "cocina-japonesa", nombre: "Cocina japonesa", terminos: ["japonesa", "sushi", "omakase"] },
] as const;

export const normalizarSeo = (valor: unknown) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
