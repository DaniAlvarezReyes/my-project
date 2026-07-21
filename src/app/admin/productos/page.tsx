'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/components/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';

interface ColorVariant {
  id?: string;
  color_name: string;
  color_hex: string;
  images: string[];
  stock: number;
  is_available: boolean;
  sizes: Size[];
}

interface Size {
  id?: string;
  size: string;
  stock: number;
  is_available: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  subcategory?: string;
  base_price: number;
  price?: number;          // alias of base_price from DB
  original_price?: number;
  rating: number;
  reviews_count?: number;
  reviews?: number;        // DB column name
  in_stock: boolean;
  total_stock: number;
  stock?: number;          // DB column name
  images?: string[];       // from DB
  badge?: string;
  color_variants?: ColorVariant[];
}

export default function AdminProductos() {
  const [products, setProducts] = useState<Product[]>([]);
  const toast = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Formulario de producto
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    brand: '',
    category: 'running',
    base_price: 0,
    badge: '',
  });

  // Colores del producto
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [showColorModal, setShowColorModal] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [currentColor, setCurrentColor] = useState<ColorVariant>({
    color_name: '',
    color_hex: '#000000',
    images: [''],
    stock: 0,
    is_available: true,
    sizes: [],
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          color_variants:product_color_variants(
            id,
            color_name,
            color_hex,
            images,
            stock,
            is_available,
            sizes:product_sizes(
              id,
              size,
              stock,
              is_available
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const productsWithVariants = (data || []).map(p => ({
        ...p,
        color_variants: p.color_variants || [],
        total_stock: p.stock || 0,
      }));
      
      setProducts(productsWithVariants);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      brand: '',
      category: 'running',
      base_price: 0,
      badge: '',
    });
    setColorVariants([]);
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      base_price: product.base_price || product.price || 0,
      original_price: product.original_price,
      badge: product.badge,
    });
    setColorVariants(product.color_variants || []);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.brand || !formData.base_price) {
      toast.warning('Por favor completa los campos requeridos');
      return;
    }

    if (colorVariants.length === 0) {
      toast.warning('Debes añadir al menos un color con imágenes');
      return;
    }

    // Mostrar loading
    const loadingAlert = await confirm({ title: 'Guardar cambios', message: '¿Guardar los cambios del producto?', confirmText: 'Guardar', variant: 'info' });
    if (!loadingAlert) return;

    try {
      const productId = editingProduct?.id || `${formData.brand?.toLowerCase()}-${formData.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      const totalStock = colorVariants.reduce((sum, c) => sum + c.stock, 0);
      const allImages = colorVariants.length > 0 ? colorVariants[0].images.filter(img => img.trim()) : [];
      const allSizes = [...new Set(colorVariants.flatMap(c => c.sizes.map(s => s.size)))];
      const allColors = colorVariants.map(c => c.color_name);
      
      const productData = {
        name: formData.name,
        description: formData.description || '',
        brand: formData.brand,
        category: formData.category || 'running',
        subcategory: formData.subcategory || null,
        price: formData.base_price,
        base_price: formData.base_price,
        original_price: formData.original_price || null,
        badge: formData.badge || null,
        in_stock: totalStock > 0,
        stock: totalStock,
        images: allImages.length > 0 ? allImages : ['https://via.placeholder.com/400'],
        sizes: allSizes,
        colors: allColors,
        rating: editingProduct?.rating || 0,
        reviews: editingProduct?.reviews || 0,
      };

      console.log('💾 GUARDANDO:', { id: productId, isEdit: !!editingProduct });

      if (editingProduct) {
        // ACTUALIZAR
        console.log('📝 Actualizando producto...');
        const { data: updated, error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select();

        if (updateError) {
          console.error('❌ ERROR UPDATE:', updateError);
          toast.error(`Error al actualizar: ${updateError.message}`);
          return;
        }
        console.log('✅ ACTUALIZADO:', updated);

        // ELIMINAR colores antiguos
        console.log('🗑️ Eliminando colores antiguos...');
        await supabase
          .from('product_color_variants')
          .delete()
          .eq('product_id', productId);
        
      } else {
        // CREAR NUEVO
        console.log('➕ Creando producto...');
        const { data: created, error: insertError } = await supabase
          .from('products')
          .insert([{ ...productData, id: productId }])
          .select();

        if (insertError) {
          console.error('❌ ERROR INSERT:', insertError);
          toast.error(`Error al crear: ${insertError.message}`);
          return;
        }
        console.log('✅ CREADO:', created);
      }

      // INSERTAR colores
      console.log('🎨 Insertando colores...');
      for (let i = 0; i < colorVariants.length; i++) {
        const color = colorVariants[i];
        console.log(`  Color ${i + 1}/${colorVariants.length}: ${color.color_name}`);
        
        const { data: colorData, error: colorError } = await supabase
          .from('product_color_variants')
          .insert([{
            product_id: productId,
            color_name: color.color_name,
            color_hex: color.color_hex,
            images: color.images.filter(img => img.trim() !== ''),
            stock: color.stock,
            is_available: color.is_available,
          }])
          .select()
          .maybeSingle();

        if (colorError) {
          console.error(`❌ ERROR color ${color.color_name}:`, colorError);
          toast.error(`Error al guardar color ${color.color_name}`);
          return;
        }

        // INSERTAR tallas
        if (color.sizes && color.sizes.length > 0) {
          console.log(`  └─ Insertando ${color.sizes.length} tallas...`);
          const sizesData = color.sizes.map(size => ({
            color_variant_id: colorData.id,
            size: size.size,
            stock: size.stock,
            is_available: size.is_available,
          }));

          const { error: sizesError } = await supabase
            .from('product_sizes')
            .insert(sizesData);

          if (sizesError) {
            console.error('❌ ERROR tallas:', sizesError);
            toast.error('Error al guardar tallas');
            return;
          }
        }
      }

      console.log('✅ TODO GUARDADO CORRECTAMENTE');
      
      // Cerrar modal y limpiar
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        brand: '',
        category: 'running',
        base_price: 0,
        badge: '',
      });
      setColorVariants([]);
      
      toast.success('Producto guardado correctamente');
      await loadProducts();
      
    } catch (error: any) {
      console.error('❌ ERROR GENERAL:', error);
      toast.error(error.message || 'Error desconocido');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    const del = await confirm({ title: 'Eliminar producto', message: `¿Estás seguro de eliminar "${productName}"? Esta acción no se puede deshacer.`, confirmText: 'Eliminar', variant: 'danger' }); if (!del) return;

    try {
      console.log('🗑️ Eliminando producto:', productId);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('❌ Error al eliminar:', error);
        toast.error(`Error al eliminar: ${error.message}`);
        return;
      }
      
      console.log('✅ Producto eliminado');
      toast.success('Producto eliminado correctamente');
      await loadProducts();
      
    } catch (error: any) {
      console.error('❌ Error general:', error);
      toast.error('Error al eliminar producto');
    }
  };

  const handleAddColor = () => {
    setEditingColorIndex(null);
    setCurrentColor({
      color_name: '',
      color_hex: '#000000',
      images: [''],
      stock: 0,
      is_available: true,
      sizes: [],
    });
    setShowColorModal(true);
  };

  const handleEditColor = (index: number) => {
    setEditingColorIndex(index);
    setCurrentColor({ ...colorVariants[index] });
    setShowColorModal(true);
  };

  const handleSaveColor = () => {
    if (!currentColor.color_name || currentColor.images.filter(img => img.trim()).length === 0) {
      toast.warning('Completa el nombre del color y al menos una imagen');
      return;
    }

    // El stock del color es SIEMPRE la suma del stock por talla (campo calculado)
    const computedStock = currentColor.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    const colorToSave: ColorVariant = { ...currentColor, stock: computedStock };

    if (editingColorIndex !== null) {
      const updated = [...colorVariants];
      updated[editingColorIndex] = colorToSave;
      setColorVariants(updated);
    } else {
      setColorVariants([...colorVariants, colorToSave]);
    }

    setShowColorModal(false);
  };

  const handleDeleteColor = async (index: number) => {
    const delColor = await confirm({ title: 'Eliminar color', message: '¿Eliminar este color del producto?', confirmText: 'Eliminar', variant: 'danger' }); if (delColor) {
      setColorVariants(colorVariants.filter((_, i) => i !== index));
    }
  };

  const addImageToCurrentColor = () => {
    setCurrentColor({
      ...currentColor,
      images: [...currentColor.images, ''],
    });
  };

  const updateColorImage = (index: number, value: string) => {
    const updated = [...currentColor.images];
    updated[index] = value;
    setCurrentColor({ ...currentColor, images: updated });
  };

  const removeColorImage = (index: number) => {
    setCurrentColor({
      ...currentColor,
      images: currentColor.images.filter((_, i) => i !== index),
    });
  };

  const addSizeToCurrentColor = () => {
    setCurrentColor({
      ...currentColor,
      sizes: [...currentColor.sizes, { size: '', stock: 0, is_available: true }],
    });
  };

  const updateSize = (index: number, field: keyof Size, value: any) => {
    const updated = [...currentColor.sizes];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentColor({ ...currentColor, sizes: updated });
  };

  const removeSize = (index: number) => {
    setCurrentColor({
      ...currentColor,
      sizes: currentColor.sizes.filter((_, i) => i !== index),
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-1">Administra el catálogo de productos de la tienda</p>
        </div>
        <button
          onClick={handleNewProduct}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Buscar por nombre o marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Productos</div>
          <div className="text-3xl font-bold text-gray-900">{products.length}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <div className="text-sm text-green-600">En Stock</div>
          <div className="text-3xl font-bold text-green-700">
            {products.filter(p => p.in_stock).length}
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <div className="text-sm text-red-600">Sin Stock</div>
          <div className="text-3xl font-bold text-red-700">
            {products.filter(p => !p.in_stock).length}
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <div className="text-sm text-blue-600">Stock Total</div>
          <div className="text-3xl font-bold text-blue-700">
            {products.reduce((sum, p) => sum + (p.stock || 0), 0)}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colores</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No hay productos. ¡Crea tu primer producto!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const firstColor = product.color_variants?.[0];
                  const firstImage = firstColor?.images?.[0] || product.images?.[0];
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={firstImage || 'https://via.placeholder.com/100?text=Sin+Imagen'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/100?text=Error';
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                        {product.badge && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            {product.badge}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{product.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">€{(product.price || product.base_price || 0).toFixed(2)}</div>
                        {product.original_price && (
                          <div className="text-sm text-gray-500 line-through">
                            €{product.original_price.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {product.color_variants?.slice(0, 3).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: color.color_hex }}
                              title={color.color_name}
                            />
                          ))}
                          {(product.color_variants?.length || 0) > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-xs">
                              +{(product.color_variants?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{product.stock || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.in_stock
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.in_stock ? '✓ En Stock' : '✗ Agotado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Marca *</label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Descripción</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Categoría *</label>
                  <select
                    value={formData.category || 'running'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="running">Running</option>
                    <option value="training">Training</option>
                    <option value="basketball">Basketball</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="football">Fútbol</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Precio Base (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_price || ''}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Precio Original (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.original_price || ''}
                    onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Badge (opcional)</label>
                <input
                  type="text"
                  value={formData.badge || ''}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="NUEVO, POPULAR, OFERTA..."
                />
              </div>

              {/* Colors Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Colores y Variantes</h3>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    + Añadir Color
                  </button>
                </div>

                {colorVariants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    No hay colores añadidos. Añade al menos un color con imágenes.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colorVariants.map((color, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-12 h-12 rounded-lg border-2 border-gray-300"
                              style={{ backgroundColor: color.color_hex }}
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{color.color_name}</div>
                              <div className="text-sm text-gray-600">
                                {color.images.filter(img => img.trim()).length} imágenes • 
                                {color.sizes.length} tallas • 
                                Stock: {color.stock}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditColor(index)}
                              className="text-blue-600 hover:text-blue-900 p-2"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColor(index)}
                              className="text-red-600 hover:text-red-900 p-2"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Modal */}
      {showColorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingColorIndex !== null ? 'Editar Color' : 'Añadir Color'}
            </h3>
            
            <div className="space-y-4">
              {/* Color Name and Hex */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Nombre del Color *</label>
                  <input
                    type="text"
                    value={currentColor.color_name}
                    onChange={(e) => setCurrentColor({ ...currentColor, color_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Negro, Blanco, Azul..."
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Código de Color *</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={currentColor.color_hex}
                      onChange={(e) => setCurrentColor({ ...currentColor, color_hex: e.target.value })}
                      className="w-16 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentColor.color_hex}
                      onChange={(e) => setCurrentColor({ ...currentColor, color_hex: e.target.value })}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="font-medium text-gray-700">Imágenes del Color *</label>
                  <button
                    type="button"
                    onClick={addImageToCurrentColor}
                    className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
                  >
                    + Añadir URL Manual
                  </button>
                </div>

                {/* Image Uploader con Drag & Drop */}
                <div className="mb-4">
                  <ImageUploader
                    onImageUploaded={(url) => {
                      // Añadir URL a la lista de imágenes
                      setCurrentColor(prev => ({
                        ...prev,
                        images: [...prev.images.filter(img => img.trim()), url]
                      }));
                    }}
                    maxFiles={10}
                    bucketName="product-images"
                    folder="products"
                  />
                </div>

                {/* Lista de URLs de imágenes */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">URLs de imágenes:</p>
                  {currentColor.images.filter(img => img.trim()).length === 0 ? (
                    <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                      Sin imágenes. Arrastra imágenes arriba o añade URLs manualmente.
                    </div>
                  ) : (
                    currentColor.images.map((img, idx) => (
                      img.trim() && (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded border overflow-hidden">
                            <img
                              src={img}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/64?text=Error';
                              }}
                            />
                          </div>
                          <input
                            type="url"
                            value={img}
                            onChange={(e) => updateColorImage(idx, e.target.value)}
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                          <button
                            type="button"
                            onClick={() => removeColorImage(idx)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex-shrink-0"
                            title="Eliminar imagen"
                          >
                            🗑️
                          </button>
                        </div>
                      )
                    ))
                  )}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium text-gray-700">Tallas y stock por talla</label>
                  <button
                    type="button"
                    onClick={addSizeToCurrentColor}
                    className="text-sm bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200"
                  >
                    + Añadir Talla
                  </button>
                </div>
                {currentColor.sizes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                    Sin tallas específicas (opcional)
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentColor.sizes.map((size, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={size.size}
                          onChange={(e) => updateSize(idx, 'size', e.target.value)}
                          className="w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="39"
                        />
                        <input
                          type="number"
                          value={size.stock === 0 ? '' : size.stock}
                          onChange={(e) => updateSize(idx, 'stock', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                          className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Stock"
                          min="0"
                        />
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={size.is_available}
                            onChange={(e) => updateSize(idx, 'is_available', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Disponible</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSize(idx)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock total del color (CALCULADO a partir de las tallas) */}
              <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-3">
                <div>
                  <label className="font-medium text-gray-700">Stock total del color</label>
                  <p className="text-xs text-gray-500">Se calcula automáticamente sumando el stock de cada talla</p>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {currentColor.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)}
                </span>
              </div>

              {/* Available Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="color-available"
                  checked={currentColor.is_available}
                  onChange={(e) => setCurrentColor({ ...currentColor, is_available: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="color-available" className="font-medium text-gray-700">
                  Color disponible para la venta
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
              <button
                type="button"
                onClick={() => setShowColorModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveColor}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Guardar Color
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
