import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';

import { ProjectsService } from '../../services/projects.service';

import { Project } from '../../models/project';

import { Router } from '@angular/router';

@Component({
  selector: 'app-project-form-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-form-page.component.html',
  styleUrl: './project-form-page.component.scss',
})
export class ProjectFormPageComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectsService = inject(ProjectsService);

  projectForm = this.fb.nonNullable.group({
    name: [''],
    grade: [''],
    location: [''],
    environment: new FormControl<'gym' | 'outdoor'>('gym', {
      nonNullable: true,
    }),
  });

  saveProject() {
    const formValue = this.projectForm.getRawValue();
    this.projectsService.addProject({
      name: formValue.name,
      grade: formValue.grade,
      location: formValue.location,
      environment: formValue.environment,
      status: 'active',
      attempts: 0,
      notes: [],
    });

    this.router.navigate(['/projects']);
  }
}
