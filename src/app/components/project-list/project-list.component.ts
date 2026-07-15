import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
// import { PROJECTS } from '../../data/dummy-projects';
import { Project } from '../../models/project';
import { ProjectNote } from '../../models/project';
import { FormsModule } from '@angular/forms';

import { ProjectsService } from '../../services/projects.service';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, FormsModule, FontAwesomeModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  private projectsService = inject(ProjectsService);

  projects = this.projectsService.projects;
  editingNoteProjectId: number | null = null;
  noteText = '';
  noteBeingEdited: ProjectNote | null = null;
  faTrash = faTrash;
  faEdit = faPenToSquare;

  updateAttempts(id: number, change: number): void {
    this.projectsService.updateAttempts(id, change);
  }

  deleteProject(id: number): void {
    if (confirm('Delete this project?')) {
      this.projectsService.deleteProject(id);
      this.projects = this.projectsService.projects;
    }
  }

  startAddingNote(projectId: number): void {
    this.editingNoteProjectId = projectId;
    this.noteBeingEdited = null;
    this.noteText = '';
  }

  startEditingNote(projectId: number, note: ProjectNote): void {
    this.editingNoteProjectId = projectId;
    this.noteBeingEdited = note;
    this.noteText = note.body;
  }

  cancelNote(): void {
    this.editingNoteProjectId = null;
    this.noteText = '';
  }

  saveNote(project: Project): void {
    if (!this.noteText.trim()) {
      return;
    }

    if (this.noteBeingEdited) {
      this.projectsService.updateNote(
        project.id,
        this.noteBeingEdited.id,
        this.noteText,
      );
    } else {
      this.projectsService.addNote(project.id, this.noteText);
    }

    this.editingNoteProjectId = null;
    this.noteText = '';
  }

  deleteNote(projectId: number, noteId: number) {
    if (confirm('Delete this note?')) {
      this.projectsService.deleteNote(projectId, noteId);
    }
  }
}
