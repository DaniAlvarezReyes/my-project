'use client';
import React, { useState } from 'react';

const sizeData = [
  { eu: '36', uk: '3.5', us_m: '4', us_w: '5.5', cm: '22.5' },
  { eu: '37', uk: '4', us_m: '4.5', us_w: '6', cm: '23' },
  { eu: '37.5', uk: '4.5', us_m: '5', us_w: '6.5', cm: '23.5' },
  { eu: '38', uk: '5', us_m: '5.5', us_w: '7', cm: '24' },
  { eu: '38.5', uk: '5.5', us_m: '6', us_w: '7.5', cm: '24.5' },
  { eu: '39', uk: '6', us_m: '6.5', us_w: '8', cm: '25' },
  { eu: '40', uk: '6.5', us_m: '7', us_w: '8.5', cm: '25.5' },
  { eu: '40.5', uk: '7', us_m: '7.5', us_w: '9', cm: '26' },
  { eu: '41', uk: '7.5', us_m: '8', us_w: '9.5', cm: '26.5' },
  { eu: '42', uk: '8', us_m: '8.5', us_w: '10', cm: '27' },
  { eu: '42.5', uk: '8.5', us_m: '9', us_w: '10.5', cm: '27.5' },
  { eu: '43', uk: '9', us_m: '9.5', us_w: '11', cm: '28' },
  { eu: '44', uk: '9.5', us_m: '10', us_w: '11.5', cm: '28.5' },
  { eu: '44.5', uk: '10', us_m: '10.5', us_w: '12', cm: '29' },
  { eu: '45', uk: '10.5', us_m: '11', us_w: '12.5', cm: '29.5' },
  { eu: '46', uk: '11', us_m: '12', us_w: '13', cm: '30' },
];

export default function SizeGuide({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'table' | 'measure'>('table');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Guía de Tallas</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab('table')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'table' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tabla de equivalencias
          </button>
          <button
            onClick={() => setTab('measure')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'measure' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cómo medir tu pie
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {tab === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">EU</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">UK</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">US (H)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">US (M)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">CM</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeData.map((row, i) => (
                    <tr key={row.eu} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{row.eu}</td>
                      <td className="px-4 py-2.5 text-gray-700">{row.uk}</td>
                      <td className="px-4 py-2.5 text-gray-700">{row.us_m}</td>
                      <td className="px-4 py-2.5 text-gray-700">{row.us_w}</td>
                      <td className="px-4 py-2.5 text-gray-700">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-xl p-5">
                <h3 className="font-semibold text-blue-900 mb-3">Pasos para medir tu pie</h3>
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Coloca un papel en el suelo contra la pared. Pon tu pie encima con el talón tocando la pared.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Marca con un bolígrafo la punta de tu dedo más largo.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Mide la distancia desde el borde del papel (pared) hasta la marca.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>Busca esa medida en cm en la tabla de equivalencias.</span>
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50 rounded-xl p-5">
                <h3 className="font-semibold text-amber-900 mb-2">Consejos</h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Mide tus pies por la tarde, cuando están ligeramente más hinchados.</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Si un pie es más grande que el otro, usa la medida del pie más grande.</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Si estás entre dos tallas, elige la más grande.</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Las zapatillas de running suelen necesitar media talla más que tu talla habitual.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
