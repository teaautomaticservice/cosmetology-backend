import { LoggerTypes } from '@commonConstants/loggerTypes';

export interface SpecifiedLogsClear {
  types?: {
    [P in LoggerTypes]?: Date;
  };
}
