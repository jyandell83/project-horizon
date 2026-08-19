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
  selectedProjectId = null;
  location = '';

  @Input() session: ClimbingSession | null = null;

  @Output() sessionStart = new EventEmitter<string>();
  @Output() phaseStart = new EventEmitter<SessionPhaseType>();
  @Output() phaseEnd = new EventEmitter<void>();
  @Output() sessionEnd = new EventEmitter<void>();
  @Output() projectAdded = new EventEmitter<number>();
  @Output() projectAttemptsChanged = new EventEmitter<{
    projectId: number;
    change: number;
  }>();

  startSession(): void {
    const location = this.location.trim();

    if (!location) {
      return;
    }
    this.sessionStart.emit(location);

    this.location = '';
  }

  startPhase(phase: SessionPhaseType): void {
    this.phaseStart.emit(phase);
  }

  getProjectName(projectId: number): string {
    return (
      this.projectsService.getProjectById(projectId)?.name ?? 'Unknown Project'
    );
  }

  get availableProjects() {
    const activePhase = this.session?.phases.find((phase) => !phase.endedAt);

    const activeProjectIds =
      activePhase?.projectWork.map((work) => work.projectId) ?? [];

    return this.projects().filter(
      (project) => !activeProjectIds.includes(project.id),
    );
  }

  addProject(): void {
    if (!this.selectedProjectId) {
      return;
    }

    this.projectAdded.emit(this.selectedProjectId);

    this.selectedProjectId = null;
  }

  updateProjectAttempts(projectId: number, change: number): void {
    this.projectAttemptsChanged.emit({
      projectId,
      change,
    });
  }

  endPhase(): void {
    this.phaseEnd.emit();
  }

  endSession(): void {
    this.sessionEnd.emit();
  }
}
