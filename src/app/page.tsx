"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { ArrowRight, CalendarDays, ChefHat, ChevronLeft, ChevronRight, Compass, Map, MapPin, Search, ShoppingBag, Sparkles, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import styles from "./page.module.css";
import { isPublished, rutaLugar } from "@/lib/utils";
import { traerChefs, type Chef } from "@/lib/chefs";
import RetratoChef from "@/components/RetratoChef";

const img = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

// Tipos de cocina del carrusel. Abre el nombre en el buscador de restaurantes.
const cuisines: [string, string][] = [
  ["Mexicana", "1613514785940-daed07799d9b"],
  ["Tacos", "1552332386-f8dd00dc2f85"],
  ["Antojitos", "1618040996337-56904b7850b9"],
  ["Birria y barbacoa", "1615870216519-2f9fa575fa5c"],
  ["Carne asada", "1599974579688-8dbdd335c77f"],
  ["Mariscos", "1517244683847-7456b63c5969"],
  ["Botanas y salsas", "1584208632869-05fa2b2a5934"],
  ["Burritos", "1626700051175-6818013e1d4f"],
  ["Hamburguesas", "1565299507177-b0ac66763828"],
  ["Pizza", "1513104890138-7c749659a591"],
  ["Sushi", "1579871494447-9811cf80d66c"],
  ["Ramen", "1569718212165-3a8278d5f624"],
  ["China", "1585032226651-759b368d7246"],
  ["Italiana", "1551183053-bf91a1d81141"],
  ["Pollo", "1626645738196-c2a7c87a8f58"],
  ["Alitas", "1608039755401-742074f0548d"],
  ["Cortes y parrilla", "1544025162-d76694265947"],
  ["Desayunos", "1533089860892-a7c6f0a88666"],
  ["Panadería y café", "1509440159596-0249088772ff"],
  ["Postres", "1565958011703-44f9829ba187"],
  ["Saludable", "1512621776951-a57141f2eefd"],
  ["Bar y coctelería", "1544145945-f90425340c7e"],
];

const colecciones: [string, string, string][] = [
  ["Taquerías de barrio", "1512838243191-e81e8f66f1fd", "Tacos"],
  // Ésta no va al buscador: tiene página propia.
  ["Cocina tradicional", "1584208632869-05fa2b2a5934", "__tradicional"],
  ["Marisquerías", "1517244683847-7456b63c5969", "Mariscos"],
  ["Cocina de autor", "1551504734-5ee1c4a1479b", "Cocina de autor"],
];

const fallbackPlaces = [
  { id:"pujol", name:"Pujol", category:"Mexicana contemporánea", address:"Polanco, CDMX", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85" },
  { id:"contramar", name:"Contramar", category:"Mariscos", address:"Roma Norte, CDMX", image:"https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=85" },
  { id:"rosetta", name:"Rosetta", category:"Italiana mexicana", address:"Roma Norte, CDMX", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=85" },
];

type Place = { id:string; name:string; category:string; address:string; image:string; rating?:string|number; estado?:string; isMichelin?:boolean; estrellas?:number };
type GuideCard = { id:string; slug:string; title:string; description:string; heroImage:string };

// Carrusel horizontal de tipos de cocina.
function CuisineRail(){
  const rail = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    const el = rail.current;
    if(!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 280), behavior: "smooth" });
  };
  return <section className={styles.cuisines}>
    <div className={styles.railHead}>
      <div><span>EXPLORA POR COCINA</span><h2>De la taquería de la esquina al sushi de la noche</h2></div>
      <div className={styles.railNav}>
        <button type="button" onClick={()=>scrollBy(-1)} aria-label="Ver cocinas anteriores"><ChevronLeft size={20}/></button>
        <button type="button" onClick={()=>scrollBy(1)} aria-label="Ver más cocinas"><ChevronRight size={20}/></button>
        <Link href="/restaurantes">Ver todas <ArrowRight size={18}/></Link>
      </div>
    </div>
    <div className={styles.rail} ref={rail}>
      {cuisines.map(([name,id])=>
        <Link key={name} href={`/restaurantes?search=${encodeURIComponent(name)}`} className={styles.cuisineCard}>
          <img src={img(id,700)} alt={name} loading="lazy"/><h3>{name}</h3>
        </Link>
      )}
    </div>
  </section>;
}

// Banda de descarga de la app.
function AppBand(){
  return <section className={styles.appBand}>
    <div className={styles.appArt}>
      <div className={styles.phone}>
        <span aria-hidden="true"/>
        <div className={styles.phoneScreen}>
          <div className={styles.island} aria-hidden="true"/>
          <div className={styles.phoneBar}><b>come</b><Search size={14}/></div>
          <p className={styles.phoneTitle}>¿Qué se te antoja hoy?</p>
          <div className={styles.phoneChips}><span>Tacos</span><span>Birria</span><span>Mariscos</span></div>
          <div className={styles.phoneGrid}>
            {cuisines.slice(0,4).map(([name,id])=><figure key={name}><img src={img(id,240)} alt="" aria-hidden="true"/><figcaption>{name}</figcaption></figure>)}
          </div>
          <div className={styles.phoneTabs}><span>Inicio</span><span>Pedidos</span><span>Cuenta</span></div>
          <div className={styles.homeBar} aria-hidden="true"/>
        </div>
      </div>
    </div>
    <div className={styles.appCopy}>
      <span>¿SE TE ANTOJA ALGO NUEVO?</span>
      <h2>Llévate Come en la bolsa</h2>
      <p>Guarda tus taquerías de cabecera, sigue a los chefs que te gustan, arma rutas para el fin de semana y pide sin dar tantas vueltas. Toda la mesa mexicana, en tu teléfono.</p>
      {/* Badges oficiales de Apple y Google, sin modificar. TODO: sustituir el href
          por las URLs reales de la ficha en App Store y Google Play al publicar. */}
      <div className={styles.storeButtons}>
        <a href="#" aria-label="Descargar Come en el App Store"><img src="/badges/app-store-es.svg" alt="Descárgala en el App Store"/></a>
        <a href="#" aria-label="Descargar Come en Google Play"><img src="/badges/google-play-es.png" alt="Disponible en Google Play"/></a>
      </div>
    </div>
  </section>;
}

/**
 * Lugares publicados y chefs, que es lo que alimenta las bandas de la portada.
 * Antes cada sección traía su propia lista escrita a mano; esto sale de la base.
 */
function useContenidoPortada(){
  const [places,setPlaces]=useState<Place[]>([]);
  const [guides,setGuides]=useState<GuideCard[]>([]);
  const [chefs,setChefs]=useState<Chef[]>([]);

  useEffect(()=>{(async()=>{
    if(!db) return;
    try{
      const [placeSnap,guideSnap]=await Promise.all([
        getDocs(query(collection(db,"come"),limit(40))),
        getDocs(query(collection(db,"guides"),limit(4)))
      ]);
      setPlaces(placeSnap.docs.filter(doc=>isPublished(doc.data())).map(doc=>{
        const d=doc.data();
        return {
          id:doc.id,
          name:d.restaurantName||d.name||"Restaurante",
          category:d.category||"Cocina local",
          address:d.address||"México",
          image:d.image||d.menu?.[0]?.image||fallbackPlaces[0].image,
          rating:d.rating,
          estado:d.estado,
          isMichelin:Boolean(d.isMichelin),
          estrellas:Number(d.michelinStars ?? d.estrellas)||0,
        };
      }));
      setGuides(guideSnap.docs.map(doc=>{const d=doc.data();return{id:doc.id,slug:d.slug||doc.id,title:d.title||"Guía gastronómica",description:d.description||"Una ruta seleccionada para ti.",heroImage:d.heroImage||fallbackPlaces[1].image};}));
      // Los que tienen retrato van primero: la banda es visual y una fila de
      // iniciales no dice mucho.
      const todosLosChefs=await traerChefs();
      setChefs([...todosLosChefs].sort((a,b)=>Number(Boolean(b.image))-Number(Boolean(a.image))));
    }catch{/* Sin red, las secciones con datos simplemente no se pintan. */}
  })()},[]);

  return {places,guides,chefs};
}

const puntaje = (p: Place) => (p.estrellas||0)*10 + Number(p.rating||0) + (p.isMichelin?5:0);

// Los mejor calificados y con distinción, no una lista fija.
function SeccionRecomendados({places}:{places:Place[]}){
  const destacados=useMemo(()=>[...places].sort((a,b)=>puntaje(b)-puntaje(a)).slice(0,6),[places]);
  if(destacados.length===0) return null;
  return <section className={styles.feedSection}>
    <div className={styles.feedHeading}>
      <div><span>LO MÁS RECOMENDADO</span><h2>Las mesas del momento</h2></div>
      <Link href="/restaurantes">Ver todos <ArrowRight size={18}/></Link>
    </div>
    <div className={styles.placeRail}>
      {destacados.map(place=>
        <Link href={rutaLugar(place.name, place.id)} key={place.id} className={styles.placeCard}>
          <div className={styles.placeThumb}>
            <img src={place.image} alt={place.name}/>
            {place.isMichelin&&<b className={styles.michelinTag}><Star size={12} fill="currentColor"/>{(place.estrellas||0)>1?`${place.estrellas} estrellas`:"Estrella Michelin"}</b>}
          </div>
          <div>
            <span>{place.category}</span>
            <h3>{place.name}</h3>
            <p><MapPin size={14}/>{place.address}</p>
          </div>
        </Link>
      )}
    </div>
  </section>;
}

// Cocinas reales del directorio, no una lista escrita a mano: si mañana entra
// una marisquería nueva, aparece sola.
function SeccionPorCocina({places}:{places:Place[]}){
  const cocinas=useMemo(()=>{
    // Ojo: `Map` en este archivo es el icono de lucide-react, no el de JS.
    const cuenta: Record<string,number> = {};
    places.forEach(p=>{ if(p.category) cuenta[p.category]=(cuenta[p.category]||0)+1; });
    return Object.entries(cuenta).sort((a,b)=>b[1]-a[1]).map(([nombre])=>nombre);
  },[places]);
  const [activa,setActiva]=useState<string|null>(null);
  const cocinaActiva=activa&&cocinas.includes(activa)?activa:cocinas[0];
  const visibles=useMemo(()=>places.filter(p=>p.category===cocinaActiva).slice(0,4),[places,cocinaActiva]);
  if(cocinas.length===0) return null;
  return <section className={styles.cuisineSection}>
    <div className={styles.feedHeading}>
      <div><span>SEGÚN EL ANTOJO</span><h2>Elige por cocina</h2></div>
      <Link href="/restaurantes">Ver el directorio <ArrowRight size={18}/></Link>
    </div>
    <div className={styles.cuisineChips} role="tablist" aria-label="Tipos de cocina">
      {cocinas.map(nombre=>
        <button key={nombre} type="button" role="tab" aria-selected={nombre===cocinaActiva}
          className={nombre===cocinaActiva?styles.chipActive:styles.chip}
          onClick={()=>setActiva(nombre)}>{nombre}</button>
      )}
    </div>
    <div className={styles.cuisineGrid}>
      {visibles.map(place=>
        <Link href={rutaLugar(place.name, place.id)} key={place.id}>
          <img src={place.image} alt={place.name}/>
          <div><h3>{place.name}</h3><p><MapPin size={13}/>{place.address}</p></div>
        </Link>
      )}
    </div>
  </section>;
}

// Quienes cocinan, desde Firestore, con la inicial de marca si no hay retrato.
function SeccionChefs({chefs}:{chefs:Chef[]}){
  if(chefs.length===0) return null;
  return <section className={styles.chefSection}>
    <div className={styles.feedHeading}>
      <div><span>CONOCE A QUIENES COCINAN</span><h2>Chefs para seguir</h2></div>
      <Link href="/chefs">Ver chefs <ArrowRight size={18}/></Link>
    </div>
    <div className={styles.chefRail}>
      {chefs.slice(0,3).map(chef=>
        <Link href={`/chefs/${chef.slug}`} key={chef.id}>
          <div className={styles.chefPortrait}><RetratoChef src={chef.image} nombre={chef.name}/></div>
          {chef.restaurant&&<span><ChefHat size={15}/>{chef.restaurant}</span>}
          <h3>{chef.name}</h3>
        </Link>
      )}
    </div>
  </section>;
}

function PublicLanding(){
  const {places,chefs}=useContenidoPortada();
  return <main className={styles.page}>
    <section className={styles.hero}>
      <img src={img("1552332386-f8dd00dc2f85", 2200)} alt="Tacos de la calle recién servidos" /><div className={styles.shade}/>
      <div className={styles.heroCopy}>
        <span>DE LA FONDA DE BARRIO A LA MESA DE AUTOR</span>
        <h1>Se te antoja.<br/>Nosotros te decimos<br/>dónde.</h1>
        <div className={styles.heroActions}><Link href="/ordenar">Ordenar ahora <ShoppingBag size={19}/></Link><Link href="/restaurantes" className={styles.secondary}>Ver restaurantes</Link></div>
      </div>
    </section>

    <CuisineRail/>

    <SeccionRecomendados places={places}/>

    <section className={styles.intro}><span>EL DESTINO PARA COMER MEJOR</span><h2>Todo México en tu mesa</h2><p>Del puesto de la esquina al menú de degustación: un solo lugar para descubrir dónde se come rico, conocer a quienes cocinan y pasar del antojo a la reservación o al pedido.</p></section>

    <section className={styles.featureRow}><div className={styles.featureImage}><img src={img("1504544750208-dc0358e63f7f",1400)} alt="Tacos recién hechos con limón y salsa"/></div><div className={styles.featureCopy}><span>DESCUBRE</span><h2>Un país que se come de mil maneras</h2><p>Mercados, fondas, marisquerías, panaderías y mesas de autor. Busca por cocina, chef, colonia, ocasión o platillo, desde los clásicos de siempre hasta los secretos mejor guardados de cada ciudad.</p><Link href="/restaurantes">Explorar restaurantes <ArrowRight size={18}/></Link></div></section>

    <section className={`${styles.featureRow} ${styles.reverse}`}><div className={styles.featureImage}><img src={img("1414235077428-338989a2e8c0",1400)} alt="Restaurante preparado para recibir comensales"/></div><div className={styles.featureCopy}><span>RESERVA</span><h2>Aparta tu mesa sin batallar</h2><p>Encuentra lugar para hoy, experiencias de temporada y rutas gastronómicas para el fin de semana. La disponibilidad en tiempo real irá llegando conforme cada negocio active sus reservaciones.</p><Link href="/restaurantes">Encontrar una mesa <CalendarDays size={18}/></Link></div></section>

    <section className={styles.browse}><div className={styles.browseHead}><div><span>COLECCIONES</span><h2>Para cuando ya sabes qué se te antoja</h2></div><Link href="/guias">Ver guías <ArrowRight size={18}/></Link></div><div className={styles.restaurantStrip}>{colecciones.map(([name,id,q])=><Link href={q==="__tradicional"?"/cocina-tradicional":`/restaurantes?search=${encodeURIComponent(q)}`} key={name}><img src={img(id,1000)} alt={name}/><h3>{name}</h3></Link>)}</div></section>

    <SeccionPorCocina places={places}/>

    <SeccionChefs chefs={chefs}/>

    <AppBand/>

    <section className={styles.mapCta}><MapPin size={30}/><span>COME CERCA DE TI</span><h2>Lo bueno casi siempre está a la vuelta de la esquina.</h2><Link href="/mapa">Abrir mapa</Link></section>
  </main>;
}

function MemberHome(){
  const { user } = useAuth();
  const {places:placesRemotos,guides,chefs}=useContenidoPortada();
  const places=placesRemotos.length?placesRemotos:fallbackPlaces;
  const firstName=(user?.displayName || user?.email?.split("@")[0] || "foodie").split(" ")[0];

  const guideCards=useMemo(()=>guides.length?guides:[
    {id:"centro",slug:"mexico/cocina-tradicional",title:"Sabores esenciales de México",description:"Mercados, fondas y mesas que cuentan nuestra historia.",heroImage:"https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1000&q=85"},
    {id:"fin",slug:"mejores-hamburguesas-cdmx",title:"Una ruta para el fin de semana",description:"Paradas memorables para recorrer la ciudad con hambre.",heroImage:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85"}
  ],[guides]);

  return <main className={styles.memberPage}>
    <section className={styles.memberHero}>
      <div><span><Sparkles size={16}/> SELECCIONADO PARA TI</span><h1>Hola, {firstName}.<br/>¿Qué se te antoja hoy?</h1><p>Restaurantes, historias y rutas elegidas a partir de lo que exploras.</p></div>
      <form action="/restaurantes" className={styles.memberSearch}><Compass size={21}/><input name="search" aria-label="Buscar restaurantes, chefs o platillos" placeholder="Busca un restaurante, chef o platillo"/><button>Buscar</button></form>
    </section>
    <nav className={styles.quickActions} aria-label="Accesos rápidos">
      <Link href="/restaurantes"><span><Compass/></span><b>Descubrir</b><small>Lugares para ti</small></Link>
      <Link href="/mapa"><span><Map/></span><b>Cerca de mí</b><small>Explorar el mapa</small></Link>
      <Link href="/ordenar"><span><ShoppingBag/></span><b>Ordenar</b><small>Entrega o pickup</small></Link>
      <Link href="/guias"><span><CalendarDays/></span><b>Planear</b><small>Guías y rutas</small></Link>
    </nav>
    <section className={styles.feedSection}><div className={styles.feedHeading}><div><span>RECOMENDADOS PARA TI</span><h2>Lugares que vale la pena conocer</h2></div><Link href="/restaurantes">Ver todos <ArrowRight size={18}/></Link></div><div className={styles.placeRail}>{places.slice(0,6).map(place=><Link href={rutaLugar(place.name, place.id)} key={place.id} className={styles.placeCard}><img src={place.image} alt={place.name}/><div><span>{place.category}</span><h3>{place.name}</h3><p><MapPin size={14}/>{place.address}</p></div></Link>)}</div></section>
    <section className={styles.guideBand}><div className={styles.feedHeading}><div><span>PLANES PARA GUARDAR</span><h2>Guías hechas para salir a comer</h2></div><Link href="/guias">Todas las guías <ArrowRight size={18}/></Link></div><div className={styles.guideGrid}>{guideCards.slice(0,3).map(guide=><Link href={`/guias/${guide.slug}`} key={guide.id}><img src={guide.heroImage} alt={guide.title}/><div><h3>{guide.title}</h3><p>{guide.description}</p><b>Explorar ruta <ArrowRight size={15}/></b></div></Link>)}</div></section>
    <SeccionPorCocina places={places}/>
    <SeccionChefs chefs={chefs}/>
    <section className={styles.memberMap}><div><span>EXPLORA TU CIUDAD</span><h2>Todo lo bueno,<br/>cerca de ti.</h2><p>Abre el mapa para encontrar restaurantes y experiencias alrededor de tu ubicación.</p><Link href="/mapa">Explorar el mapa <MapPin size={18}/></Link></div></section>
  </main>
}

export default function Home(){
  const {user,loading}=useAuth();
  if(loading) return <main className={styles.homeLoading}><span>come</span></main>;
  return user ? <MemberHome/> : <PublicLanding/>;
}
