import { Component, inject } from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';

import { ProjectsService } from '../../services/projects.service';

import { ProjectStatus } from '../../models/project';

import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-form-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-form-page.component.html',
  styleUrl: './project-form-page.component.scss',
})
export class ProjectFormPageComponent {
  isEditing = false;
  projectId?: number;
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectsService = inject(ProjectsService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditing = true;
      this.projectId = Number(idParam);

      const project = this.projectsService.getProjectById(this.projectId);

      if (project) {
        this.projectForm.patchValue(project);
      }
    }
  }

  projectForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    grade: [''],
    location: [''],
    environment: new FormControl<'gym' | 'outdoor'>('gym', {
      nonNullable: true,
    }),
    status: ['active' as ProjectStatus],
  });

  saveProject() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const formValue = this.projectForm.getRawValue();

    if (this.isEditing && this.projectId) {
      this.projectsService.updateProject(this.projectId, {
        name: formValue.name,
        grade: formValue.grade,
        location: formValue.location,
        environment: formValue.environment,
        status: formValue.status,
      });
    } else {
      this.projectsService.addProject({
        name: formValue.name,
        grade: formValue.grade,
        location: formValue.location,
        environment: formValue.environment,
        status: formValue.status,
        attempts: 0,
        notes: [],
      });
    }

    this.router.navigate(['/projects']);
  }
}
