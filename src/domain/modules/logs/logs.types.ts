import { LoggerTypes } from 'src/ambient/constants/loggerTypes';

export interface SpecifiedLogsClear {
  types?: {
    [P in LoggerTypes]?: Date;
  };
}
