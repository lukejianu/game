export type Position = number;
export type Entity = number;

export interface GameState {
  p: [number, Position];
  others: Map<Entity, Position>;
}
