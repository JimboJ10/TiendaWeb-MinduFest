export interface ResumenVentas {
  total_ventas: number;
  total_facturado: number;
  promedio_venta: number;
  total_productos_vendidos: number;
}

export interface VentaPeriodo {
  ventaid: number;
  nventa: string;
  fecha: string;
  cliente: string;
  email: string;
  estado: string;
  total_productos: number;
  total_items: number;
  subtotal: number;
  envioprecio: number;
  total: number;
}

export interface ReporteVentasPeriodo {
  ventas: VentaPeriodo[];
  resumen: ResumenVentas;
}

export interface ProductoStock {
  productoid: number;
  titulo: string;
  categoria: string;
  stock: number;
  precio: number;
  valor_inventario: number;
  estado_stock: string;
  nventas: number;
  total_proveedores: number;
}

export interface ResumenStock {
  total_productos: number;
  total_unidades: number;
  valor_total_inventario: number;
  productos_sin_stock: number;
  productos_stock_bajo: number;
}

export interface ReporteStock {
  productos: ProductoStock[];
  resumen: ResumenStock;
}

export interface DashboardMetricas {
  periodo_dias: number;
  ventas: {
    total_ventas: number;
    total_facturado: number;
    promedio_venta: number;
  };
  productos: {
    total_productos: number;
    total_stock: number;
    productos_stock_bajo: number;
    valor_inventario: number;
  };
  clientes: {
    total_clientes: number;
    clientes_activos: number;
  };
  ordenes: {
    total_ordenes: number;
    total_ordenes_valor: number;
    ordenes_pendientes: number;
  };
}

export interface ProductoVenta {
  productoid: number;
  titulo: string;
  categoria: string;
  unidades_vendidas: number;
  numero_ventas: number;
  precio_promedio: number;
  total_ingresos: number;
  stock_actual: number;
}

export interface ResumenVentasProducto {
  total_productos_vendidos: number;
  total_unidades_vendidas: number;
  total_ingresos: number;
  producto_mas_vendido: string;
}

export interface ReporteVentasProducto {
  productos: ProductoVenta[];
  resumen: ResumenVentasProducto;
}