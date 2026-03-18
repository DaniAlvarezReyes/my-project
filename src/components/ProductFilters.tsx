'use client';
import React, { useState } from 'react';

interface FilterOptions {
  categories: string[];
  brands: string[];
  priceRange: { min: number; max: number };
  sortBy: string;
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableCategories: string[];
  availableBrands: string[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  onFilterChange,
  availableCategories,
  availableBrands
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(true);

  const applyFilters = () => {
    onFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      priceRange: { min: priceMin, max: priceMax },
      sortBy
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceMin(0);
    setPriceMax(500);
    setSortBy('featured');
    onFilterChange({
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 500 },
      sortBy: 'featured'
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  React.useEffect(() => {
    applyFilters();
  }, [selectedCategories, selectedBrands, priceMin, priceMax, sortBy]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Filtros</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden text-blue-600"
        >
          {showFilters ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {showFilters && (
        <div className="space-y-6">
          {/* Ordenar */}
          <div>
            <label className="block font-semibold mb-2">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
              <option value="newest">Más Nuevos</option>
            </select>
          </div>

          {/* Categorías */}
          <div>
            <label className="block font-semibold mb-2">Categorías</label>
            <div className="space-y-2">
              {availableCategories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Marcas */}
          <div>
            <label className="block font-semibold mb-2">Marcas</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableBrands.map(brand => (
                <label key={brand} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rango de Precio */}
          <div>
            <label className="block font-semibold mb-2">
              Precio: €{priceMin} - €{priceMax}
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="500"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="500"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Limpiar filtros */}
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
};
