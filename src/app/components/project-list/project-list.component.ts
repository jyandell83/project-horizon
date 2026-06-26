import { Component } from '@angular/core';
import { PROJECTS } from '../../data/dummy-projects';
import { Project } from '../../models/project';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  projects: Project[] = PROJECTS;
}
