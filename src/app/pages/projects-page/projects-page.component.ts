import { Component } from '@angular/core';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [ProjectListComponent],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
})
export class ProjectsPageComponent {}
