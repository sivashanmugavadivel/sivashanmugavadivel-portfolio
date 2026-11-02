// One animation per first-aid topic. Each takes { playing, step, phase, number } and shows the
// scene for the step being read; `number` is the emergency number the step text names.
import { BleedingAnim } from './bleeding';
import { BurnsAnim } from './burns';
import { ChokingAnim } from './choking';
import { CprAnim } from './cpr';
import { RecoveryAnim } from './recovery';
import { SeizureAnim } from './seizure';

export const ANIMATIONS = {
  cpr: CprAnim,
  choking: ChokingAnim,
  bleeding: BleedingAnim,
  burns: BurnsAnim,
  seizure: SeizureAnim,
  recovery: RecoveryAnim,
};
