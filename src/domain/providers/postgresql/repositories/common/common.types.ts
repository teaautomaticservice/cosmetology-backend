import { FindManyOptions } from 'typeorm';

export type Where<Entity> = FindManyOptions<Entity>['where'];

export type FoundAndCounted<Entity> = [Entity[], number];
