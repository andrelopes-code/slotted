import type {
  AddressSnapshot,
  CurrencyCode,
  EntityMetadata,
  PermissionScope,
  Region,
} from './common';

export interface Organization {
  id: string;
  legalName: string;
  displayName: string;
  industry: string;
  primaryCurrency: 'USD';
  supportedCurrencies: CurrencyCode[];
  regions: Region[];
  timezone: 'America/Chicago';
  fiscalYearStartMonth: 1;
  billingAddress: AddressSnapshot;
  operationalRegions: string[];
  status: 'active';
  metadata: EntityMetadata;
}

export type UserStatus = 'invited' | 'active' | 'suspended' | 'deactivated';

export interface User {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  department?: string;
  managerId?: string;
  status: UserStatus;
  locale: 'en-US';
  timezone: string;
  lastActiveAt?: string;
  notificationPreferences: {
    emailApprovals: boolean;
    emailMentions: boolean;
    inAppApprovals: true;
    inAppMentions: true;
    inAppOperationalAlerts: boolean;
  };
  metadata: EntityMetadata;
}

export type TeamType =
  'sales' | 'finance' | 'procurement' | 'warehouse' | 'support' | 'executive' | 'administration';

export interface Team {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: TeamType;
  status: 'active' | 'inactive';
  metadata: EntityMetadata;
}

export interface TeamMembership {
  teamId: string;
  userId: string;
  isLead: boolean;
}

export type DefaultScope = 'all' | 'own' | 'team' | 'warehouse';

export interface PermissionGrant {
  permission: string;
  defaultScope: DefaultScope;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isSystem: boolean;
  grants: PermissionGrant[];
  metadata: EntityMetadata;
}

export interface RoleAssignment {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  scope: PermissionScope;
  createdAt: string;
  createdBy: string;
}
