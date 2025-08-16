import { personalizeState } from '../src/app';

import { Id, Position } from "../../common/src/data";

test('test personalizeState', () => {
  let gs = new Map<Id, Position>([
    ['0', 100],
    ['1', 50],
    ['2', 75],
  ])
  expect(personalizeState('0', gs)).toBe(JSON.stringify({p: 100, others: {1: 50, 2: 75}}));
  expect(personalizeState('1', gs)).toBe(JSON.stringify({p: 50, others: {0: 100, 2: 75}}));
  expect(personalizeState('2', gs)).toBe(JSON.stringify({p: 75, others: {0: 100, 1: 50}}));
});
