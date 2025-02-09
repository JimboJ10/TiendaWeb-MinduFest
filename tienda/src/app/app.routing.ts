import { Routes, RouterModule } from "@angular/router";
import { ModuleWithProviders } from "@angular/core";
import { InicioComponent } from "./components/inicio/inicio.component";
import { LoginComponent } from "./components/login/login.component";
import { AuthGuard } from "./guards/auth.guard";
import { LoginGuard } from "./guards/login.guard";
import { PerfilComponent } from "./components/usuario/perfil/perfil.component";
import { IndexProductoComponent } from "./components/productos/index-producto/index-producto.component";
import { ShowProductoComponent } from "./components/productos/show-producto/show-producto.component";
import { CarritoComponent } from "./components/carrito/carrito.component";
import { DireccionesComponent } from "./components/usuario/direcciones/direcciones.component";
import { RegisterComponent } from "./components/register/register.component";
import { IndexOrdenesComponent } from "./components/usuario/ordenes/index-ordenes/index-ordenes.component";
import { DetalleOrdenComponent } from "./components/usuario/ordenes/detalle-orden/detalle-orden.component";
import { DesarrolladoresComponent } from "./components/desarrolladores/desarrolladores.component";
import { IndexReviewComponent } from "./components/usuario/review/index-review/index-review.component";
import { DobleFactorComponent } from "./components/usuario/doble-factor/doble-factor.component";
import { VerificarDobleFactorComponent } from './components/verificar-doble-factor/verificar-doble-factor.component';
import { CambiarPasswordComponent } from "./components/usuario/cambiar-password/cambiar-password.component";
import { SolicitarCambioPasswordComponent } from "./components/usuario/solicitar-cambio-password/solicitar-cambio-password.component";
import { RestablecerPasswordComponent } from "./components/usuario/restablecer-password/restablecer-password.component";

const appRoute : Routes = [
    {path:'', redirectTo: 'inicio', pathMatch:'full'},
    {path: 'inicio', component:InicioComponent, },
    {path: 'desarrolladores', component:DesarrolladoresComponent, },
    {path: 'login', component:LoginComponent, canActivate: [LoginGuard]},
    {path: 'solicitar-cambio', component: SolicitarCambioPasswordComponent},
    {path: 'restablecer-password', component: RestablecerPasswordComponent},
    {path: 'verify-2fa', component:VerificarDobleFactorComponent, pathMatch: 'full'},
    {path: 'cuenta/perfil', component:PerfilComponent, canActivate: [AuthGuard]},
    {path: 'cuenta/cambiar-password', component: CambiarPasswordComponent, canActivate: [AuthGuard]},
    {path: 'cuenta/direcciones', component:DireccionesComponent, canActivate: [AuthGuard]},
    {path: 'cuenta/ordenes', component:IndexOrdenesComponent, canActivate: [AuthGuard]},
    {path: 'cuenta/ordenes/:ventaid', component:DetalleOrdenComponent, canActivate: [AuthGuard]},
    {path: 'cuenta/reviews', component:IndexReviewComponent, canActivate: [AuthGuard]},
    {path: 'cuenta/seguridad', component:DobleFactorComponent, canActivate: [AuthGuard]},
    {path: 'carrito', component:CarritoComponent, canActivate: [AuthGuard]},

    {path: 'registro', component: RegisterComponent, canActivate: [LoginGuard] },
    {path: 'productos', component:IndexProductoComponent },
    {path: 'productos/categoria/:categoria', component:IndexProductoComponent },
    {path: 'productos/:titulo', component:ShowProductoComponent },
    
];

export const appRoutingProviders : any[]=[];
export const routing : ModuleWithProviders<any> = RouterModule.forRoot(appRoute);