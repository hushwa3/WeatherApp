import { Component, OnInit } from '@angular/core';
import { SettingsService, AppSettings } from '../services/settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  settings: AppSettings;
  isDarkMode: boolean = false;

  constructor(private settingsService: SettingsService) {
    this.settings = {
      temperatureUnit: 'celsius',
      theme: 'light'
    };
  }

  ngOnInit() {
    this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
      this.isDarkMode = settings.theme === 'dark';
      document.body.classList.toggle('dark', this.isDarkMode); 
    });
  }

  updateTemperatureUnit(event: any) {
    this.settingsService.updateSettings({
      temperatureUnit: event.detail.value
    });
  }

  toggleTheme() {
    const theme = this.isDarkMode ? 'dark' : 'light';
    this.settingsService.updateSettings({ theme });
  }
}
