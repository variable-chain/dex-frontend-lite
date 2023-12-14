import { StopLossE } from '../types/enums';

const mapStopLoss: Record<StopLossE, number> = {
  [StopLossE.None]: 0,
  [StopLossE['10%']]: -0.1,
  [StopLossE['25%']]: -0.25,
  [StopLossE['50%']]: -0.5,
  [StopLossE['75%']]: -0.75,
};

export function mapStopLossToNumber(stopLoss: StopLossE) {
  return mapStopLoss[stopLoss];
}
