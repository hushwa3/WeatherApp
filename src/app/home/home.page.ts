import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocationService } from '../services/location.service';
import { WeatherService } from '../services/weather.service';
import { SettingsService } from '../services/settings.service';
import { Network } from '@capacitor/network';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { catchError, takeUntil, filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  currentWeather: any = null;
  currentWeatherTimeHour: number = 0;
  forecast: any = null;
  isLoading = false;
  isOnline = true;
  errorMessage = '';

  //1st
  private  locationSubscription: Subscription | null = null;

  hourlyForecast: any[] = [];
  dailyForecast: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private locationService: LocationService,
    private weatherService: WeatherService,
    private settingsService: SettingsService,
  ) {}

  goToSettings() {
    this.router.navigate(['/settings']);
  }
  
  goToLocation() {
    this.router.navigate(['/location']);
  }

  ngOnInit() {
    this.checkNetworkStatus();
  
    // First check if there's a selected location
    const selectedLocation = this.locationService.getSelectedLocation();
    if (selectedLocation) {
      // Use the selected location immediately
      this.fetchWeatherData(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.city);
    } else {
      // Only if no selected location, load from GPS
      this.loadWeatherData();
    }
  
    // Subscribe to location changes for future updates
    this.locationSubscription = this.locationService.selectedLocation$.subscribe((location) => {
      if (location) {
        this.fetchWeatherData(location.latitude, location.longitude, location.city);
      }
    });
  
    // Subscribe to router events to refresh data when returning to the page
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/home') {
          // Check for selected location again when returning to home
          const currentLocation = this.locationService.getSelectedLocation();
          if (currentLocation) {
            this.fetchWeatherData(currentLocation.latitude, currentLocation.longitude, currentLocation.city);
          } else {
            this.loadWeatherData();
          }
        }
      });
  }

  // 3rd
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }
//

//
async fetchWeatherData(latitude: number, longitude: number, cityName?: string) {
  this.isLoading = true;
  this.errorMessage = '';
  const units = this.settingsService.getTemperatureUnit();

  try {
    this.weatherService.cacheData('currentLocation', { latitude, longitude, city: cityName });
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
//

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

    // Hourly Forecast: Only today, with hour added
    this.hourlyForecast = this.forecast.list
      .filter((item: any) => new Date(item.dt * 1000).setHours(0, 0, 0, 0) === today)
      .slice(0, 24) //add floor to make it actually 24H
      .map((item: any) => ({
        ...item,
        hour: new Date(item.dt * 1000).getHours() // Add hour property
      }));
  
    // Daily Forecast: One item per day, preferring data at 12:00 PM
    const dailyMap = new Map();
    this.forecast.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).setHours(0, 0, 0, 0);
      const hour = new Date(item.dt * 1000).getHours();
      if (!dailyMap.has(date) || hour === 12) {
        dailyMap.set(date, {
          ...item,
          hour // Add hour property here too
        });
      }
    });
  
    this.dailyForecast = Array.from(dailyMap.values()).slice(0, 5)
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

  /** 
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  } */

  getWeatherIcon(condition: string, hour: number): string {
    let iconCode = '01';
    const isDayTime = hour >= 6 && hour < 18;
  
    switch (condition.toLowerCase()) {
      case 'clear':
        iconCode = isDayTime ? '01d' : '01n';
        break;
      case 'few clouds':
        iconCode = isDayTime ? '02d' : '02n';
        break;
      case 'scattered clouds':
        iconCode = isDayTime ? '03d' : '03n';
        break;
      case 'broken clouds':
      case 'overcast clouds':
        iconCode = isDayTime ? '04d' : '04n';
        break;
      case 'shower rain':
      case 'light rain':
        iconCode = isDayTime ? '09d' : '09n';
        break;
      case 'rain':
        iconCode = isDayTime ? '10d' : '10n';
        break;
      case 'thunderstorm':
        iconCode = isDayTime ? '11d' : '11n';
        break;
      case 'snow':
        iconCode = isDayTime ? '13d' : '13n';
        break;
      case 'mist':
      case 'fog':
        iconCode = isDayTime ? '50d' : '50n';
        break;
      default:
        iconCode = isDayTime ? '01d' : '01n';
    }
  
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

}
