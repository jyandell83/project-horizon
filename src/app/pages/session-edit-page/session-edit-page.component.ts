import { Component, inject } from '@angular/core';
import { SessionsService } from '../../services/sessions.service';
import { ClimbingSession, SessionPhaseType } from '../../models/session';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';

type PhaseForm = FormGroup<{
  type: FormControl<SessionPhaseType>;
  startedAt: FormControl<string>;
  endedAt: FormControl<string>;
}>;

@Component({
  selector: 'app-session-edit-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './session-edit-page.component.html',
  styleUrl: './session-edit-page.component.scss',
})
export class SessionEditPageComponent {
  sessionId?: string;
  session?: ClimbingSession;

  private sessionsService = inject(SessionsService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  sessionForm = this.fb.nonNullable.group({
    location: [''],
    startedAt: [''],
    endedAt: [''],
    phases: this.fb.array<PhaseForm>([]),
  });

  get phases() {
    return this.sessionForm.controls.phases;
  }

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.sessionId = idParam;
      this.session = this.sessionsService.getSessionById(this.sessionId);

      if (this.session) {
        this.sessionForm.patchValue({
          location: this.session.location ?? '',
          startedAt: this.toDateTimeLocal(this.session.startedAt),
          endedAt: this.session.endedAt
            ? this.toDateTimeLocal(this.session.endedAt)
            : '',
        });

        for (const phase of this.session.phases) {
          this.phases.push(
            this.fb.nonNullable.group({
              type: [phase.type],
              startedAt: [this.toDateTimeLocal(phase.startedAt)],
              endedAt: [
                phase.endedAt ? this.toDateTimeLocal(phase.endedAt) : '',
              ],
            }),
          );
        }
      }
    }
  }

  saveChanges(): void {
    if (!this.sessionId || !this.session) return;

    const formValue = this.sessionForm.getRawValue();

    const updatedPhases = this.session.phases.map((phase, index) => ({
      ...phase,
      startedAt: new Date(formValue.phases[index].startedAt).toISOString(),
      endedAt: formValue.phases[index].endedAt
        ? new Date(formValue.phases[index].endedAt).toISOString()
        : null,
    }));

    this.sessionsService.editSession(this.sessionId, {
      location: formValue.location,
      startedAt: new Date(formValue.startedAt).toISOString(),
      endedAt: formValue.endedAt
        ? new Date(formValue.endedAt).toISOString()
        : undefined,
      phases: updatedPhases,
    });

    this.router.navigate(['/sessions']);
  }
}
