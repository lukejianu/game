import { WebSocketServer, WebSocket } from "ws";

import { Id, ClientGameStateMsg, Position } from "../../common/src/data";
import { getTimestamp, updateTimestamp } from "./timestamp";

export type PlayerState = {
  p: Position, 
  actionSequence: number
}

type ServerGameState = Map<Id, PlayerState>

const spawnPoint = 0


export const initServer = (wss: WebSocketServer, gs: ServerGameState, conns: Map<Id, WebSocket>) => {
  wss.on('connection', (newClient: WebSocket) => {
    const id = genId()
    conns.set(id, newClient)
    gs.set(id, {p: spawnPoint, actionSequence: 0})
    newClient.on('message', (data) => {
      const clientAction = JSON.parse(data.toString());
      const oldState = gs.get(id)!; 
      const newPlayerState = handleInput(clientAction, oldState);
      gs.set(id, newPlayerState);
    }); 
    newClient.on('close', () => {
      conns.delete(id)
      gs.delete(id)
    }); 
  })
}

const handleInput = (clientAction: any, oldState: PlayerState) => {
  const step = 5
  const deltas: Record<string, number> = { a: -step, d: +step };
  const delta = deltas[clientAction.action];
  if (delta === undefined) {
    throw new Error(`Unsupported input: ${clientAction.action}`);
  }
  return {
    p: oldState.p + delta, 
    actionSequence: clientAction.gamestate.actionSequence,
  }
}

const genId = (): Id => {
  return Math.floor(Math.random() * 1000).toString();
}

export const runTick = (gs: ServerGameState, conns: Map<Id, WebSocket>) => {
  updateTimestamp(); 
  conns.forEach((conn, id) => {
    const jsonString = personalizeState(id, gs);
    console.log(jsonString); 
    conn.send(jsonString); 
  })
}

export const personalizeState = (id: Id, gs: ServerGameState): string => {
  const personalizedState: ClientGameStateMsg = {
    p: 0,
    others: {}, 
    actionSequence: 0, 
  };

  const gameState = gs.get(id); 

  if (!gameState) { return JSON.stringify(personalizedState) }; 

  personalizedState.p = gameState.p; 
  personalizedState.actionSequence = gameState.actionSequence; 

  for (const [key, value] of gs) {
    if (key !== id) {
      personalizedState.others[key] = value.p;
    }
  }
  return JSON.stringify(personalizedState);
}