import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { ProjectsPageComponent } from './pages/projects-page/projects-page.component';
import { SessionsPageComponent } from './pages/sessions-page/sessions-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { SessionsActivePageComponent } from './pages/sessions-active-page/sessions-active-page.component';
import { ProjectFormPageComponent } from './pages/project-form-page/project-form-page.component';
import { SessionEditPageComponent } from './pages/session-edit-page/session-edit-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'signup',
    component: SignupPageComponent,
  },
  {
    path: 'projects',
    component: ProjectsPageComponent,
  },
  {
    path: 'projects/new',
    component: ProjectFormPageComponent,
  },
  { path: 'projects/:id/edit', component: ProjectFormPageComponent },
  {
    path: 'sessions',
    component: SessionsPageComponent,
  },
  {
    path: 'sessions/active',
    component: SessionsActivePageComponent,
  },
  {
    path: 'sessions/:id/edit',
    component: SessionEditPageComponent,
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
  },
];
