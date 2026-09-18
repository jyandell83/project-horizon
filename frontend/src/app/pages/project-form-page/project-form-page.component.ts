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

import { ProjectMedia } from '../../models/project-media';

@Component({
  selector: 'app-project-form-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-form-page.component.html',
  styleUrl: './project-form-page.component.scss',
})
export class ProjectFormPageComponent {
  isEditing = false;
  isSaving = false;
  projectId?: number;
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectsService = inject(ProjectsService);
  private route = inject(ActivatedRoute);
  selectedImage: File | null = null;
  existingMedia: ProjectMedia[] = [];

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditing = true;
      this.projectId = Number(idParam);

      this.projectsService.getProject(this.projectId).subscribe({
        next: (project) => {
          console.log('Loaded project:', project);
          this.existingMedia = project.media;
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

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedImage = file;
  }

  saveProject() {
    if (this.isSaving) {
      return;
    }

    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

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
          next: () => {
            if (this.selectedImage && this.projectId) {
              this.projectsService
                .uploadMedia(this.projectId, this.selectedImage)
                .subscribe({
                  next: () => {
                    this.router.navigate(['/projects']);
                  },
                  error: (error) => {
                    this.isSaving = false;
                    console.error('Failed to upload project image:', error);
                  },
                });

              return;
            }

            this.router.navigate(['/projects']);
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
          media: [],
        })
        .subscribe({
          next: (newProject) => {
            console.log('Saved project:', newProject);

            if (!this.selectedImage) {
              this.router.navigate(['/projects']);
              return;
            }

            this.projectsService
              .uploadMedia(newProject.id, this.selectedImage)
              .subscribe({
                next: () => {
                  this.projectsService.refreshProjects();
                  this.router.navigate(['/projects']);
                },
                error: (error) => {
                  this.isSaving = false;

                  console.error('Failed to upload project image:', error);
                },
              });
          },
          error: (error) => {
            this.isSaving = false;

            console.error('Failed to create project:', error);
          },
        });
    }
  }

  deleteImage(): void {
    if (!this.projectId || !this.existingMedia.length) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this image? This cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    const mediaId = this.existingMedia[0].id;

    this.projectsService.deleteMedia(this.projectId, mediaId).subscribe({
      next: () => {
        this.projectsService.removeMediaFromProject(this.projectId!, mediaId);

        this.existingMedia = [];
      },
    });
  }

  cancelAddingProject(): void {
    this.router.navigate(['/projects']);
  }
}
