import request from 'supertest';
import { app } from '../../app.js';

export async function createTestUser(email: string, password = 'password123') {
  const agent = request.agent(app);

  const response = await agent
    .post('/api/auth/signup')
    .send({
      email,
      password,
    })
    .expect(201);

  return {
    agent,
    user: response.body,
    password,
  };
}
