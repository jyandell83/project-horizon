import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [ProjectListComponent, RouterLink],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
})
export class ProjectsPageComponent {}
