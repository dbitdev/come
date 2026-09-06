"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "../static-pages.module.css";

// Página pública que exige Google Play para las apps con cuenta: debe poder
// consultarse sin instalar la app y sin iniciar sesión. Por eso el formulario
// es un correo prellenado y no una acción que requiera sesión; si el usuario ya
// entró, sólo rellenamos su correo para ahorrarle el paso.
const CONTACTO = "legal@comeapp.com.mx";
const ACTUALIZADO = "5 de septiembre de 2026";

function enlaceSolicitud(correo?: string | null) {
  const asunto = "Eliminar mi cuenta de Come";
  const cuerpo = [
    "Solicito la eliminación de mi cuenta de Come y de los datos personales asociados.",
    "",
    `Correo de la cuenta: ${correo || "(escribe aquí el correo con el que te registraste)"}`,
    "Nombre: ",
    "",
    "Entiendo que la eliminación es definitiva y que perderé el acceso a mi perfil y a los negocios que registré.",
  ].join("\n");
  return `mailto:${CONTACTO}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

export default function EliminarCuenta() {
  const { user } = useAuth();

  return (
    <main className={styles.page}>
      <section className={`${styles.hero} ${styles.pink}`}>
        <div>
          <span className={styles.eyebrow}>TU CUENTA</span>
          <h1>Eliminar tu cuenta</h1>
          <p>Última actualización: {ACTUALIZADO}.</p>
        </div>
      </section>

      <article className={`${styles.content} ${styles.legal}`}>
        <div className={styles.summary}>
          <h2>En corto</h2>
          <ul>
            <li>Puedes pedir que eliminemos tu cuenta de Come cuando quieras, sin dar explicaciones.</li>
            <li>La solicitud se hace por correo a {CONTACTO} y se resuelve en un máximo de 30 días naturales.</li>
            <li>Se borran tu cuenta, tu perfil y las fichas de negocio que registraste.</li>
            <li>Es una acción definitiva: no podemos restaurar la cuenta ni su contenido.</li>
          </ul>
        </div>

        <h2 id="como">Cómo solicitarlo</h2>
        <p>
          Escríbenos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> desde el correo con el que te registraste, con el
          asunto <b>&laquo;Eliminar mi cuenta de Come&raquo;</b>. El botón de abajo abre tu aplicación de correo con
          todo prellenado.
        </p>
        {user?.email && (
          <p>
            Detectamos que tienes la sesión iniciada como <b>{user.email}</b>; la solicitud saldrá con ese correo.
          </p>
        )}
        <div className={styles.actions}>
          <a href={enlaceSolicitud(user?.email)}>Solicitar la eliminación</a>
          <Link href="/privacidad">Aviso de privacidad</Link>
        </div>
        <p>
          Si escribes desde una dirección distinta a la de tu cuenta, te pediremos una identificación oficial para
          confirmar que la solicitud es tuya. Si accediste con Google o con Apple, indícanos cuál de los dos usaste.
        </p>

        <h2 id="que-se-borra">Qué se elimina</h2>
        <ul>
          <li>Tu cuenta de acceso y tus credenciales.</li>
          <li>Tu nombre, correo electrónico y foto de perfil.</li>
          <li>Las fichas de los negocios que registraste y su menú.</li>
          <li>Las nominaciones que enviaste y que aún no se han publicado.</li>
          <li>La dirección guardada en tu dispositivo, que puedes borrar tú mismo desde la app o el navegador.</li>
        </ul>

        <h2 id="que-se-conserva">Qué se conserva y por cuánto tiempo</h2>
        <ul>
          <li><b>Contenido editorial ya publicado:</b> si la redacción publicó una ficha o una guía a partir de tu
            aportación, el texto puede permanecer en el directorio, sin ningún dato que te identifique.</li>
          <li><b>Registros técnicos y de seguridad:</b> hasta doce meses, en los plazos que fijan nuestros proveedores
            de infraestructura, para prevenir fraudes y abusos.</li>
          <li><b>Información exigida por ley:</b> el tiempo que impongan las obligaciones fiscales o legales que
            resulten aplicables.</li>
        </ul>
        <p>
          Concluidos esos plazos, la información se elimina o se anonimiza de forma irreversible. El detalle completo
          está en el <Link href="/privacidad">aviso de privacidad</Link>.
        </p>

        <h2 id="plazos">Plazos</h2>
        <p>
          Confirmamos la recepción de tu solicitud en un máximo de cinco días hábiles y la ejecutamos dentro de los 30
          días naturales siguientes. Te avisaremos por correo cuando la eliminación esté hecha.
        </p>

        <h2 id="alternativas">Si sólo quieres corregir o limitar algo</h2>
        <p>
          Eliminar la cuenta no siempre es lo que necesitas. También puedes pedirnos que corrijamos tus datos, que
          dejemos de enviarte comunicaciones o que retiremos la ficha de un negocio sin cerrar tu cuenta: son tus
          derechos de acceso, rectificación, cancelación y oposición, y se solicitan por el mismo correo. Los pasos
          están en el <Link href="/privacidad">aviso de privacidad</Link>.
        </p>

        <div className={styles.contactBox}>
          <p><b>Come · Mexica Gourmet</b></p>
          <p>Correo: <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a></p>
          <p>Sitio: comeapp.com.mx</p>
        </div>

        <div className={styles.actions}>
          <Link href="/">Volver al inicio</Link>
          <Link href="/terminos">Términos y condiciones</Link>
        </div>
      </article>
    </main>
  );
}
