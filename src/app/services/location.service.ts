import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private currentLocationSubject = new BehaviorSubject<{ latitude: number, longitude: number } | null>(null);
  currentLocation$ = this.currentLocationSubject.asObservable();

  constructor() {}

  /**
   * Requests the user's current position with high accuracy.
   */
  async getCurrentPosition() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true, // Improve accuracy but may take longer
        timeout: 10000, // Fail if no location within 10s
        maximumAge: 0 // Always fetch fresh location
      });

      console.log('Location obtained:', position);
      
      this.currentLocationSubject.next({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });

      return position;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  /**
   * Sets a manual location (fallback when GPS is unavailable).
   */
  setManualLocation(latitude: number, longitude: number) {
    this.currentLocationSubject.next({ latitude, longitude });
  }

  /**
   * Watches the user's location for real-time updates.
   */
  async watchPosition() {
    try {
      await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, err) => {
          if (err) {
            console.error('Error watching position:', err);
            return;
          }

          if (position) {
            this.currentLocationSubject.next({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting location watch:', error);
    }
  }
}
