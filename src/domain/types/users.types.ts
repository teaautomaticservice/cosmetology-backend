export enum UserStatus {
  Blocked = 'blocked',
  Deleted = 'deleted',
  DeletedByGdpr = 'deletedByGdpr',
  Active = 'active',
  Banned = 'banned',
  Deactivated = 'deactivated'
}

export enum UserType {
  Client = 'client',
  Operator = 'operator',
  Administrator = 'administrator',
  SuperAdministrator = 'superAdministrator',
}