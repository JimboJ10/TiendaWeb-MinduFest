import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxTinymceModule } from 'ngx-tinymce';
import { NgxPaginationModule } from 'ngx-pagination';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { routing, appRoutingProviders } from './app.routing';
import { InicioComponent } from './components/inicio/inicio.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { IndexClienteComponent } from './components/clientes/index-cliente/index-cliente.component';
import { CreateClienteComponent } from './components/clientes/create-cliente/create-cliente.component';
import { EditClienteComponent } from './components/clientes/edit-cliente/edit-cliente.component';
import { CreateProductoComponent } from './components/productos/create-producto/create-producto.component';
import { IndexProductoComponent } from './components/productos/index-producto/index-producto.component';
import { UpdateProductoComponent } from './components/productos/update-producto/update-producto.component';
import { InventarioProductoComponent } from './components/productos/inventario-producto/inventario-producto.component';
import { DireccionClienteComponent } from './components/clientes/direccion-cliente/direccion-cliente.component';
import { AuthInterceptor } from './auth.interceptor';
import { IndexVentasComponent } from './components/ventas/index-ventas/index-ventas.component';
import { DetalleVentasComponent } from './components/ventas/detalle-ventas/detalle-ventas.component';
import { ReviewsProductoComponent } from './components/productos/reviews-producto/reviews-producto.component';
import { IndexProveedorComponent } from './components/proveedores/index-proveedor/index-proveedor.component';
import { CreateProveedorComponent } from './components/proveedores/create-proveedor/create-proveedor.component';
import { EditProveedorComponent } from './components/proveedores/edit-proveedor/edit-proveedor.component';
import { ShowProveedorComponent } from './components/proveedores/show-proveedor/show-proveedor.component';
import { ProductosProveedorComponent } from './components/proveedores/productos-proveedor/productos-proveedor.component';
import { IndexOrdenCompraComponent } from './components/ordenes-compra/index-orden-compra/index-orden-compra.component';
import { CreateOrdenCompraComponent } from './components/ordenes-compra/create-orden-compra/create-orden-compra.component';
import { EditOrdenCompraComponent } from './components/ordenes-compra/edit-orden-compra/edit-orden-compra.component';
import { ShowOrdenCompraComponent } from './components/ordenes-compra/show-orden-compra/show-orden-compra.component';
import { RecibirProductosComponent } from './components/ordenes-compra/recibir-productos/recibir-productos.component';
import { IndexFinanzasComponent } from './components/finanzas/index-finanzas/index-finanzas.component';
import { PlanCuentasComponent } from './components/finanzas/plan-cuentas/plan-cuentas.component';
import { CrearCuentaComponent } from './components/finanzas/crear-cuenta/crear-cuenta.component';
import { AsientosContablesComponent } from './components/finanzas/asientos-contables/asientos-contables.component';
import { CrearAsientoComponent } from './components/finanzas/crear-asiento/crear-asiento.component';
import { FlujoCajaComponent } from './components/finanzas/flujo-caja/flujo-caja.component';
import { RegistrarMovimientoComponent } from './components/finanzas/registrar-movimiento/registrar-movimiento.component';
import { BalanceGeneralComponent } from './components/finanzas/balance-general/balance-general.component';
import { EstadoResultadosComponent } from './components/finanzas/estado-resultados/estado-resultados.component';
import { EditarCuentaComponent } from './components/finanzas/editar-cuenta/editar-cuenta.component';
import { IndexReportesComponent } from './components/reportes/index-reportes/index-reportes.component';
import { ReporteVentasPeriodoComponent } from './components/reportes/reporte-ventas-periodo/reporte-ventas-periodo.component';
import { ReporteStockActualComponent } from './components/reportes/reporte-stock-actual/reporte-stock-actual.component';
import { ReporteVentasProductoComponent } from './components/reportes/reporte-ventas-producto/reporte-ventas-producto.component';
import { ReporteVentasClienteComponent } from './components/reportes/reporte-ventas-cliente/reporte-ventas-cliente.component';
import { ReporteMovimientosInventarioComponent } from './components/reportes/reporte-movimientos-inventario/reporte-movimientos-inventario.component';
import { ReporteCuentasCobrarComponent } from './components/reportes/reporte-cuentas-cobrar/reporte-cuentas-cobrar.component';
import { ReporteCuentasPagarComponent } from './components/reportes/reporte-cuentas-pagar/reporte-cuentas-pagar.component';
import { ReporteActividadUsuariosComponent } from './components/reportes/reporte-actividad-usuarios/reporte-actividad-usuarios.component';


@NgModule({
  declarations: [
    AppComponent,
    InicioComponent,
    SidebarComponent,
    LoginComponent,
    IndexClienteComponent,
    CreateClienteComponent,
    EditClienteComponent,
    CreateProductoComponent,
    IndexProductoComponent,
    UpdateProductoComponent,
    InventarioProductoComponent,
    DireccionClienteComponent,
    IndexVentasComponent,
    DetalleVentasComponent,
    ReviewsProductoComponent,
    IndexProveedorComponent,
    CreateProveedorComponent,
    EditProveedorComponent,
    ShowProveedorComponent,
    ProductosProveedorComponent,
    IndexOrdenCompraComponent,
    CreateOrdenCompraComponent,
    EditOrdenCompraComponent,
    ShowOrdenCompraComponent,
    RecibirProductosComponent,
    IndexFinanzasComponent,
    PlanCuentasComponent,
    CrearCuentaComponent,
    AsientosContablesComponent,
    CrearAsientoComponent,
    FlujoCajaComponent,
    RegistrarMovimientoComponent,
    BalanceGeneralComponent,
    EstadoResultadosComponent,
    EditarCuentaComponent,
    IndexReportesComponent,
    ReporteVentasPeriodoComponent,
    ReporteStockActualComponent,
    ReporteVentasProductoComponent,
    ReporteVentasClienteComponent,
    ReporteMovimientosInventarioComponent,
    ReporteCuentasCobrarComponent,
    ReporteCuentasPagarComponent,
    ReporteActividadUsuariosComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    routing,
    NgbPaginationModule,
    NgxTinymceModule.forRoot({
      baseURL: '../../../assets/tinymce/'
    }),
    NgxPaginationModule
  ],
  providers: [appRoutingProviders, AuthGuard, {provide: HTTP_INTERCEPTORS, useClass:AuthInterceptor, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule { }
