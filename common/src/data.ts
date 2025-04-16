import { Entity } from "./ecs";

export type Position = number;

export interface GameState {
  p: Position;
  others: Map<Entity, Position>;
}
