import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  DestroyRef,
  signal,
} from '@angular/core';
import { ClimbingSession, SessionPhaseType } from '../../models/session';
import { DatePipe } from '@angular/common';
import { ProjectsService } from '../../services/projects.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-active-session',
  standalone: true,
  imports: [DatePipe, FormsModule, FontAwesomeModule],
  templateUrl: './active-session.component.html',
  styleUrl: './active-session.component.scss',
})
export class ActiveSessionComponent {
  private projectsService = inject(ProjectsService);
  projects = this.projectsService.projects;
  selectedProjectId = null;
  location = '';
  faCheck = faCheck;
  faPlay = faPlay;
  faStop = faStop;

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
  @Output() projectSent = new EventEmitter<number>();

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

  markProjectSent(projectId: number) {
    this.projectSent.emit(projectId);
  }

  endPhase(): void {
    this.phaseEnd.emit();
  }

  endSession(): void {
    this.sessionEnd.emit();
  }

  readonly phaseOptions = [
    { type: 'warm-up', label: 'Warm-up' },
    { type: 'climbing', label: 'Climbing' },
    { type: 'project', label: 'Project' },
    { type: 'strength', label: 'Strength' },
    { type: 'cardio', label: 'Cardio' },
    { type: 'flexibility', label: 'Stretching' },
    { type: 'cool-down', label: 'Cool-down' },
  ] as const;

  phaseLabel(type: string): string {
    return this.phaseOptions.find((o) => o.type === type)?.label ?? type;
  }

  /** The phase with no end time, if any. Replaces the @for/@if lookup. */
  get currentPhase() {
    return this.session?.phases.find((p) => p.endedAt === null) ?? null;
  }

  get totalAttempts(): number {
    return (this.session?.phases ?? [])
      .flatMap((p) => p.projectWork)
      .reduce((sum, w) => sum + w.attempts, 0);
  }

  get sentCount(): number {
    return (this.session?.phases ?? [])
      .flatMap((p) => p.projectWork)
      .filter((w) => w.sent).length;
  }

  // ── Live clock ───────────────────────────────────────────────────
  // Ticks once a second so the timers update. If you'd rather not
  // have live timers, delete this block and replace elapsed(...) in
  // the template with the static "since 4:25 PM" text.

  private now = signal(Date.now());

  constructor() {
    // (merge into your existing constructor if you have one)
    const id = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  /** Phase timer: "4:07", "17:32", or "1:02:10". */
  elapsed(from: string | Date): string {
    const total = Math.max(
      0,
      Math.floor((this.now() - new Date(from).getTime()) / 1000),
    );
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  /** Whole-session length: "42m" or "1h 36m". */
  sessionDuration(): string {
    if (!this.session) return '';
    const mins = Math.max(
      0,
      Math.floor(
        (this.now() - new Date(this.session.startedAt).getTime()) / 60_000,
      ),
    );
    const h = Math.floor(mins / 60);
    return h ? `${h}h ${mins % 60}m` : `${mins}m`;
  }
}
