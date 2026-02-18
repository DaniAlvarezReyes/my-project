'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Rating } from '@/components/Rating';
import { useCart } from '@/context/CartContext';
import { getProductById } from '@/data/products';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const product = getProductById(params.id as string);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

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
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Por favor selecciona una talla');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Por favor selecciona un color');
      return;
    }

    addItem(product, quantity, selectedSize, selectedColor);
    alert(`${product.name} añadido al carrito!`);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Inicio
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
              <Link href="/productos" className="text-gray-700 hover:text-blue-600">
                Productos
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-900 font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galería de imágenes */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4 relative">
              {product.badge && (
                <span className={`absolute top-4 left-4 z-10 px-3 py-1 text-xs font-bold text-white rounded-full ${
                  product.badge === 'NUEVO' ? 'bg-blue-600' :
                  product.badge === 'POPULAR' ? 'bg-purple-600' :
                  product.badge === 'OFERTA' ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-full">
                  -{discount}%
                </span>
              )}
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </div>

            {/* Miniaturas */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div>
            <div className="bg-white rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <Rating value={product.rating} size="lg" showValue />
                <span className="text-sm text-gray-600">
                  ({product.reviews} {product.reviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              {/* Precio */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">
                    €{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-2xl text-gray-500 line-through">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">IVA incluido</p>
              </div>

              {/* Descripción */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>

              {/* Selector de talla */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block font-semibold mb-3">
                    Talla {selectedSize && `- ${selectedSize}`}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 border-2 rounded-lg font-medium transition-colors ${
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

              {/* Selector de color */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block font-semibold mb-3">
                    Color {selectedColor && `- ${selectedColor}`}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
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

              {/* Cantidad */}
              <div className="mb-6">
                <label className="block font-semibold mb-3">Cantidad</label>
                <div className="flex items-center border border-gray-300 rounded-lg w-32">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-100"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {product.stock} unidades disponibles
                </p>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  {product.inStock ? 'Añadir al Carrito' : 'Agotado'}
                </Button>
                <Button variant="outline" size="lg" fullWidth>
                  Añadir a Favoritos
                </Button>
              </div>

              {/* Información de envío */}
              <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Envío gratis en pedidos superiores a 50€</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Devolución gratuita en 30 días</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Entrega en 3-5 días laborables</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza"
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
