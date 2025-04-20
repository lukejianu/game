import { Position, GameState } from "./data";

export const deserializeFromJson = (msg: string) => JSON.parse(msg);
export const serializeToJson = (data: any) => JSON.stringify(data);

export const serializeGameState = (gs: GameState): string => {
  const obj = {
    p: gs.p,
    others: Object.fromEntries(gs.others),
  };
  return serializeToJson(obj);
};

export const deserializeGameState = (msg: string): GameState => {
  const obj = deserializeFromJson(msg);
  return {
    p: obj["p"],
    others: new Map(
      Object.entries(obj["others"]).map(([k, x]) => [parseInt(k), x as Position])
    ),
  };
};
