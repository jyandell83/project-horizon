import { Injectable, signal } from '@angular/core';
import { Project, ProjectNote } from '../models/project';

import { PROJECTS } from '../data/dummy-projects';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  constructor() {
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      this.projectsSignal.set(JSON.parse(storedProjects) as Project[]);
    } else {
      this.projectsSignal.set([...PROJECTS]);
    }
  }
  private readonly projectsSignal = signal<Project[]>([]);
  readonly projects = this.projectsSignal.asReadonly();

  private saveProjects(): void {
    localStorage.setItem('projects', JSON.stringify(this.projectsSignal()));
  }

  getProjectById(id: number): Project | undefined {
    return this.projectsSignal().find((project) => project.id === id);
  }

  addProject(project: Omit<Project, 'id'>): void {
    const newProject: Project = {
      ...project,
      id: Date.now(),
    };

    this.projectsSignal.update((projects) => [...projects, newProject]);
    this.saveProjects();
  }

  updateProject(id: number, updates: Partial<Project>) {
    this.projectsSignal.update((projects) =>
      projects.map((project) =>
        project.id === id ? { ...project, ...updates } : project,
      ),
    );

    this.saveProjects();
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
