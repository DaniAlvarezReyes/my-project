import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sneakerspro.com';

async function getProduct(id: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from('products')
      .select('id, name, description, price, original_price, brand, category, images, rating, reviews, in_stock, badge')
      .eq('id', id)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      title: 'Producto | Sneakers Pro',
      description: 'Explora nuestra colección de zapatillas en Sneakers Pro',
    };
  }

  const title = `${product.name} — ${product.brand} | Sneakers Pro`;
  const description = product.description
    ? `${product.description.slice(0, 155)}...`
    : `Compra ${product.name} de ${product.brand} en Sneakers Pro. Envío gratis en pedidos +50€.`;
  const image = product.images?.[0] || `${BASE_URL}/og-default.jpg`;
  const url = `${BASE_URL}/productos/${product.id}`;

  const price = product.price?.toFixed(2);
  const availability = product.in_stock !== false ? 'instock' : 'oos';

  return {
    title,
    description,
    keywords: [product.name, product.brand, product.category, 'zapatillas', 'sneakers', 'comprar'],
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      siteName: 'Sneakers Pro',
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    other: {
      'product:price:amount': price || '',
      'product:price:currency': 'EUR',
      'product:availability': availability,
      'product:brand': product.brand || '',
      'product:category': product.category || '',
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
