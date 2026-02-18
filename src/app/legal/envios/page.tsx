import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function EnviosPage() {
  return (
    <LegalPageLayout title="Información de Envíos" lastUpdated="13 de febrero de 2026">
      <h2>Zonas de Envío</h2>
      <p>Realizamos envíos a toda España peninsular, Baleares, Canarias, Ceuta y Melilla.</p>

      <h2>Tarifas de Envío</h2>
      <ul>
        <li><strong>España Peninsular</strong>: 5,99€ (Gratis en pedidos &gt; 50€)</li>
        <li><strong>Baleares</strong>: 9,99€</li>
        <li><strong>Canarias, Ceuta y Melilla</strong>: 14,99€</li>
      </ul>

      <h2>Plazos de Entrega</h2>
      <ul>
        <li><strong>España Peninsular</strong>: 3-5 días laborables</li>
        <li><strong>Baleares</strong>: 5-7 días laborables</li>
        <li><strong>Canarias, Ceuta y Melilla</strong>: 7-10 días laborables</li>
      </ul>

      <h2>Proceso de Envío</h2>
      <ol>
        <li>Confirmación del pedido (email inmediato)</li>
        <li>Preparación del pedido (24-48 horas)</li>
        <li>Envío del paquete (recibirás número de seguimiento)</li>
        <li>Entrega en tu domicilio</li>
      </ol>

      <h2>Seguimiento del Pedido</h2>
      <p>
        Una vez enviado tu pedido, recibirás un email con el número de seguimiento para rastrear tu paquete en tiempo real.
      </p>

      <h2>Problemas con el Envío</h2>
      <p>Si tu pedido no llega en el plazo indicado, contacta con nosotros en envios@sneakerspro.com</p>
    </LegalPageLayout>
  );
}
