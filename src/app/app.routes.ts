import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { ProjectsPageComponent } from './pages/projects-page/projects-page.component';
import { SessionsPageComponent } from './pages/sessions-page/sessions-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
  {
    path: 'projects',
    component: ProjectsPageComponent,
  },
  {
    path: 'sessions',
    component: SessionsPageComponent,
  },
];
