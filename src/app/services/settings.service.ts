import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences'
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  theme: 'light' | 'dark';
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private defaultSettings: AppSettings = {
    temperatureUnit: 'celsius',
    theme: 'light'
  };

  private settingsSubject = new BehaviorSubject<AppSettings>(this.defaultSettings);
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  async loadSettings() {
    const { value } = await Preferences.get({ key: 'app-settings' });
    if (value) {
      this.settingsSubject.next(JSON.parse(value));
    }
  }

  async updateSettings(settings: Partial<AppSettings>) {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    
    await Preferences.set({
      key: 'app-settings',
      value: JSON.stringify(newSettings)
    });
    
    this.settingsSubject.next(newSettings);
    
    // Apply theme
    if (settings.theme) {
      document.body.classList.toggle('dark', settings.theme === 'dark');
    }
  }

  getTemperatureUnit(): string {
    return this.settingsSubject.value.temperatureUnit === 'celsius' ? 'metric' : 'imperial';
  }
}