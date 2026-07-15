import { Component } from '@angular/core';

@Component({
  selector: 'app-active-session',
  standalone: true,
  imports: [],
  templateUrl: './active-session.component.html',
  styleUrl: './active-session.component.scss',
})
export class ActiveSessionComponent {
  sessionStarted = false;
  activePhase: string | null = null;

  startSession(): void {
    this.sessionStarted = true;
  }

  startPhase(phase: string): void {
    this.activePhase = phase;
  }

  endPhase(): void {
    this.activePhase = null;
  }

  endSession(): void {
    this.sessionStarted = false;
    this.activePhase = null;
  }
}
