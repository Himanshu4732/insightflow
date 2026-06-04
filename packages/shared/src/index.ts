export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  avatar_url?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Metric {
  timestamp: string;
  value: number;
  label: string;
  category: string;
}

export interface InsightReport {
  id: string;
  title: string;
  summary: string;
  score: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
