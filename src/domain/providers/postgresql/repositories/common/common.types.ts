import { FindManyOptions } from 'typeorm';

export type Where<Entity> = FindManyOptions<Entity>['where'];