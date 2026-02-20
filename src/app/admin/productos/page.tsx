'use client';
import React, { useState } from 'react';
import { products as staticProducts } from '@/data/products';

export default function AdminProductos() {
  const [products, setProducts] = useState(staticProducts);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Productos ({products.length})</h1>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.category}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.brand}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">€{product.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.stock}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.inStock ? 'Disponible' : 'Agotado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">Editar</button>
                  <button className="text-red-600 hover:text-red-800">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
