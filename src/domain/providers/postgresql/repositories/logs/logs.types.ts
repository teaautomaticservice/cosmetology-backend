import { LoggerTypes } from '@constants/loggerTypes';

export interface SpecifiedLogsClear {
  types?: {
    [P in LoggerTypes]?: Date;
  };
}
