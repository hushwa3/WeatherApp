import { Component, OnInit } from '@angular/core';
import { LocationService } from '../services/location.service';
import { WeatherService } from '../services/weather.service';
import { NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
})
export class LocationPage implements OnInit {
  searchQuery: string = '';
  searchResults: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  constructor(
    private locationService: LocationService,
    private weatherService: WeatherService,
    private navCtrl: NavController,
    private http: HttpClient
  ) {}

  ngOnInit() {}

  async useCurrentLocation() {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      await this.locationService.getCurrentPosition();
      this.navCtrl.navigateBack('/home');
    } catch (error) {
      this.errorMessage = 'Unable to get current location. Please check your device settings.';
    } finally {
      this.isLoading = false;
    }
  }

  searchLocation() {
    if (!this.searchQuery.trim()) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    // Using OpenWeatherMap Geocoding API
    const apiKey = API_KEY HERE';
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(this.searchQuery)}&limit=5&appid=${apiKey}`;
    
    this.http.get<any[]>(url).subscribe(
      (results) => {
        this.searchResults = results;
        this.isLoading = false;
        
        if (results.length === 0) {
          this.errorMessage = 'No locations found. Try a different search term.';
        }
      },
      (error) => {
        this.errorMessage = 'Error searching for location. Please try again.';
        this.isLoading = false;
      }
    );
  }

  /**selectLocation(location: any) {
   // this.locationService.setManualLocation(location.lat, location.lon);
    //this.navCtrl.navigateBack('/home');
  } **/

 /** selectLocation(location: any) {
  const selectedLat = location.lat;
  const selectedLng = location.lon;
  const selectedCity = location.name || location.city || location.label || 'Selected Location';

  this.locationService.setSelectedLocation({
    latitude: selectedLat,
    longitude: selectedLng,
    city: selectedCity
  });

  this.navCtrl.navigateBack('/home');
 } **/

  selectLocation(location: any) {
    // Create a properly formatted location name that includes all available details
    let locationName = location.name;
    
    // Add state/province if available and different from city name
    if (location.state && location.state !== location.name) {
      locationName += `, ${location.state}`;
    }
    
    // Add country if available
    if (location.country) {
      locationName += `, ${location.country}`;
    }
    
    const selectedLocation = {
      latitude: location.lat,
      longitude: location.lon,
      city: locationName // Use the formatted location name
    };
    
    // Set the selected location in the service
    this.locationService.setSelectedLocation(selectedLocation);
    
    // Navigate back to the home page
    this.navCtrl.navigateBack('/home');
  }
 
}