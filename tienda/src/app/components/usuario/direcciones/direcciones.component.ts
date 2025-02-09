import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { io } from 'socket.io-client';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';

declare var iziToast :any;

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap; // define el componente mapa
  @ViewChild(MapInfoWindow, { static: false }) info!: MapInfoWindow;// define el componente infoWindow
  zoom = 15; // define el nivel de zoom del mapa
  center: google.maps.LatLngLiteral = {
    lat: -2.1962, // Coordenadas iniciales (Ecuador)
    lng: -79.8862 // Coordenadas iniciales (Ecuador)
  };
  markerPosition: google.maps.LatLngLiteral = this.center; // define la posición del marcador
  markerOptions: google.maps.MarkerOptions = { // define las opciones del marcador
    draggable: true // define si el marcador es arrastrable
  };
  codigoPostalReadonly: boolean = true; // define si el campo de código postal es de solo lectura
  usuarioid: any;
  direcciones: Array<any> = []; 

  direccion: any = {
    usuarioid: '',  
    pais: '',
    provincia: '',
    ciudad: '',
    principal: false,
    destinatario: '',
    codigopostal: '',
    telefono: '',
    direcciontexto: ''
  };
  socket = io('http://localhost:3000');
  page = 1;
  pageSize = 3;
  noDirecciones = false;
  load_data = true;
  private searchBox!: google.maps.places.SearchBox;

  constructor(private clienteService: ClienteService,
    private ngZone: NgZone
  ) { }

  async ngAfterViewInit() {
    try {
      // Esperar a que la API de Google Maps se cargue
      await this.loadGoogleMapsPlaces();
      
      // Inicializar SearchBox
      const input = this.searchInput.nativeElement;
      this.searchBox = new google.maps.places.SearchBox(input);

      // Escuchar eventos de selección
      this.searchBox.addListener('places_changed', () => {
        const places = this.searchBox.getPlaces();
        if (!places || places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Actualizar mapa y marcador
        this.ngZone.run(() => {
          this.center = {
            lat: place.geometry?.location?.lat() ?? this.center.lat,
            lng: place.geometry?.location?.lng() ?? this.center.lng
          };
          this.markerPosition = this.center;
          this.zoom = 15;

          // Obtener detalles de la dirección
          this.obtenerDireccionPorCoordenadas(this.center);
        });
      });

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  }

  private async loadGoogleMapsPlaces(): Promise<void> {
    try {
      // @ts-ignore
      const { places } = await google.maps.importLibrary("places");
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  ngOnInit(): void {
    const usuarioid = localStorage.getItem('usuarioid');
    if (usuarioid) {
      this.direccion.usuarioid = usuarioid; 
      this.obtenerDireccionesCliente(usuarioid);
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'No se ha podido identificar al usuario.',
      });
    }
    this.getCurrentLocation();
  }

  // Método para obtener la ubicación actual del usuario
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.markerPosition = this.center;
        this.obtenerDireccionPorCoordenadas(this.center);
      });
    }
  }

  // Método para obtener la dirección a partir de las coordenadas
  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = event.latLng.toJSON();
      this.obtenerDireccionPorCoordenadas(this.markerPosition);
    }
  }
  
  // Método para obtener la dirección a partir de las coordenadas al finalizar el arrastre del marcador
  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = event.latLng.toJSON();
      this.obtenerDireccionPorCoordenadas(this.markerPosition);
    }
  }
  
  // Método para obtener la dirección a partir de las coordenadas
  obtenerDireccionPorCoordenadas(position: google.maps.LatLngLiteral) {
    // Crea una instancia del geocodificador
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { location: position },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const addressComponents = results[0].address_components;
          
          // Llena el formulario con los datos obtenidos
          this.direccion.direcciontexto = results[0].formatted_address;
          
          // Inicializa los campos en caso de que no estén disponibles
          this.direccion.codigopostal = '';
          this.direccion.pais = '';
          this.direccion.provincia = '';
          this.direccion.ciudad = '';
          
          // Recorre los componentes de la dirección para obtener los datos necesarios
          for (const component of addressComponents) {
            if (component.types.includes('postal_code')) {
              this.direccion.codigopostal = component.long_name;
            }
            if (component.types.includes('country')) {
              this.direccion.pais = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              this.direccion.provincia = component.long_name;
            }
            if (component.types.includes('locality')) {
              this.direccion.ciudad = component.long_name;
            }
          }
  
          // Si el código postal no está disponible, mostrar un mensaje o permitir la entrada manual
          if (!this.direccion.codigopostal) {
            this.codigoPostalReadonly = false; // habilita el campo si no hay código postal
            iziToast.show({
              title: 'Advertencia',
              titleColor: '#FFA500',
              color: '#FFF',
              class: 'text-warning',
              position: 'topRight',
              message: 'El código postal no está disponible para esta ubicación. Por favor, ingrésalo manualmente.',
            });
          } else {
            this.codigoPostalReadonly = true; // Mantiene deshabilitado si hay código postal
          }
        } else {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'No se pudo obtener la dirección para las coordenadas seleccionadas.',
          });
        }
      }
    );
  }

  registrar(registroForm: any) {
    if (registroForm.valid) {
      this.direccion.principal = this.direccion.principal ? 1 : 0;

      console.log('Datos enviados:', this.direccion);
      this.clienteService.registroDireccionCliente(this.direccion).subscribe(
        response => {
          iziToast.show({
            title: 'Success',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Dirección registrada con éxito',
          });
          console.log(response);
          this.direccion = {
            usuarioid: this.direccion.usuarioid,  
            pais: '',
            provincia: '',
            ciudad: '',
            principal: false,
            destinatario: '',
            codigopostal: '',
            telefono: '',
            direcciontexto: ''
          };
          setTimeout(() => {
            this.obtenerDireccionesCliente(this.direccion.usuarioid);
          }, 200);
        },
        error => {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Error al registrar dirección',
          });
          console.log(error);
        }
      );
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Datos del formulario no completados',
      });
    }
  }

  obtenerDireccionesCliente(usuarioid: string): void {
    this.clienteService.obtenerDireccionesCliente(usuarioid).subscribe(
      response => {
        this.direcciones = response;
        this.load_data = false;
        this.noDirecciones = this.direcciones.length === 0;
      },
      error => {
        console.log(error);
        this.load_data = false;
        this.noDirecciones = true;
      }
    );
  }

  establecer_principal(direccionid: string): void {
    this.clienteService.cambiarDireccionPrincipalCliente(this.direccion.usuarioid, direccionid).subscribe(
      response => {
        iziToast.show({
          title: 'Success',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Dirección principal actualizada con éxito',
        });
        this.obtenerDireccionesCliente(this.direccion.usuarioid);
      },
      error => {
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'Error al actualizar dirección principal',
        });
        console.log(error);
      }
    );
  }

}