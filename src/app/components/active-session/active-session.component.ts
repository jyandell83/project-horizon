import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ClimbingSession, SessionPhaseType } from '../../models/session';
import { DatePipe } from '@angular/common';
import { ProjectsService } from '../../services/projects.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-active-session',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './active-session.component.html',
  styleUrl: './active-session.component.scss',
})
export class ActiveSessionComponent {
  private projectsService = inject(ProjectsService);
  projects = this.projectsService.projects;
  selectedProjectId = '';

  @Input() session: ClimbingSession | null = null;

  @Output() sessionStart = new EventEmitter<void>();
  @Output() phaseStart = new EventEmitter<SessionPhaseType>();
  @Output() phaseEnd = new EventEmitter<void>();
  @Output() sessionEnd = new EventEmitter<void>();
  @Output() projectAdded = new EventEmitter<string>();

  startSession(): void {
    this.sessionStart.emit();
  }

  startPhase(phase: SessionPhaseType): void {
    this.phaseStart.emit(phase);
  }

  addProject(): void {
    if (!this.selectedProjectId) {
      return;
    }

    this.projectAdded.emit(this.selectedProjectId);

    this.selectedProjectId = '';
  }

  endPhase(): void {
    this.phaseEnd.emit();
  }

  endSession(): void {
    this.sessionEnd.emit();
  }
}
