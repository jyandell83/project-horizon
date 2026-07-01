import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';

import { ProjectsService } from '../../services/projects.service';

import { Project } from '../../models/project';

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
    name: [''],
    grade: [''],
    location: [''],
    environment: new FormControl<'gym' | 'outdoor'>('gym', {
      nonNullable: true,
    }),
  });

  saveProject() {
    const formValue = this.projectForm.getRawValue();

    if (this.isEditing && this.projectId) {
      this.projectsService.updateProject({
        id: this.projectId,
        name: formValue.name,
        grade: formValue.grade,
        location: formValue.location,
        environment: formValue.environment,
        status: 'active',
        attempts: 0,
        notes: [],
      });
    } else {
      this.projectsService.addProject({
        name: formValue.name,
        grade: formValue.grade,
        location: formValue.location,
        environment: formValue.environment,
        status: 'active',
        attempts: 0,
        notes: [],
      });
    }

    this.router.navigate(['/projects']);
  }
}
