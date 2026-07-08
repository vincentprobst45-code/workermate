import type { Session } from './auth.types';

export const EMPTY_SESSION: Session = {
  user: null,
  tenants: [],
  activeTenant: null,
};
