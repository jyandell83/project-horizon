import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private http = inject(HttpClient);

  backendMessage = '';

  testBackend() {
    this.http
      .get<{ message: string }>('http://localhost:3000/api/hello')
      .subscribe((response) => {
        this.backendMessage = response.message;
      });
  }
}
