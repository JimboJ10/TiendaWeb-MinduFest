//////////////////////// Ventas ////////////////////////
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
  cantidad_inventario: number;
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

export interface ClienteVenta {
  usuarioid: number;
  cliente: string;
  email: string;
  pais: string;
  telefono?: string;
  dni?: string;
  total_compras: number;
  total_gastado: number;
  promedio_compra: number;
  ultima_compra: string;
  total_productos_comprados: number;
  primera_compra?: string;
  dias_sin_comprar?: number;
  horas_sin_comprar?: number;
}

export interface ResumenVentasCliente {
  total_clientes: number;
  total_clientes_activos: number;
  total_facturado: number;
  promedio_facturado_por_cliente: number;
  cliente_top: string;
}

export interface ReporteVentasCliente {
  clientes: ClienteVenta[];
  resumen: ResumenVentasCliente;
}

export interface MovimientoInventario {
  fecha: string;
  tipo_movimiento: string;
  producto: string;
  cantidad: number;
  direccion: string;
  referencia: string;
  cliente?: string;
  proveedor?: string;
  productoid?: number;
  precio_unitario?: number;
  valor_total?: number;
}

export interface ResumenMovimientos {
  total_movimientos: number;
  total_entradas: number;
  total_salidas: number;
  productos_afectados: number;
  valor_total_movimientos: number;
}

export interface ReporteMovimientos {
  movimientos: MovimientoInventario[];
  resumen: ResumenMovimientos;
  mensaje?: string;
}

export interface TransaccionPago {
  ventaid: number;
  nventa: string;
  fecha: string;
  cliente: string;
  email: string;
  telefono?: string;
  pais?: string;
  total_venta: number;
  pagado: number;
  saldo_pendiente: number;
  dias_transcurridos: number;
  rango_estado: string;
  estado_venta: string;
  metodo_pago: string;
  estado_pago: string;
}

export interface ResumenEstadoPagos {
  total_transacciones: number;
  pagos_exitosos: number;
  pagos_fallidos: number;
  entregas_completadas: number;
  ventas_canceladas: number;
  en_proceso: number;
  total_cobrado: number;
  total_perdido: number;
  clientes_afectados: number;
}

export interface ReporteEstadoPagos {
  transacciones: TransaccionPago[];
  resumen: ResumenEstadoPagos;
  tipo_reporte: string;
  mensaje?: string;
}

export interface CuentaPorPagar {
  ordencompraid: number;
  numero_orden: string;
  fecha_orden: string;
  proveedor: string;
  email: string;
  telefono?: string;
  total_orden: number;
  pagado: number;
  saldo_pendiente: number;
  fecha_entrega_esperada?: string;
  dias_desde_orden: number;
  rango_antiguedad: string;
  estado: string;
}

export interface ResumenCuentasPagar {
  total_ordenes: number;
  total_por_pagar: number;
  antiguedad_0_30: number;
  antiguedad_31_60: number;
  antiguedad_61_90: number;
  antiguedad_mas_90: number;
}

export interface ReporteCuentasPagar {
  ordenes: CuentaPorPagar[];
  resumen: ResumenCuentasPagar;
  mensaje?: string;
}