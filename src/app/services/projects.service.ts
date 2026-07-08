import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { ProjectNote } from '../models/project';

import { PROJECTS } from '../data/dummy-projects';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private projects: Project[] = [...PROJECTS];

  getProjects(): Project[] {
    return this.projects;
  }

  getProjectById(id: number): Project | undefined {
    return this.projects.find((project) => project.id === id);
  }

  addProject(project: Omit<Project, 'id'>): void {
    const newProject: Project = {
      ...project,
      id: Date.now(),
    };

    this.projects.push(newProject);
  }

  updateProject(updatedProject: Project): void {
    const index = this.projects.findIndex(
      (project) => project.id === updatedProject.id,
    );

    if (index !== -1) {
      this.projects[index] = updatedProject;
    }
  }

  updateAttempts(id: number, change: number): void {
    const project = this.projects.find((p) => p.id === id);

    if (!project) return;

    project.attempts = Math.max(0, project.attempts + change);
  }

  addNote(projectId: number, body: string): void {
    const project = this.projects.find((project) => project.id === projectId);

    if (!project) return;

    const newNote: ProjectNote = {
      id: Date.now(),
      date: new Date().toISOString(),
      body: body.trim(),
    };

    project.notes.push(newNote);

    // later:
    // this.saveToLocalStorage();
  }

  deleteNote(projectId: number, noteId: number) {
    const project = this.projects.find((p) => p.id === projectId);

    if (!project) {
      return;
    }

    project.notes = project.notes.filter((note) => note.id !== noteId);
  }

  deleteProject(id: number): void {
    this.projects = this.projects.filter((project) => project.id !== id);
  }
}
