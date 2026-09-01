import { Injectable, signal, inject, effect } from '@angular/core';
import { Project, ProjectNote } from '../models/project';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly projectsSignal = signal<Project[]>([]);
  readonly projects = this.projectsSignal.asReadonly();
  constructor() {
    effect(
      () => {
        if (this.authService.currentUser()) {
          this.loadProjects();
        } else {
          this.projectsSignal.set([]);
        }
      },
      { allowSignalWrites: true },
    );
  }

  private loadProjects(): void {
    const userId = this.authService.currentUser()?.id;

    if (userId === undefined) {
      this.projectsSignal.set([]);

      return;
    }
    this.http.get<Project[]>('/api/projects').subscribe({
      next: (projects) => {
        if (this.authService.currentUser()?.id !== userId) {
          return;
        }

        this.projectsSignal.set(projects);
      },
      error: (error) => {
        console.error('Failed to load projects', error);
      },
    });
  }

  refreshProjects(): void {
    this.loadProjects();
  }

  getProjectById(id: number): Project | undefined {
    return this.projectsSignal().find((project) => project.id === id);
  }

  getProject(id: number) {
    return this.http.get<Project>(`/api/projects/${id}`);
  }

  addProject(project: Omit<Project, 'id'>) {
    return this.http.post<Project>('/api/projects', project).pipe(
      tap((newProject) => {
        this.projectsSignal.update((projects) => [...projects, newProject]);
      }),
    );
  }

  updateProject(id: number, updates: Partial<Project>) {
    return this.http.put<Project>(`/api/projects/${id}`, updates).pipe(
      tap((updatedProject) => {
        this.projectsSignal.update((projects) =>
          projects.map((project) =>
            project.id === id
              ? {
                  ...updatedProject,
                  notes: project.notes,
                }
              : project,
          ),
        );
      }),
    );
  }

  updateAttempts(id: number, change: number) {
    return this.http
      .patch<Project>(`/api/projects/${id}/attempts`, { change })
      .pipe(
        tap((updatedProject) => {
          this.projectsSignal.update((projects) =>
            projects.map((project) =>
              project.id === id ? updatedProject : project,
            ),
          );
        }),
      );
  }

  addNote(projectId: number, body: string) {
    return this.http
      .post<ProjectNote>(`/api/projects/${projectId}/notes`, {
        body: body.trim(),
      })
      .pipe(
        tap((newNote) => {
          this.projectsSignal.update((projects) =>
            projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    notes: [...project.notes, newNote],
                  }
                : project,
            ),
          );
        }),
      );
  }

  deleteNote(projectId: number, noteId: number) {
    return this.http
      .delete<void>(`/api/projects/${projectId}/notes/${noteId}`)
      .pipe(
        tap(() => {
          this.projectsSignal.update((projects) =>
            projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    notes: project.notes.filter((note) => note.id !== noteId),
                  }
                : project,
            ),
          );
        }),
      );
  }

  updateNote(projectId: number, noteId: number, updatedBody: string) {
    return this.http
      .patch<ProjectNote>(`/api/projects/${projectId}/notes/${noteId}`, {
        body: updatedBody.trim(),
      })
      .pipe(
        tap((updatedNote) => {
          this.projectsSignal.update((projects) =>
            projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    notes: project.notes.map((note) =>
                      note.id === noteId ? updatedNote : note,
                    ),
                  }
                : project,
            ),
          );
        }),
      );
  }

  deleteProject(id: number) {
    return this.http.delete<void>(`/api/projects/${id}`).pipe(
      tap(() => {
        this.projectsSignal.update((projects) =>
          projects.filter((project) => project.id !== id),
        );
      }),
    );
  }
}
