# Project Horizon

**A full-stack climbing and workout tracking application built with Angular, Node.js, Express, and PostgreSQL.**

[Live Application](https://projecthorizon.app)

## Overview

Project Horizon is a web application designed to help climbers track their progress, manage climbing projects, and log training sessions.

The idea started with a simple goal: create a place to record climbing attempts, track progress on boulder problems, and reflect on training over time.

Unlike social fitness platforms, Project Horizon focuses on personal progress and intentional training rather than competition or social engagement.

The application has evolved into a full-stack project covering frontend development, REST API design, relational data modeling, authentication, automated testing, and cloud deployment.

## Features

### Climbing Project Management

- Create and manage individual climbing projects.
- Track grades, locations, and indoor/outdoor climbing environments.
- Record attempts and progress over time.
- Add notes and update project status (active, sent, or retired).
- Upload and manage project media.

### Workout and Session Tracking

- Log climbing and training sessions.
- Organize workouts into phases, including warm-up, climbing, strength training, cardio, and cool-down.
- Track time spent on different activities.
- Associate climbing attempts and notes with training sessions.

### User Accounts

- User registration and login.
- JWT-based authentication using HTTP-only cookies.
- Email verification.
- Password reset functionality.
- Protected API routes and user-specific data.

## Tech Stack

| Layer          | Technologies                 |
| -------------- | ---------------------------- |
| Frontend       | Angular 18, TypeScript, SCSS |
| Backend        | Node.js, Express             |
| Database       | PostgreSQL                   |
| Authentication | JWT, HTTP-only cookies       |
| Media Storage  | Cloudinary                   |
| Email          | Resend                       |
| Testing        | Jest, Supertest              |
| CI/CD          | GitHub Actions               |
| Deployment     | Vercel, Railway              |

## Architecture

Project Horizon uses a client-server architecture with a separate Angular frontend and Express REST API.

**Frontend**

Built with Angular standalone components, reactive forms, and TypeScript. Services handle API communication and application state.

**Backend**

An Express API handles authentication, project management, user data, and media operations. Protected endpoints use authentication middleware to validate requests.

**Database**

PostgreSQL stores user accounts, climbing projects, notes, and associated application data.

**Deployment**

The Angular frontend is deployed on Vercel, while the Express API and PostgreSQL database are hosted on Railway. Vercel rewrites route API requests to the backend.

## Testing and CI

Backend integration tests use Jest and Supertest to validate API behavior, including authentication, protected routes, and project operations.

GitHub Actions runs automated tests against a dedicated PostgreSQL test database.

## Future Development

Project Horizon is an ongoing project. Planned improvements include:

- Streamlining session logging to reduce manual input.
- Improving workout history and progress visualization.
- Exploring weekly training summaries and insights.
- Refining the mobile experience and overall usability.

## Motivation

Project Horizon grew out of my interest in climbing and a desire to build something useful for tracking long-term progress.

It has also been an opportunity to take an application through the full development lifecycle—from initial concept and database design to authentication, testing, deployment, and ongoing iteration.

The focus is on building a practical, maintainable application while continuing to improve the experience for the people using it.
