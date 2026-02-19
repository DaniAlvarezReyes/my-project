import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Política de Cookies" lastUpdated="13 de febrero de 2026">
      <h2>¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. 
        Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente y proporcionar 
        información a los propietarios del sitio.
      </p>

      <h2>¿Cómo utilizamos las cookies?</h2>
      <p>Utilizamos cookies para los siguientes propósitos:</p>

      <h3>Cookies Esenciales</h3>
      <p>Estas cookies son necesarias para el funcionamiento básico del sitio web:</p>
      <ul>
        <li><strong>Sesión de usuario</strong>: Para mantener tu sesión iniciada</li>
        <li><strong>Carrito de compra</strong>: Para recordar los productos en tu carrito</li>
        <li><strong>Preferencias</strong>: Para recordar tus preferencias de idioma y región</li>
      </ul>

      <h3>Cookies de Rendimiento</h3>
      <p>Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio:</p>
      <ul>
        <li><strong>Google Analytics</strong>: Para analizar el tráfico del sitio</li>
        <li><strong>Hotjar</strong>: Para entender el comportamiento del usuario</li>
      </ul>

      <h3>Cookies de Funcionalidad</h3>
      <p>Estas cookies permiten funcionalidades mejoradas:</p>
      <ul>
        <li><strong>Recordar preferencias</strong>: Tamaño de texto, diseño preferido</li>
        <li><strong>Chat en vivo</strong>: Para mantener conversaciones de soporte</li>
      </ul>

      <h3>Cookies de Marketing</h3>
      <p>Estas cookies se utilizan para mostrar anuncios relevantes:</p>
      <ul>
        <li><strong>Google Ads</strong>: Para mostrar anuncios personalizados</li>
        <li><strong>Facebook Pixel</strong>: Para remarketing en redes sociales</li>
      </ul>

      <h2>Cookies de Terceros</h2>
      <p>Algunos de nuestros socios también pueden establecer cookies:</p>
      <ul>
        <li><strong>Stripe</strong>: Para procesar pagos de forma segura</li>
        <li><strong>Google Maps</strong>: Para mostrar mapas en nuestra página de contacto</li>
        <li><strong>YouTube</strong>: Si visualizas vídeos incrustados</li>
      </ul>

      <h2>¿Cómo controlar las cookies?</h2>
      <p>Puedes controlar y/o eliminar cookies como desees:</p>

      <h3>En tu navegador</h3>
      <p>Todos los navegadores permiten gestionar cookies a través de su configuración:</p>
      <ul>
        <li><strong>Chrome</strong>: Settings → Privacy and security → Cookies</li>
        <li><strong>Firefox</strong>: Options → Privacy & Security → Cookies</li>
        <li><strong>Safari</strong>: Preferences → Privacy → Cookies</li>
        <li><strong>Edge</strong>: Settings → Cookies and site permissions</li>
      </ul>

      <h3>Herramientas de opt-out</h3>
      <ul>
        <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-blue-600 hover:text-blue-700">Google Analytics Opt-out</a></li>
        <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener" className="text-blue-600 hover:text-blue-700">Digital Advertising Alliance</a></li>
      </ul>

      <h2>Lista de Cookies Utilizadas</h2>
      <table className="w-full border-collapse border border-gray-300 my-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Nombre</th>
            <th className="border border-gray-300 p-2 text-left">Tipo</th>
            <th className="border border-gray-300 p-2 text-left">Duración</th>
            <th className="border border-gray-300 p-2 text-left">Propósito</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2">session_id</td>
            <td className="border border-gray-300 p-2">Esencial</td>
            <td className="border border-gray-300 p-2">Sesión</td>
            <td className="border border-gray-300 p-2">Mantener sesión de usuario</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">cart</td>
            <td className="border border-gray-300 p-2">Esencial</td>
            <td className="border border-gray-300 p-2">30 días</td>
            <td className="border border-gray-300 p-2">Recordar carrito de compra</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">_ga</td>
            <td className="border border-gray-300 p-2">Analítica</td>
            <td className="border border-gray-300 p-2">2 años</td>
            <td className="border border-gray-300 p-2">Google Analytics</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">preferences</td>
            <td className="border border-gray-300 p-2">Funcional</td>
            <td className="border border-gray-300 p-2">1 año</td>
            <td className="border border-gray-300 p-2">Guardar preferencias del usuario</td>
          </tr>
        </tbody>
      </table>

      <h2>Cambios en esta Política</h2>
      <p>
        Podemos actualizar nuestra Política de Cookies ocasionalmente. Te notificaremos cualquier cambio 
        publicando la nueva política en esta página y actualizando la fecha de "última actualización".
      </p>

      <h2>Más Información</h2>
      <p>
        Si tienes preguntas sobre nuestra política de cookies, contáctanos en:
      </p>
      <ul>
        <li>Email: cookies@sneakerspro.com</li>
        <li>Teléfono: +34 900 123 456</li>
      </ul>

      <h2>Consentimiento</h2>
      <p>
        Al continuar utilizando nuestro sitio web, aceptas el uso de cookies de acuerdo con esta política. 
        Puedes retirar tu consentimiento en cualquier momento ajustando la configuración de tu navegador.
      </p>
    </LegalPageLayout>
  );
}
