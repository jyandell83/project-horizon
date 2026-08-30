import { Injectable, signal, inject } from '@angular/core';
import { Project, ProjectNote } from '../models/project';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private http = inject(HttpClient);

  private readonly projectsSignal = signal<Project[]>([]);
  readonly projects = this.projectsSignal.asReadonly();
  constructor() {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.http.get<Project[]>('/api/projects').subscribe({
      next: (projects) => {
        this.projectsSignal.set(projects);
      },
      error: (error) => {
        console.error('Failed to load projects', error);
      },
    });
  }

  private saveProjects(): void {
    localStorage.setItem('projects', JSON.stringify(this.projectsSignal()));
  }

  getProjectById(id: number): Project | undefined {
    return this.projectsSignal().find((project) => project.id === id);
  }

  // OLD WAY BEFORE SQL DB
  // addProject(project: Omit<Project, 'id'>): void {
  //   const newProject: Project = {
  //     ...project,
  //     id: Date.now(),
  //   };

  //   this.projectsSignal.update((projects) => [...projects, newProject]);
  //   this.saveProjects();
  // }

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
            project.id === id ? updatedProject : project,
          ),
        );
      }),
    );
  }

  updateAttempts(id: number, change: number): void {
    this.projectsSignal.update((projects) =>
      projects.map((project) =>
        project.id === id
          ? {
              ...project,
              attempts: Math.max(0, project.attempts + change),
            }
          : project,
      ),
    );
    this.saveProjects();
  }

  addNote(projectId: number, body: string): void {
    const newNote: ProjectNote = {
      id: Date.now(),
      date: new Date().toISOString(),
      body: body.trim(),
    };

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
    this.saveProjects();
  }

  deleteNote(projectId: number, noteId: number): void {
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
    this.saveProjects();
  }

  updateNote(projectId: number, noteId: number, updatedBody: string): void {
    this.projectsSignal.update((projects) =>
      projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              notes: project.notes.map((note) =>
                note.id === noteId
                  ? {
                      ...note,
                      body: updatedBody,
                    }
                  : note,
              ),
            }
          : project,
      ),
    );
    this.saveProjects();
  }

  deleteProject(id: number): void {
    this.projectsSignal.update((projects) =>
      projects.filter((project) => project.id !== id),
    );
    this.saveProjects();
  }
}
