import { Component, inject } from '@angular/core';

import { SessionsService } from '../../services/sessions.service';

import { ClimbingSession } from '../../models/session';

import { ActivatedRoute } from '@angular/router';

import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

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

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  sessionForm = this.fb.nonNullable.group({
    location: [''],
    startedAt: [''],
    endedAt: [''],
  });

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
      }
    }
  }
}
