// PDF Export utility using browser print API
// No external dependencies needed - generates printable HTML

interface ReportData {
  title: string;
  subtitle?: string;
  date: string;
  rows: Record<string, any>[];
  columns: { key: string; label: string; format?: (v: any) => string }[];
  summary?: { label: string; value: string }[];
}

export function exportToPDF(data: ReportData) {
  const { title, subtitle, date, rows, columns, summary } = data;

  const tableRows = rows.map(row =>
    `<tr>${columns.map(col => `<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${col.format ? col.format(row[col.key]) : (row[col.key] ?? '-')}</td>`).join('')}</tr>`
  ).join('');

  const summaryHtml = summary ? `
    <div style="margin-top:24px;padding:16px;background:#f8f9fa;border-radius:8px">
      <h3 style="margin:0 0 12px;font-size:14px;color:#666">Resumen</h3>
      ${summary.map(s => `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px"><span>${s.label}</span><strong>${s.value}</strong></div>`).join('')}
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: -apple-system, sans-serif; margin: 40px; color: #1a1a1a; }
      @media print { body { margin: 20px; } }
      h1 { font-size: 24px; margin: 0; }
      .subtitle { color: #666; font-size: 14px; margin: 4px 0 24px; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 10px 12px; background: #f1f3f5; font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
      .logo { font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 4px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
    </style></head><body>
    <div class="header">
      <div>
        <div class="logo">Sneakers Pro</div>
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
      </div>
      <div style="text-align:right;font-size:13px;color:#666">
        <div>Fecha: ${date}</div>
        <div>${rows.length} registros</div>
      </div>
    </div>
    <table>
      <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    ${summaryHtml}
    <div class="footer">Sneakers Pro — Informe generado automáticamente el ${date}</div>
    </body></html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

// Pre-built report generators
export function exportOrdersReport(orders: any[]) {
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  exportToPDF({
    title: 'Informe de Pedidos',
    subtitle: `${orders.length} pedidos`,
    date: new Date().toLocaleDateString('es-ES'),
    columns: [
      { key: 'id', label: 'ID', format: v => `#${v?.slice(0,8)}` },
      { key: 'created_at', label: 'Fecha', format: v => new Date(v).toLocaleDateString('es-ES') },
      { key: 'status', label: 'Estado' },
      { key: 'payment_method', label: 'Pago' },
      { key: 'total', label: 'Total', format: v => `€${(v || 0).toFixed(2)}` },
    ],
    rows: orders,
    summary: [
      { label: 'Total pedidos', value: String(orders.length) },
      { label: 'Ingresos totales', value: `€${totalRevenue.toFixed(2)}` },
      { label: 'Ticket medio', value: `€${orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00'}` },
    ],
  });
}

export function exportProductsReport(products: any[]) {
  exportToPDF({
    title: 'Informe de Inventario',
    subtitle: `${products.length} productos`,
    date: new Date().toLocaleDateString('es-ES'),
    columns: [
      { key: 'name', label: 'Producto' },
      { key: 'brand', label: 'Marca' },
      { key: 'category', label: 'Categoría' },
      { key: 'price', label: 'Precio', format: v => `€${(v || 0).toFixed(2)}` },
      { key: 'stock', label: 'Stock', format: v => String(v || 0) },
    ],
    rows: products,
    summary: [
      { label: 'Total productos', value: String(products.length) },
      { label: 'Stock bajo (≤5)', value: String(products.filter(p => (p.stock || 0) <= 5).length) },
      { label: 'Agotados', value: String(products.filter(p => (p.stock || 0) === 0).length) },
    ],
  });
}
