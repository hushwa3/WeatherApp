import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocationService } from '../services/location.service';
import { WeatherService } from '../services/weather.service';
import { SettingsService } from '../services/settings.service';
import { Network } from '@capacitor/network';
import { forkJoin, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  currentWeather: any = null;
  forecast: any = null;
  isLoading = false;
  isOnline = true;
  errorMessage = '';

  hourlyForecast: any[] = [];
  dailyForecast: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private locationService: LocationService,
    private weatherService: WeatherService,
    private settingsService: SettingsService
  ) {}

  goToSettings() {
    this.router.navigate(['/settings']);
  }
  
  goToLocation() {
    this.router.navigate(['/location']);
  }

  ngOnInit() {
    this.checkNetworkStatus();
    this.loadWeatherData(); // ✅ Fetch once on page load
  }

  async checkNetworkStatus() {
    const status = await Network.getStatus();
    this.isOnline = status.connected;

    Network.addListener('networkStatusChange', (status) => {
      this.isOnline = status.connected;
    });
  }

  async loadWeatherData() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const position = await this.getUserLocation();
      const { latitude, longitude } = position.coords;
      const units = this.settingsService.getTemperatureUnit();

      if (this.isOnline) {
        forkJoin({
          current: this.weatherService.getCurrentWeather(latitude, longitude, units).pipe(
            catchError(() => this.weatherService.getCachedWeatherData('currentWeather'))
          ),
          forecast: this.weatherService.getForecast(latitude, longitude, units).pipe(
            catchError(() => this.weatherService.getCachedWeatherData('forecast'))
          ),
        }).subscribe((data) => this.processWeatherData(data));
      } else {
        this.loadCachedWeather();
      }
    } catch (error) {
      this.errorMessage = 'An error occurred while fetching data. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async getUserLocation() {
    try {
      return await this.locationService.getCurrentPosition();
    } catch (error) {
      const cachedLocation = await this.weatherService.getCachedWeatherData('currentLocation').toPromise();
      if (cachedLocation) {
        return { coords: { latitude: cachedLocation.latitude, longitude: cachedLocation.longitude } };
      }
      this.errorMessage = 'Using default location. Enable location services for accuracy.';
      return { coords: { latitude: 10.287020, longitude: 123.861557 } }; // Default: Basak Pardo
    }
  }

  loadCachedWeather() {
    forkJoin({
      current: this.weatherService.getCachedWeatherData('currentWeather'),
      forecast: this.weatherService.getCachedWeatherData('forecast'),
    }).subscribe((data) => {
      if (!data.current || !data.forecast) {
        this.errorMessage = 'No cached weather data available.';
      } else {
        this.processWeatherData(data);
      }
    });
  }

  processWeatherData(data: { current: any; forecast: any }) {
    if (data.current) this.currentWeather = data.current;
    if (data.forecast) {
      this.forecast = data.forecast;
      this.extractHourlyAndDailyForecast();
    }
  }

  extractHourlyAndDailyForecast() {
    const today = new Date().setHours(0, 0, 0, 0);

    this.hourlyForecast = this.forecast.list
      .filter((item: any) => new Date(item.dt * 1000).setHours(0, 0, 0, 0) === today)
      .slice(0, 24);

    const dailyMap = new Map();
    this.forecast.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).setHours(0, 0, 0, 0);
      if (!dailyMap.has(date) || new Date(item.dt * 1000).getHours() === 12) {
        dailyMap.set(date, item);
      }
    });

    this.dailyForecast = Array.from(dailyMap.values()).slice(0, 5);
  }

  refreshWeather(event: any) {
    this.loadWeatherData();
    if (event?.target) {
      event.target.complete();
    }
  }

  getTemperatureSymbol(): string {
    return this.settingsService.getTemperatureUnit() === 'metric' ? '°C' : '°F';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
