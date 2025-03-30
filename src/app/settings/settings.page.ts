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

  constructor(private settingsService: SettingsService) {
    this.settings = {
      temperatureUnit: 'celsius',
      theme: 'light'
    };
  }

  ngOnInit() {
    this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
    });
  }

  updateTemperatureUnit(event: any) {
    this.settingsService.updateSettings({
      temperatureUnit: event.detail.value
    });
  }

  updateTheme(event: any) {
    this.settingsService.updateSettings({
      theme: event.detail.value
    });
  }
}