export enum UserStatus {
  Blocked = 'blocked',
  Deleted = 'deleted',
  DeletedByGdpr = 'deletedByGdpr',
  Active = 'active',
  Banned = 'banned',
  Deactivated = 'deactivated'
}

export enum UserType {
  Operator = 'operator',
  Client = 'client',
  Administrator = 'administrator',
  SuperAdministrator = 'superAdministrator',
}