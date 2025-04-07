import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  // Selected location management
  private selectedLocationSubject = new BehaviorSubject<{ latitude: number; longitude: number; city?: string } | null>(null);
  public selectedLocation$ = this.selectedLocationSubject.asObservable();
  private readonly LOCATION_STORAGE_KEY = 'selectedLocation';

  // Current location management
  private currentLocationSubject = new BehaviorSubject<{ latitude: number, longitude: number } | null>(null);
  currentLocation$ = this.currentLocationSubject.asObservable();

  constructor() {
    // Load saved location on service initialization
    this.loadSavedLocation();
  }

  // Save the location to storage and update the subject
  setSelectedLocation(location: { latitude: number; longitude: number; city?: string }) {
    // Store in local storage
    localStorage.setItem(this.LOCATION_STORAGE_KEY, JSON.stringify(location));
    // Update the BehaviorSubject
    this.selectedLocationSubject.next(location);
  }

  // Clear the selected location from storage and the subject
  clearSelectedLocation() {
    localStorage.removeItem(this.LOCATION_STORAGE_KEY);
    this.selectedLocationSubject.next(null);
  }

  // Get the current selected location value synchronously
  getSelectedLocation(): { latitude: number; longitude: number; city?: string } | null {
    return this.selectedLocationSubject.getValue();
  }

  // Load the saved location from storage
  private loadSavedLocation() {
    const savedLocation = localStorage.getItem(this.LOCATION_STORAGE_KEY);
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        this.selectedLocationSubject.next(location);
      } catch (e) {
        console.error('Error parsing saved location', e);
        localStorage.removeItem(this.LOCATION_STORAGE_KEY);
      }
    }
  }

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