import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
// import { PROJECTS } from '../../data/dummy-projects';
// import { Project } from '../../models/project';

import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  private projectsService = inject(ProjectsService);

  projects = this.projectsService.getProjects();
  editingNoteProjectId: number | null = null;

  updateAttempts(id: number, change: number): void {
    this.projectsService.updateAttempts(id, change);
  }

  deleteProject(id: number): void {
    this.projectsService.deleteProject(id);
    this.projects = this.projectsService.getProjects();
  }

  showNoteEditor(projectId: number): void {
    this.editingNoteProjectId = projectId;
  }
  cancelNote(): void {
    this.editingNoteProjectId = null;
  }
}
