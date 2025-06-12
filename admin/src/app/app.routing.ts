import { Routes, RouterModule } from "@angular/router";
import { ModuleWithProviders } from "@angular/core";
import { LoginComponent } from "./components/login/login.component";
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { IndexClienteComponent } from "./components/clientes/index-cliente/index-cliente.component";
import { CreateClienteComponent } from "./components/clientes/create-cliente/create-cliente.component";
import { EditClienteComponent } from "./components/clientes/edit-cliente/edit-cliente.component";
import { CreateProductoComponent } from "./components/productos/create-producto/create-producto.component";
import { IndexProductoComponent } from "./components/productos/index-producto/index-producto.component";
import { UpdateProductoComponent } from "./components/productos/update-producto/update-producto.component";
import { InicioComponent } from "./components/inicio/inicio.component";
import { InventarioProductoComponent } from "./components/productos/inventario-producto/inventario-producto.component";
import { DireccionClienteComponent } from "./components/clientes/direccion-cliente/direccion-cliente.component";
import { IndexVentasComponent } from "./components/ventas/index-ventas/index-ventas.component";
import { DetalleVentasComponent } from "./components/ventas/detalle-ventas/detalle-ventas.component";
import { ReviewsProductoComponent } from "./components/productos/reviews-producto/reviews-producto.component";
import { IndexProveedorComponent } from "./components/proveedores/index-proveedor/index-proveedor.component";
import { CreateProveedorComponent } from "./components/proveedores/create-proveedor/create-proveedor.component";
import { EditProveedorComponent } from "./components/proveedores/edit-proveedor/edit-proveedor.component";
import { ShowProveedorComponent } from "./components/proveedores/show-proveedor/show-proveedor.component";
import { ProductosProveedorComponent } from "./components/proveedores/productos-proveedor/productos-proveedor.component";
import { IndexOrdenCompraComponent } from "./components/ordenes-compra/index-orden-compra/index-orden-compra.component";
import { CreateOrdenCompraComponent } from "./components/ordenes-compra/create-orden-compra/create-orden-compra.component";
import { EditOrdenCompraComponent } from "./components/ordenes-compra/edit-orden-compra/edit-orden-compra.component";
import { ShowOrdenCompraComponent } from "./components/ordenes-compra/show-orden-compra/show-orden-compra.component";
import { RecibirProductosComponent } from "./components/ordenes-compra/recibir-productos/recibir-productos.component";
import { IndexFinanzasComponent } from "./components/finanzas/index-finanzas/index-finanzas.component";
import { PlanCuentasComponent } from "./components/finanzas/plan-cuentas/plan-cuentas.component";
import { CrearCuentaComponent } from "./components/finanzas/crear-cuenta/crear-cuenta.component";
import { AsientosContablesComponent } from "./components/finanzas/asientos-contables/asientos-contables.component";
import { CrearAsientoComponent } from "./components/finanzas/crear-asiento/crear-asiento.component";
import { FlujoCajaComponent } from "./components/finanzas/flujo-caja/flujo-caja.component";
import { RegistrarMovimientoComponent } from "./components/finanzas/registrar-movimiento/registrar-movimiento.component";
import { BalanceGeneralComponent } from "./components/finanzas/balance-general/balance-general.component";
import { EstadoResultadosComponent } from "./components/finanzas/estado-resultados/estado-resultados.component";
import { EditarCuentaComponent } from "./components/finanzas/editar-cuenta/editar-cuenta.component";
import { IndexReportesComponent } from "./components/reportes/index-reportes/index-reportes.component";
import { ReporteVentasPeriodoComponent } from "./components/reportes/reporte-ventas-periodo/reporte-ventas-periodo.component";
import { ReporteVentasProductoComponent } from "./components/reportes/reporte-ventas-producto/reporte-ventas-producto.component";
import { ReporteVentasClienteComponent } from "./components/reportes/reporte-ventas-cliente/reporte-ventas-cliente.component";
import { ReporteStockActualComponent } from "./components/reportes/reporte-stock-actual/reporte-stock-actual.component";
import { ReporteMovimientosInventarioComponent } from "./components/reportes/reporte-movimientos-inventario/reporte-movimientos-inventario.component";
import { ReporteCuentasPagarComponent } from "./components/reportes/reporte-cuentas-pagar/reporte-cuentas-pagar.component";
import { ReporteActividadUsuariosComponent } from "./components/reportes/reporte-actividad-usuarios/reporte-actividad-usuarios.component";
import { ReporteEstadoPagosComponent } from "./components/reportes/reporte-estado-pagos/reporte-estado-pagos.component";

const appRoutes : Routes = [
    {path:'', redirectTo: 'admin', pathMatch:'full'},
    {path: 'admin', component:InicioComponent, canActivate: [AuthGuard]},
    {path: 'panel', children:[
        {path: 'clientes', component:IndexClienteComponent, canActivate:[AuthGuard]},
        {path: 'clientes/registro', component:CreateClienteComponent, canActivate:[AuthGuard]},
        {path: 'clientes/:id', component:EditClienteComponent, canActivate:[AuthGuard]},

        {path: 'productos/registro', component:CreateProductoComponent, canActivate:[AuthGuard]},
        {path: 'productos', component:IndexProductoComponent, canActivate:[AuthGuard]},
        {path: 'productos/:id', component:UpdateProductoComponent, canActivate:[AuthGuard]},
        {path: 'productos/inventario/:id', component:InventarioProductoComponent, canActivate:[AuthGuard]},
        {path: 'productos/reviews/:id', component:ReviewsProductoComponent, canActivate:[AuthGuard]},
        
        { path: 'proveedores', component: IndexProveedorComponent, canActivate: [AuthGuard] },
        { path: 'proveedores/registro', component: CreateProveedorComponent, canActivate: [AuthGuard] },
        { path: 'proveedores/editar/:id', component: EditProveedorComponent, canActivate: [AuthGuard] },
        { path: 'proveedores/:id', component: ShowProveedorComponent, canActivate: [AuthGuard] },
        { path: 'proveedores/productos/:id', component: ProductosProveedorComponent, canActivate: [AuthGuard] },

        { path: 'ordenes-compra', component: IndexOrdenCompraComponent, canActivate: [AuthGuard] },
        { path: 'ordenes-compra/registro', component: CreateOrdenCompraComponent, canActivate: [AuthGuard] },
        { path: 'ordenes-compra/editar/:id', component: EditOrdenCompraComponent, canActivate: [AuthGuard] },
        { path: 'ordenes-compra/:id', component: ShowOrdenCompraComponent, canActivate: [AuthGuard] },
        { path: 'ordenes-compra/recibir/:id', component: RecibirProductosComponent, canActivate: [AuthGuard] },

        { path: 'finanzas', component: IndexFinanzasComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/plan-cuentas', component: PlanCuentasComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/plan-cuentas/crear', component: CrearCuentaComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/plan-cuentas/editar/:id', component: EditarCuentaComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/asientos', component: AsientosContablesComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/asientos/crear', component: CrearAsientoComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/flujo-caja', component: FlujoCajaComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/flujo-caja/registrar', component: RegistrarMovimientoComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/balance-general', component: BalanceGeneralComponent, canActivate: [AuthGuard] },
        { path: 'finanzas/estado-resultados', component: EstadoResultadosComponent, canActivate: [AuthGuard] },

        { path: 'reportes', component: IndexReportesComponent, canActivate: [AuthGuard] },
        { path: 'reportes/ventas-periodo', component: ReporteVentasPeriodoComponent, canActivate: [AuthGuard] },
        { path: 'reportes/ventas-producto', component: ReporteVentasProductoComponent, canActivate: [AuthGuard] },
        { path: 'reportes/ventas-cliente', component: ReporteVentasClienteComponent, canActivate: [AuthGuard] },
        { path: 'reportes/stock-actual', component: ReporteStockActualComponent, canActivate: [AuthGuard] },
        { path: 'reportes/movimientos-inventario', component: ReporteMovimientosInventarioComponent, canActivate: [AuthGuard] },
        { path: 'reportes/estado-pagos', component: ReporteEstadoPagosComponent, canActivate: [AuthGuard] },
        { path: 'reportes/cuentas-pagar', component: ReporteCuentasPagarComponent, canActivate: [AuthGuard] },
        { path: 'reportes/actividad-usuarios', component: ReporteActividadUsuariosComponent, canActivate: [AuthGuard] },

        {path: 'direcciones', component:DireccionClienteComponent, canActivate:[AuthGuard]},
        {path: 'ventas', component:IndexVentasComponent, canActivate:[AuthGuard]},
        {path: 'ventas/:ventaid', component:DetalleVentasComponent, canActivate:[AuthGuard]},
    ]},
    { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
];

export const appRoutingProviders : any[]=[];
export const routing : ModuleWithProviders<any> = RouterModule.forRoot(appRoutes);