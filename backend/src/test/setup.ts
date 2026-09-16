if (process.env.DB_NAME !== 'project_horizon_test') {
  throw new Error('Backend tests must use the project_horizon_test database');
}

process.env.JWT_SECRET = 'test-only-jwt-secret';

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
