import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SESSIONS } from '../../data/dummy-sessions';
import { ClimbingSession } from '../../models/session';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent {
  sessions: ClimbingSession[] = SESSIONS;
}
