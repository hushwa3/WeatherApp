import { Component } from '@angular/core';
import { Platform, AlertController, IonicModule } from '@ionic/angular';
import { App as CapacitorApp } from '@capacitor/app';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true, // If this is present
  imports: [IonicModule, RouterModule] // Add this if standalone: true
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private alertController: AlertController,
    private router: Router
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.handleBackButton();
    });
  }

  handleBackButton() {
    CapacitorApp.addListener('backButton', async () => {
      // Only trigger alert if the current page is the root (e.g., home or tabs root)
      const canExit = this.router.url === '/home' || this.router.url === '/';

      if (canExit) {
        const alert = await this.alertController.create({
          header: 'Exit App',
          message: 'Do you want to exit the app?',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Exit',
              handler: () => {
                CapacitorApp.exitApp();
              },
            },
          ],
        });

        await alert.present();
      }
    });
  }
}

