// OpenAI Open Weights App Builder - Type Definitions

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

// OpenAI Model Types
export type OpenAIModel = 'gpt-oss-20b' | 'gpt-oss-120b';

export interface ModelCapabilities {
  model: OpenAIModel;
  maxTokens: number;
  contextWindow: number;
  costPerToken: number;
  strengths: string[];
  idealUseCases: string[];
}

export interface ModelComparison {
  prompt: string;
  responses: {
    [key in OpenAIModel]: {
      response: string;
      tokens: number;
      responseTime: number;
      cost: number;
    };
  };
  timestamp: Date;
}

// Project and Template Types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  templateId?: string;
  model: OpenAIModel;
  configuration: ProjectConfiguration;
  createdAt: Date;
  updatedAt: Date;
  sandboxes: Sandbox[];
}

export interface ProjectConfiguration {
  model: OpenAIModel;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  customSettings: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  model: OpenAIModel;
  configuration: ProjectConfiguration;
  codeFiles: CodeFile[];
  documentation: string;
  tags: string[];
  featured: boolean;
  createdAt: Date;
}

export type TemplateCategory = 
  | 'web-app' 
  | 'api' 
  | 'chatbot' 
  | 'data-analysis' 
  | 'content-generation' 
  | 'code-assistant';

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  description?: string;
}

// Sandbox and Environment Types
export interface Sandbox {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  status: SandboxStatus;
  daytonaEnvironmentId: string;
  url?: string;
  resources: SandboxResources;
  createdAt: Date;
  lastAccessedAt?: Date;
  expiresAt?: Date;
}

export type SandboxStatus = 
  | 'creating' 
  | 'running' 
  | 'stopped' 
  | 'error' 
  | 'expired';

export interface SandboxResources {
  cpu: string;
  memory: string;
  storage: string;
  estimatedCostPerHour: number;
}

export interface DaytonaEnvironment {
  id: string;
  name: string;
  status: string;
  url?: string;
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Usage and Analytics Types
export interface UsageMetrics {
  userId: string;
  period: 'day' | 'week' | 'month';
  tokensUsed: number;
  sandboxHours: number;
  apiCalls: number;
  cost: number;
  date: Date;
}

export interface ModelBenchmark {
  model: OpenAIModel;
  metric: 'response_time' | 'token_efficiency' | 'quality_score';
  value: number;
  timestamp: Date;
  context: string;
}

// Form and UI Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export type ErrorCode = 
  | 'AUTH_REQUIRED'
  | 'INSUFFICIENT_CREDITS'
  | 'MODEL_UNAVAILABLE'
  | 'SANDBOX_LIMIT_EXCEEDED'
  | 'INVALID_CONFIGURATION'
  | 'EXTERNAL_API_ERROR';

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & {
  id: string;
};

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
}
