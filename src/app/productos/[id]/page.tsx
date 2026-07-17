'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Rating } from '@/components/Rating';
import { ReviewSection } from '@/components/ReviewSection';
import SizeGuide from '@/components/SizeGuide';
import { ProductDetailSkeleton } from '@/components/Skeletons';
import RecentlyViewed, { addToRecentlyViewed } from '@/components/RecentlyViewed';
import RelatedProducts from '@/components/RelatedProducts';
import StockAlert from '@/components/StockAlert';
import StickyAddToCart from '@/components/StickyAddToCart';
import AdBanner, { AdPlacements } from '@/components/AdBanner';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { getProductById } from '@/data/products';
import PriceAlert from '@/components/PriceAlert';
import ImageLightbox from '@/components/ImageLightbox';

export default function ProductDetailPage() {
  const params = useParams();
  const { addItem } = useCart();
  const toast = useToast();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [communityImages, setCommunityImages] = useState<{ url: string; author: string }[]>([]);

  // Track scroll to show/hide sticky cart
  useEffect(() => {
    const onScroll = () => setShowStickyCart(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (params.id) {
      loadProduct();
      loadCommunityImages(params.id as string);
    }
  }, [params.id]);

  const loadCommunityImages = async (productId: string) => {
    try {
      const { data } = await supabase
        .from('product_comments')
        .select('images, author_name')
        .eq('product_id', productId)
        .not('images', 'is', null)
        .limit(10);
      if (data) {
        const imgs: { url: string; author: string }[] = [];
        data.forEach((c: any) => {
          if (Array.isArray(c.images)) {
            c.images.slice(0, 2).forEach((url: string) => {
              if (url) imgs.push({ url, author: c.author_name || 'Cliente' });
            });
          }
        });
        setCommunityImages(imgs.slice(0, 6));
      }
    } catch {}
  };

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColor]);

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
  };

  const loadProduct = async (retries = 1) => {
    setLoading(true);
    try {
      let dbProduct = null;
      const productId = params.id as string;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      const selectQuery = `*, color_variants:product_color_variants(id, color_name, color_hex, images, stock, is_available, sizes:product_sizes(*))`;

      // 1) UUID — direct match
      if (isUUID) {
        const { data } = await supabase.from('products').select(selectQuery).eq('id', productId).maybeSingle();
        dbProduct = data;
      }

      // 2) Non-UUID — smart keyword search
      if (!dbProduct && !isUUID) {
        // Clean the slug: split, deduplicate, remove timestamps & noise
        const rawWords = productId.replace(/-/g, ' ').split(' ').filter(Boolean);
        const keywords = [...new Set(rawWords)]
          .filter(w => w.length > 1)                     // remove single chars
          .filter(w => !/^\d{8,}$/.test(w))              // remove timestamps (8+ digits)
          .filter(w => !['example', 'test', 'undefined', 'null'].includes(w.toLowerCase()));

        // Strategy A: chain ilike for each keyword (AND logic)
        if (keywords.length >= 2) {
          try {
            let query = supabase.from('products').select(selectQuery);
            // Use the 2-3 most meaningful keywords
            const searchWords = keywords.slice(0, 3);
            for (const word of searchWords) {
              query = query.ilike('name', `%${word}%`);
            }
            const { data } = await query.limit(1).maybeSingle();
            if (data) dbProduct = data;
          } catch {}
        }

        // Strategy B: try with just the first keyword + brand match
        if (!dbProduct && keywords.length >= 1) {
          try {
            const { data } = await supabase.from('products').select(selectQuery)
              .or(`name.ilike.%${keywords[0]}%,brand.ilike.%${keywords[0]}%`)
              .limit(5);
            // Pick the best match from results
            if (data && data.length > 0) {
              const nameLower = keywords.join(' ').toLowerCase();
              dbProduct = data.find(p => {
                const pName = p.name?.toLowerCase() || '';
                return keywords.filter(k => pName.includes(k.toLowerCase())).length >= 2;
              }) || data[0];
            }
          } catch {}
        }
      }

      if (dbProduct) {
        setProduct(dbProduct);
        addToRecentlyViewed(dbProduct);
        if (dbProduct.color_variants?.length > 0) {
          setSelectedColor(dbProduct.color_variants[0].color_name);
        }
      } else {
        const staticProduct = getProductById(productId);
        setProduct(staticProduct || null);
      }
    } catch (error: any) {
      if (retries > 0 && error?.name !== 'AbortError') {
        await new Promise(r => setTimeout(r, 800));
        return loadProduct(retries - 1);
      }
      const staticProduct = getProductById(params.id as string);
      setProduct(staticProduct || null);
    } finally {
      setLoading(false);
    }
  };

  // HOOKS deben ir ANTES de cualquier return condicional (Rules of Hooks)
  const hasColorVariants = product?.color_variants && product.color_variants.length > 0;
  
  const currentColorVariant = useMemo(() => {
    if (!product || !hasColorVariants || !selectedColor) return null;
    return product.color_variants.find((c: any) => c.color_name === selectedColor) || null;
  }, [product, hasColorVariants, selectedColor]);
  
  const imagesToShow = useMemo(() => {
    if (!product) return [];
    return currentColorVariant?.images || product.images || [];
  }, [product, currentColorVariant]);
  
  const colorsToShow = useMemo(() => {
    if (!product) return [];
    return hasColorVariants
      ? product.color_variants.map((c: any) => c.color_name)
      : (product.colors || []);
  }, [product, hasColorVariants]);
  
  const sizesToShow = useMemo(() => {
    if (!product) return [];
    return currentColorVariant?.sizes
      ? currentColorVariant.sizes.map((s: any) => s.size)
      : (product.sizes || []);
  }, [product, currentColorVariant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Link href="/productos">
            <Button variant="primary">Volver a Productos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getDeliveryDate = () => {
    const date = new Date();
    let businessDays = 0;
    while (businessDays < 3) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) businessDays++;
    }
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleAddToCart = () => {
    if (sizesToShow.length > 0 && !selectedSize) {
      toast.warning('Por favor selecciona una talla');
      return;
    }
    if (colorsToShow.length > 0 && !selectedColor) {
      toast.warning('Por favor selecciona un color');
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
    toast.success(`${product.name} añadido al carrito`);
  };

  const discount = (product.original_price || product.originalPrice) ?
    Math.round((((product.original_price || product.originalPrice) - product.price) / (product.original_price || product.originalPrice)) * 100) : 0;

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    image: imagesToShow,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sneakerspro.com'}/productos/${product.id}`,
      priceCurrency: 'EUR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.in_stock !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Sneakers Pro' },
    },
    aggregateRating: product.rating && product.reviews ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  } : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: process.env.NEXT_PUBLIC_APP_URL || 'https://sneakerspro.com' },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sneakerspro.com'}/productos` },
      { '@type': 'ListItem', position: 3, name: product?.name || 'Producto', item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sneakerspro.com'}/productos/${product?.id}` },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li><Link href="/" className="text-gray-700 hover:text-blue-600">Inicio</Link></li>
            <li><span className="text-gray-400 mx-2">/</span></li>
            <li><Link href="/productos" className="text-gray-700 hover:text-blue-600">Productos</Link></li>
            <li><span className="text-gray-400 mx-2">/</span></li>
            <li><span className="text-gray-900 font-medium">{product.name}</span></li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* CARRUSEL */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4 relative">
              {product.badge && (
                <span className={`absolute top-4 left-4 z-10 px-3 py-1 text-xs font-bold text-white rounded-full ${
                  product.badge === 'NUEVO' ? 'bg-blue-600' :
                  product.badge === 'POPULAR' ? 'bg-purple-600' :
                  product.badge === 'OFERTA' ? 'bg-red-600' : 'bg-gray-600'
                }`}>{product.badge}</span>
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-full">
                  -{discount}%
                </span>
              )}
              
              <div className="relative aspect-square group cursor-zoom-in" onClick={() => setShowLightbox(true)}>
                <img
                  src={imagesToShow[selectedImage] || 'https://via.placeholder.com/800'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
                
                {imagesToShow.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev === 0 ? imagesToShow.length - 1 : prev - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev === imagesToShow.length - 1 ? 0 : prev + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImage + 1} / {imagesToShow.length}
                    </div>
                  </>
                )}
              </div>
            </div>

            {imagesToShow.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {imagesToShow.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt={`Vista ${index + 1}`} className="w-full h-24 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div>
            <div className="bg-white rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center gap-4 mb-6">
                <Rating value={product.rating} size="lg" showValue />
                <span className="text-sm text-gray-600">({product.reviews} reseñas)</span>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold">€{product.price.toFixed(2)}</span>
                  {(product.original_price || product.originalPrice) && (
                    <span className="text-2xl text-gray-500 line-through">
                      €{(product.original_price || product.originalPrice).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">IVA incluido</p>
              </div>

              <div className="mb-6 pb-6 border-b">
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>

              {/* SELECTOR DE COLOR */}
              {colorsToShow.length > 0 && (
                <div className="mb-6">
                  <label className="block font-semibold mb-3">
                    Color {selectedColor && `- ${selectedColor}`}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorsToShow.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => handleColorClick(color)}
                        className={`px-4 py-2 border-2 rounded-lg font-medium transition ${
                          selectedColor === color
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SELECTOR DE TALLA */}
              {sizesToShow.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold">
                      Talla {selectedSize && `- ${selectedSize}`}
                    </label>
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Guía de tallas
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {sizesToShow.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 border-2 rounded-lg font-medium transition ${
                          selectedSize === size
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CANTIDAD */}
              <div className="mb-6">
                <label className="block font-semibold mb-3">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-gray-400 font-bold"
                  >-</button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg font-semibold"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-gray-400 font-bold"
                  >+</button>
                </div>
              </div>

              {product.in_stock === false || (product.stock !== undefined && product.stock <= 0) ? (
                <StockAlert productId={product.id} productName={product.name} />
              ) : (
                <>
                  <Button variant="primary" size="lg" fullWidth onClick={handleAddToCart}>
                    Añadir al carrito
                  </Button>
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    <span>Recíbelo el <strong>{getDeliveryDate()}</strong> con envío express</span>
                  </div>
                </>
              )}

              {/* Price alert — only show when in stock and has a price */}
              {product.price > 0 && product.in_stock !== false && (
                <div className="mt-3">
                  <PriceAlert
                    productId={product.id}
                    productName={product.name}
                    currentPrice={product.price}
                  />
                </div>
              )}

              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span>Envío gratuito en pedidos superiores a 50€</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Devoluciones gratuitas en 30 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <ReviewSection productId={product.id} />
        </div>

        <div className="my-8">
          <AdBanner slot={AdPlacements.PRODUCT_BELOW_COMMENTS} format="leaderboard" />
        </div>

        <RelatedProducts currentProductId={product.id} category={product.category} brand={product.brand} />

        {/* ─── UGC SECTION ─── */}
        <section className="mt-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Comunidad</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cómo queda en la vida real</h2>
            </div>
            <button className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black dark:hover:text-white transition-colors hidden sm:block">
              Comparte el tuyo →
            </button>
          </div>
          {communityImages.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {communityImages.map((img, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800 group cursor-pointer relative">
                    <img
                      src={img.url}
                      alt={`Foto de ${img.author}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-white overflow-hidden flex items-center justify-center">
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                      </div>
                      <span className="text-[9px] text-white font-bold drop-shadow">{img.author}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center text-gray-400 mt-4">Fotos reales de nuestra comunidad de clientes verificados</p>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700">
              <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-neutral-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p className="text-sm text-gray-400 dark:text-neutral-500">Sé el primero en compartir una foto con este producto</p>
              <p className="text-xs text-gray-300 dark:text-neutral-600 mt-1">Deja una reseña con foto y aparecerá aquí</p>
            </div>
          )}
        </section>

        {/* ─── COMPLETA EL LOOK ─── */}
        {product && (
          <section className="mt-16 mb-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Cross-sell</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Completa el look</h2>
              </div>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Main product */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-28 h-28 mx-auto bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-sm mb-2">
                    <img src={imagesToShow[0] || 'https://via.placeholder.com/112'} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[112px] line-clamp-2">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">€{product.price.toFixed(2)}</p>
                </div>

                {/* Curated accessories */}
                {[
                  { name: 'Calcetines Premium', price: 12.99, img: 'photo-1571781565036-d3f759be73e4', href: '/productos?categoria=accesorios' },
                  { name: 'Cordones de colores', price: 8.99, img: 'photo-1542291026-7eec264c27ff', href: '/productos?categoria=accesorios' },
                ].map((acc, idx) => (
                  <React.Fragment key={idx}>
                    <div className="text-2xl text-gray-300 dark:text-neutral-700 font-light hidden sm:block">+</div>
                    <div className="flex-shrink-0 text-center">
                      <Link href={acc.href} className="block">
                        <div className="w-28 h-28 mx-auto bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-sm mb-2 hover:border-black dark:hover:border-white transition-colors">
                          <img
                            src={`https://images.unsplash.com/${acc.img}?w=112&q=75&fit=crop`}
                            alt={acc.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[112px] line-clamp-2">{acc.name}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">€{acc.price.toFixed(2)}</p>
                      </Link>
                    </div>
                  </React.Fragment>
                ))}

                <div className="sm:ml-auto text-center sm:text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total del look</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">€{(product.price + 12.99 + 8.99).toFixed(2)}</p>
                  <Link
                    href="/carrito"
                    className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Añadir todo al look
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <RecentlyViewed currentProductId={product.id} />
      </div>

      <Footer />
      {showSizeGuide && <SizeGuide onClose={() => setShowSizeGuide(false)} />}
      {product && <StickyAddToCart product={product} onAddToCart={handleAddToCart} visible={showStickyCart && (product.in_stock !== false)} />}
      {showLightbox && imagesToShow.length > 0 && <ImageLightbox images={imagesToShow} initialIndex={selectedImage} onClose={() => setShowLightbox(false)} />}
    </div>
  );
}
