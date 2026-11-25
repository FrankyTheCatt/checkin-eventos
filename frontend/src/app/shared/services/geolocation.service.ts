import { Injectable, signal } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface DistanceValidation {
  distanceMeters: number;
  withinRadius: boolean;
  formattedDistance: string;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  readonly currentCoordinates = signal<GeoCoordinates | null>(null);
  readonly isLocating = signal<boolean>(false);
  readonly lastError = signal<string | null>(null);

  /**
   * Obtiene la posición actual del dispositivo usando Capacitor Geolocation
   * con fallback a la API HTML5 estándar en el navegador.
   */
  async getCurrentPosition(): Promise<GeoCoordinates> {
    this.isLocating.set(true);
    this.lastError.set(null);

    try {
      // 1. Intentar con plugin nativo de Capacitor
      try {
        const hasPermission = await this.ensurePermissions();
        if (hasPermission) {
          const position: Position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });

          const coords: GeoCoordinates = {
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: position.coords.accuracy,
          };
          this.currentCoordinates.set(coords);
          return coords;
        }
      } catch (nativeErr) {
        // Fallback si no está en dispositivo nativo o falla el plugin
        console.warn('Capacitor Geolocation falló, intentando Web API...', nativeErr);
      }

      // 2. Fallback a navigator.geolocation estándar
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        const coords = await new Promise<GeoCoordinates>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: Number(pos.coords.latitude.toFixed(6)),
                longitude: Number(pos.coords.longitude.toFixed(6)),
                accuracy: pos.coords.accuracy,
              });
            },
            (err) => reject(new Error(this.mapGeolocationError(err))),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
          );
        });

        this.currentCoordinates.set(coords);
        return coords;
      }

      throw new Error('Geolocalización no soportada en este entorno');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo obtener la ubicación GPS';
      this.lastError.set(msg);
      throw new Error(msg);
    } finally {
      this.isLocating.set(false);
    }
  }

  /**
   * Solicita permisos de ubicación nativos de Capacitor.
   */
  async ensurePermissions(): Promise<boolean> {
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted') {
        return true;
      }
      const request = await Geolocation.requestPermissions({ permissions: ['location'] });
      return request.location === 'granted';
    } catch {
      return true; // En web puede no estar implementado checkPermissions
    }
  }

  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
   * Retorna la distancia en metros.
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Valida si un usuario está dentro del radio permitido de un evento.
   */
  validateDistanceToEvent(
    userLat: number,
    userLon: number,
    eventLat: number | null,
    eventLon: number | null,
    radiusMeters: number,
  ): DistanceValidation | null {
    if (eventLat === null || eventLon === null) {
      return null;
    }

    const distanceMeters = this.calculateDistance(userLat, userLon, eventLat, eventLon);
    const withinRadius = distanceMeters <= radiusMeters;
    return {
      distanceMeters,
      withinRadius,
      formattedDistance: this.formatDistance(distanceMeters),
    };
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private mapGeolocationError(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permiso de ubicación denegado por el usuario.';
      case error.POSITION_UNAVAILABLE:
        return 'La señal de ubicación GPS no está disponible.';
      case error.TIMEOUT:
        return 'Se agotó el tiempo de espera para obtener la ubicación.';
      default:
        return 'Ocurrió un error al obtener la ubicación GPS.';
    }
  }
}
