import { Component } from '@angular/core';
import { ActiveSessionComponent } from '../../components/active-session/active-session.component';

@Component({
  selector: 'app-sessions-active-page',
  standalone: true,
  imports: [ActiveSessionComponent],
  templateUrl: './sessions-active-page.component.html',
  styleUrl: './sessions-active-page.component.scss',
})
export class SessionsActivePageComponent {}
