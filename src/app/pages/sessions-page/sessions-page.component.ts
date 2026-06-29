import { Component } from '@angular/core';

import { SessionListComponent } from '../../components/session-list/session-list.component';

@Component({
  selector: 'app-sessions-page',
  standalone: true,
  imports: [SessionListComponent],
  templateUrl: './sessions-page.component.html',
  styleUrl: './sessions-page.component.scss',
})
export class SessionsPageComponent {}
