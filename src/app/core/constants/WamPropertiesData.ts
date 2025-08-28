import { CellDataDto } from '../dtos/cell-data.dto';
import { DataTypes } from '../enums/DataTypes';


export const dummyApplication: CellDataDto = {
  name: 'Library',
  type: 'Application',
  uri: 'https://your.app/diagram/123#cell-app',
  props: {
    theme: { label: 'Theme', type: DataTypes.string, value: 'Dark' },
    status: { label: 'Status', type: DataTypes.enum, value: 'draft', options: ['draft','review','final'] },
    maxUsers: { label: 'Max Users', type: DataTypes.number, value: 100 },
    cacheEnabled: { label: 'Cache Enabled', type: DataTypes.boolean, value: true },
    license: { label: 'License', type: DataTypes.string, value: 'MIT' },
    version: { label: 'Version', type: DataTypes.string, value: '1.0.0' },
    category: { label: 'Category', type: DataTypes.enum, value: 'core', options: ['core','addon','beta'] },
    owner: { label: 'Owner', type: DataTypes.string, value: 'Team A' },
  },
};


export const dummyService: CellDataDto = {
  name: 'AuthService',
  type: 'Service',
  uri: 'https://your.app/diagram/123#cell-srv',
  props: {
    endpoint: { label: 'Endpoint', type: DataTypes.string, value: 'https://api.app.com/auth' },
    protocol: { label: 'Protocol', type: DataTypes.enum, value: 'HTTPS', options: ['HTTP','HTTPS','gRPC'] },
    port: { label: 'Port', type: DataTypes.number, value: 443 },
    retries: { label: 'Retries', type: DataTypes.number, value: 3 },
    enabled: { label: 'Enabled', type: DataTypes.boolean, value: true },
    timeout: { label: 'Timeout (ms)', type: DataTypes.number, value: 5000 },
    version: { label: 'Version', type: DataTypes.string, value: '2.1' },
    healthCheck: { label: 'Health Check', type: DataTypes.boolean, value: true },
  },
};

export const dummyProcessUnit: CellDataDto = {
  name: 'ETL Processor',
  type: 'ProcessUnit',
  uri: 'https://your.app/diagram/123#cell-proc',
  props: {
    threads: { label: 'Threads', type: DataTypes.number, value: 4 },
    batchSize: { label: 'Batch Size', type: DataTypes.number, value: 500 },
    mode: { label: 'Mode', type: DataTypes.enum, value: 'parallel', options: ['sequential','parallel'] },
    logging: { label: 'Logging', type: DataTypes.boolean, value: true },
    inputType: { label: 'Input Type', type: DataTypes.enum, value: 'CSV', options: ['CSV','JSON','XML'] },
    outputType: { label: 'Output Type', type: DataTypes.enum, value: 'JSON', options: ['CSV','JSON','XML'] },
    owner: { label: 'Owner', type: DataTypes.string, value: 'DataOps Team' },
    retryPolicy: { label: 'Retry Policy', type: DataTypes.enum, value: 'exponential', options: ['none','fixed','exponential'] },
  },
};

export const dummySecurityRealm: CellDataDto = {
  name: 'AdminRealm',
  type: 'SecurityRealm',
  uri: 'https://your.app/diagram/123#cell-sec',
  props: {
    realmId: { label: 'Realm ID', type: DataTypes.string, value: 'admin' },
    description: { label: 'Description', type: DataTypes.string, value: 'Handles admin users' },
    authMethod: { label: 'Auth Method', type: DataTypes.enum, value: 'password', options: ['password','token','certificate'] },
    sessionTimeout: { label: 'Session Timeout (min)', type: DataTypes.number, value: 30 },
    active: { label: 'Active', type: DataTypes.boolean, value: true },
    encryption: { label: 'Encryption', type: DataTypes.enum, value: 'AES256', options: ['AES128','AES256','RSA'] },
    owner: { label: 'Owner', type: DataTypes.string, value: 'Security Team' },
    accessLevel: { label: 'Access Level', type: DataTypes.enum, value: 'high', options: ['low','medium','high'] },
  },
};


export const dummyIdentityProvider: CellDataDto = {
  name: 'GoogleIDP',
  type: 'IdentityProvider',
  uri: 'https://your.app/diagram/123#cell-idp',
  props: {
    providerName: { label: 'Provider Name', type: DataTypes.string, value: 'Google' },
    protocol: { label: 'Protocol', type: DataTypes.enum, value: 'OIDC', options: ['OIDC','SAML','LDAP'] },
    clientId: { label: 'Client ID', type: DataTypes.string, value: 'abc123' },
    clientSecret: { label: 'Client Secret', type: DataTypes.string, value: 'secret' },
    redirectUri: { label: 'Redirect URI', type: DataTypes.string, value: 'https://app.com/callback' },
    enabled: { label: 'Enabled', type: DataTypes.boolean, value: true },
    tokenExpiry: { label: 'Token Expiry (s)', type: DataTypes.number, value: 3600 },
    status: { label: 'Status', type: DataTypes.enum, value: 'active', options: ['active','inactive'] },
  },
};
