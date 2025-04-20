import { Entity } from "./ecs";

export type Position = number;

export interface GameState {
  p: [number, Position];
  others: Map<Entity, Position>;
}
