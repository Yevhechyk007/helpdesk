export type UserRole = 'admin' | 'agent' | 'customer';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  agent: 'Support Agent',
  customer: 'Customer',
};
