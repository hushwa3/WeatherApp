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
    const apiKey = '1dbc9831dae05630db1a55585ba4d359';
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${this.searchQuery}&limit=5&appid=${apiKey}`;
    
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

  selectLocation(location: any) {
    this.locationService.setManualLocation(location.lat, location.lon);
    this.navCtrl.navigateBack('/home');
  }
}
