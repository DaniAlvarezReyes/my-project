import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function TerminosPage() {
  return (
    <LegalPageLayout title="Términos y Condiciones" lastUpdated="13 de febrero de 2026">
      <h2>1. Aceptación de los Términos</h2>
      <p>
        Al acceder y utilizar este sitio web, aceptas cumplir con estos términos y condiciones. Si no estás de acuerdo, no debes usar nuestros servicios.
      </p>

      <h2>2. Uso del Sitio</h2>
      <p>Te comprometes a:</p>
      <ul>
        <li>Proporcionar información veraz y actualizada</li>
        <li>Mantener la confidencialidad de tu cuenta</li>
        <li>No usar el sitio para fines ilegales</li>
        <li>No intentar acceder a áreas restringidas</li>
      </ul>

      <h2>3. Productos y Precios</h2>
      <ul>
        <li>Los precios incluyen IVA</li>
        <li>Nos reservamos el derecho de modificar precios sin previo aviso</li>
        <li>Las imágenes son orientativas</li>
        <li>Disponibilidad sujeta a stock</li>
      </ul>

      <h2>4. Pedidos y Pagos</h2>
      <ul>
        <li>Aceptamos pagos mediante tarjeta de crédito/débito</li>
        <li>Los pedidos se procesan tras la confirmación del pago</li>
        <li>Nos reservamos el derecho de cancelar pedidos sospechosos</li>
      </ul>

      <h2>5. Envíos</h2>
      <ul>
        <li>Envíos a toda España en 3-5 días laborables</li>
        <li>Envío gratuito en pedidos superiores a 50€</li>
        <li>No nos responsabilizamos por retrasos del transportista</li>
      </ul>

      <h2>6. Devoluciones</h2>
      <ul>
        <li>30 días para devolver productos en perfecto estado</li>
        <li>Costes de devolución a cargo del cliente (excepto productos defectuosos)</li>
        <li>Reembolso en 14 días tras recibir la devolución</li>
      </ul>

      <h2>7. Propiedad Intelectual</h2>
      <p>
        Todo el contenido del sitio (textos, imágenes, logos) es propiedad de Sneakers Pro y está protegido por derechos de autor.
      </p>

      <h2>8. Limitación de Responsabilidad</h2>
      <p>
        No nos hacemos responsables de daños indirectos, pérdida de beneficios o interrupciones del servicio.
      </p>

      <h2>9. Legislación Aplicable</h2>
      <p>
        Estos términos se rigen por la legislación española. Para cualquier disputa, los tribunales de Madrid tendrán jurisdicción exclusiva.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Para consultas sobre estos términos: legal@sneakerspro.com
      </p>
    </LegalPageLayout>
  );
}
