import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClimbingSession, SessionPhaseType } from '../../models/session';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-active-session',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './active-session.component.html',
  styleUrl: './active-session.component.scss',
})
export class ActiveSessionComponent {
  @Input() session: ClimbingSession | null = null;

  @Output() sessionStart = new EventEmitter<void>();
  @Output() phaseStart = new EventEmitter<SessionPhaseType>();
  @Output() phaseEnd = new EventEmitter<void>();
  @Output() sessionEnd = new EventEmitter<void>();

  startSession(): void {
    this.sessionStart.emit();
  }

  startPhase(phase: SessionPhaseType): void {
    this.phaseStart.emit(phase);
  }

  endPhase(): void {
    this.phaseEnd.emit();
  }

  endSession(): void {
    this.sessionEnd.emit();
  }
}
