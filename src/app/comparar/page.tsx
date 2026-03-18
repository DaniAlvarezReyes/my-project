'use client';
import React, { useState, useEffect } from 'react';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

export default function ComparadorPage() {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const loadSavedProducts = async () => {
      try {
        const saved = localStorage.getItem('compareProducts');
        if (saved) {
          const ids = JSON.parse(saved);
          if (ids.length > 0) {
            const { data } = await supabase.from('products').select('*').in('id', ids);
            if (data) setSelectedProducts(data);
          }
        }
      } catch (error) {
        console.warn('Error loading compare products:', error);
      }
    };
    loadSavedProducts();
  }, []);

  // Buscar en Supabase con debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${searchTerm}%`)
          .limit(8);
        if (data) setSearchResults(data);
      } catch (error) {
        console.warn('Search error:', error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const removeProduct = (productId: string) => {
    const newProducts = selectedProducts.filter(p => p.id !== productId);
    setSelectedProducts(newProducts);
    localStorage.setItem('compareProducts', JSON.stringify(newProducts.map(p => p.id)));
  };

  const addProduct = (product: any) => {
    if (selectedProducts.length >= 4) {
      toast.warning('Máximo 4 productos para comparar');
      return;
    }
    if (selectedProducts.find(p => p.id === product.id)) {
      toast.info('Este producto ya está en la comparación');
      return;
    }
    const newProducts = [...selectedProducts, product];
    setSelectedProducts(newProducts);
    localStorage.setItem('compareProducts', JSON.stringify(newProducts.map(p => p.id)));
  };

  const clearAll = () => {
    setSelectedProducts([]);
    localStorage.removeItem('compareProducts');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Comparador de Productos</h1>
          <p className="text-gray-600">Compara hasta 4 productos lado a lado</p>
        </div>

        {selectedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">No hay productos para comparar</h2>
            <p className="text-gray-600 mb-6">Añade productos desde la página de productos</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">{selectedProducts.length} de 4 productos seleccionados</p>
              <button onClick={clearAll} className="text-red-600 hover:text-red-800">
                Limpiar Todo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {selectedProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative">
                    <img src={product.images[0]} alt={product.name} className="w-full h-48 object-cover" />
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold">{product.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Marca:</span>
                        <span className="font-semibold">{product.brand}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Precio:</span>
                        <span className="font-bold text-blue-600">€{product.price}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Categoría:</span>
                        <span>{product.category}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Rating:</span>
                        <span>⭐ {product.rating || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={(product.in_stock ?? product.inStock) ? 'text-green-600' : 'text-red-600'}>
                          {(product.in_stock ?? product.inStock) ? 'Disponible' : 'Agotado'}
                        </span>
                      </div>
                    </div>
                    <Link href={`/productos/${product.id}`}>
                      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Ver Producto
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedProducts.length < 4 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Añadir Producto</h3>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {searchResults.map(product => (
                  <div key={product.id} className="border rounded-lg p-2 hover:border-blue-600 cursor-pointer" onClick={() => addProduct(product)}>
                    <img src={product.images[0]} className="w-full h-24 object-cover rounded mb-2" />
                    <p className="text-sm font-semibold truncate">{product.name}</p>
                    <p className="text-sm text-blue-600">€{product.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
