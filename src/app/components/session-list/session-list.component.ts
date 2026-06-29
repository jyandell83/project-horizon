import { Component } from '@angular/core';
import { SESSIONS } from '../../data/dummy-sessions';
import { ClimbingSession } from '../../models/session';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent {
  sessions: ClimbingSession[] = SESSIONS;
}
