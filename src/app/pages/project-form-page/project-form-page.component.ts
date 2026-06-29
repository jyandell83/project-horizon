import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

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
  constructor(private router: Router) {}

  private fb = inject(FormBuilder);

  projectForm = this.fb.nonNullable.group({
    name: [''],
    grade: [''],
    location: [''],
    environment: ['gym' as 'gym' | 'outdoor'],
  });

  saveProject() {
    const newProject: Project = {
      id: Date.now(),
      name: this.projectForm.value.name!,
      grade: this.projectForm.value.grade!,
      location: this.projectForm.value.location!,
      environment: this.projectForm.value.environment!,
      status: 'active',
      attempts: 0,
      notes: [],
    };
    console.log(newProject);

    this.router.navigate(['/projects']);
  }
}
