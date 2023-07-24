export type ID = number;

export type WithID<Type> = Type & {
  id: ID,
}
