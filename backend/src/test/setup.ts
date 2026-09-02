if (process.env.DB_NAME !== 'project_horizon_test') {
  throw new Error('Backend tests must use the project_horizon_test database');
}

process.env.JWT_SECRET = 'test-only-jwt-secret';
