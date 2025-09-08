import { UserSession } from './types';

// This is a mock user store. Replace with a real database in production.
const users = [
  { username: 'admin', password: 'password', role: 'admin' },
  { username: 'user1', password: 'password', role: 'user', allowedProjects: ['My Dashboard'] },
  { username: 'user2', password: 'password', role: 'user', allowedProjects: ['Another Project'] },
];

export type LoginResult = {
  success: true;
  user: UserSession;
} | {
  success: false;
  error: string;
};

export async function login(credentials: Record<string, string>): Promise<LoginResult> {
  const { username, password, project } = credentials;

  const user = users.find((u) => u.username === username);

  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid username or password.' };
  }

  if (user.role === 'admin') {
    return {
      success: true,
      user: { username: user.username, role: 'admin' },
    };
  }

  if (user.role === 'user') {
    if (!project) {
      return { success: false, error: 'Project name is required for user role.' };
    }
    if (!user.allowedProjects.includes(project)) {
      return { success: false, error: `Access denied to project "${project}".` };
    }
    return {
      success: true,
      user: { username: user.username, role: 'user', project },
    };
  }
  
  return { success: false, error: 'Unknown user role.' };
}
