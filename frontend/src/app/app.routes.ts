import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
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
    canActivate: [authGuard],
  },
  {
    path: 'projects/new',
    component: ProjectFormPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'projects/:id/edit',
    component: ProjectFormPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'sessions',
    component: SessionsPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'sessions/active',
    component: SessionsActivePageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'sessions/:id/edit',
    component: SessionEditPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
    canActivate: [authGuard],
  },
];
