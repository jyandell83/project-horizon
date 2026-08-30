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

      this.projectsService.getProject(this.projectId).subscribe({
        next: (project) => {
          this.projectForm.patchValue(project);
        },
        error: (error) => {
          console.error('Failed to load project:', error);
        },
      });
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
      this.projectsService
        .updateProject(this.projectId, {
          name: formValue.name,
          grade: formValue.grade,
          location: formValue.location,
          environment: formValue.environment,
          status: formValue.status,
        })
        .subscribe({
          next: (updatedProject) => {
            console.log('Updated project:', updatedProject);
            this.router.navigate(['/projects']);
          },
          error: (error) => {
            console.error('Failed to update project:', error);
          },
        });
    } else {
      this.projectsService
        .addProject({
          name: formValue.name,
          grade: formValue.grade,
          location: formValue.location,
          environment: formValue.environment,
          status: 'active',
          attempts: 0,
          notes: [],
        })
        .subscribe({
          next: (newProject) => {
            console.log('Saved project:', newProject);
            this.router.navigate(['/projects']);
          },
          error: (error) => {
            console.error('Failed to create project:', error);
          },
        });
    }
  }

  cancelAddingProject(): void {
    this.router.navigate(['/projects']);
  }
}
