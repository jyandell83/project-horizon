import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
// import { PROJECTS } from '../../data/dummy-projects';
import { Project } from '../../models/project';
import { FormsModule } from '@angular/forms';

import { ProjectsService } from '../../services/projects.service';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, FormsModule, FontAwesomeModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  private projectsService = inject(ProjectsService);

  projects = this.projectsService.getProjects();
  editingNoteProjectId: number | null = null;
  noteText = '';
  faTrash = faTrash;

  updateAttempts(id: number, change: number): void {
    this.projectsService.updateAttempts(id, change);
  }

  deleteProject(id: number): void {
    if (confirm('Delete this project?')) {
      this.projectsService.deleteProject(id);
      this.projects = this.projectsService.getProjects();
    }
  }

  showNoteEditor(projectId: number): void {
    this.editingNoteProjectId = projectId;
    this.noteText = '';
  }

  cancelNote(): void {
    this.editingNoteProjectId = null;
    this.noteText = '';
  }

  saveNote(project: Project): void {
    if (!this.noteText.trim()) {
      return;
    }

    this.projectsService.addNote(project.id, this.noteText);

    this.editingNoteProjectId = null;
    this.noteText = '';
  }

  deleteNote(projectId: number, noteId: number) {
    if (confirm('Delete this note?')) {
      this.projectsService.deleteNote(projectId, noteId);
    }
  }
}
