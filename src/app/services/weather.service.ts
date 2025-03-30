import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences'
import { Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = '1dbc9831dae05630db1a55585ba4d359';
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) {}

  getCurrentWeather(lat: number, lon: number, units: string = 'metric'): Observable<any> {
    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${this.apiKey}`;
    
    return this.http.get(url).pipe(
      tap(data => this.cacheWeatherData('currentWeather', data))
    );
  }

  getForecast(lat: number, lon: number, units: string = 'metric'): Observable<any> {
    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${this.apiKey}`;
    
    return this.http.get(url).pipe(
      tap(data => this.cacheWeatherData('forecast', data))
    );
  }

  // Cache weather data for offline use
  private async cacheWeatherData(key: string, data: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(data)
    });
  }

  // Get cached weather data
  getCachedWeatherData(key: string): Observable<any> {
    return from(Preferences.get({ key })).pipe(
      map(result => {
        if (result.value) {
          return JSON.parse(result.value);
        }
        return null;
      })
    );
  }
}