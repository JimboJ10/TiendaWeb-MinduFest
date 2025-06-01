import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { ModalModule } from 'ngx-bootstrap/modal';
import { RatingModule } from 'ngx-bootstrap/rating';
// import { GoogleMapsModule } from '@angular/google-maps';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { appRoutingProviders, routing } from './app.routing';
import { NavComponent } from './components/nav/nav.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from '../../../tienda/src/app/guards/auth.guard';
import { PerfilComponent } from './components/usuario/perfil/perfil.component';
import { SiderbarComponent } from './components/usuario/siderbar/siderbar.component';
import { IndexProductoComponent } from './components/productos/index-producto/index-producto.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ShowProductoComponent } from './components/productos/show-producto/show-producto.component';
import { CarritoComponent } from './components/carrito/carrito.component';
import { DireccionesComponent } from './components/usuario/direcciones/direcciones.component';
import { RouterModule } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { AuthInterceptor } from './auth.interceptor';
import { IndexOrdenesComponent } from './components/usuario/ordenes/index-ordenes/index-ordenes.component';
import { DetalleOrdenComponent } from './components/usuario/ordenes/detalle-orden/detalle-orden.component';
import { DesarrolladoresComponent } from './components/desarrolladores/desarrolladores.component';
import { IndexReviewComponent } from './components/usuario/review/index-review/index-review.component';
import { ProductRatingComponent } from './components/shared/product-rating/product-rating.component';
import { DobleFactorComponent } from './components/usuario/doble-factor/doble-factor.component';
import { VerificarDobleFactorComponent } from './components/verificar-doble-factor/verificar-doble-factor.component';
import { CambiarPasswordComponent } from './components/usuario/cambiar-password/cambiar-password.component';
import { SolicitarCambioPasswordComponent } from './components/usuario/solicitar-cambio-password/solicitar-cambio-password.component';
import { RestablecerPasswordComponent } from './components/usuario/restablecer-password/restablecer-password.component';


@NgModule({
  declarations: [
    AppComponent,
    InicioComponent,
    NavComponent,
    FooterComponent,
    LoginComponent,
    PerfilComponent,
    SiderbarComponent,
    IndexProductoComponent,
    ShowProductoComponent,
    CarritoComponent,
    DireccionesComponent,
    RegisterComponent,
    IndexOrdenesComponent,
    DetalleOrdenComponent,
    DesarrolladoresComponent,
    IndexReviewComponent,
    ProductRatingComponent,
    DobleFactorComponent,
    VerificarDobleFactorComponent,
    CambiarPasswordComponent,
    SolicitarCambioPasswordComponent,
    RestablecerPasswordComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    routing,
    FormsModule,
    NgbPaginationModule,
    // GoogleMapsModule,
    ModalModule.forRoot(),
    RatingModule.forRoot(),
  ],
  providers: [appRoutingProviders, AuthGuard, {provide: HTTP_INTERCEPTORS, useClass:AuthInterceptor, multi: true},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
