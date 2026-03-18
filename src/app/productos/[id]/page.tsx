'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Rating } from '@/components/Rating';
import { ProductComments } from '@/components/ProductComments';
import SizeGuide from '@/components/SizeGuide';
import { ProductDetailSkeleton } from '@/components/Skeletons';
import RecentlyViewed, { addToRecentlyViewed } from '@/components/RecentlyViewed';
import RelatedProducts from '@/components/RelatedProducts';
import StockAlert from '@/components/StockAlert';
import AdBanner, { AdPlacements } from '@/components/AdBanner';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { getProductById } from '@/data/products';

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

  useEffect(() => {
    if (params.id) loadProduct();
  }, [params.id]);

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

  return (
    <div className="min-h-screen bg-gray-50">
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
              
              <div className="relative aspect-square">
                <img
                  src={imagesToShow[selectedImage] || 'https://via.placeholder.com/800'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
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
                <Button variant="primary" size="lg" fullWidth onClick={handleAddToCart}>
                  Añadir al carrito
                </Button>
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
          <ProductComments productId={product.id} />
        </div>

        <div className="my-8">
          <AdBanner slot={AdPlacements.PRODUCT_BELOW_COMMENTS} format="leaderboard" />
        </div>

        <RelatedProducts currentProductId={product.id} category={product.category} brand={product.brand} />
        <RecentlyViewed currentProductId={product.id} />
      </div>

      <Footer />
      {showSizeGuide && <SizeGuide onClose={() => setShowSizeGuide(false)} />}
    </div>
  );
}
