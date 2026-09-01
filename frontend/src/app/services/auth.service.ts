import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of, tap } from 'rxjs';

import type { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserState = signal<User | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();

  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  private authCheckedState = signal(false);

  readonly authChecked = this.authCheckedState.asReadonly();

  checkAuth() {
    return this.http.get<User>('/api/auth/me').pipe(
      tap((user) => {
        this.currentUserState.set(user);
      }),
      catchError(() => {
        this.currentUserState.set(null);

        return of(null);
      }),
      finalize(() => {
        this.authCheckedState.set(true);
      }),
    );
  }

  login(email: string, password: string) {
    return this.http.post<User>('/api/auth/login', { email, password }).pipe(
      tap((user) => {
        this.currentUserState.set(user);
      }),
    );
  }

  signup(email: string, password: string) {
    return this.http.post<User>('/api/auth/signup', { email, password }).pipe(
      tap((user) => {
        this.currentUserState.set(user);
      }),
    );
  }

  logout() {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.clearSession();
      }),
    );
  }

  clearSession(): void {
    this.currentUserState.set(null);
    this.authCheckedState.set(true);
  }
}
