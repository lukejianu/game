import { WebSocketServer, WebSocket } from "ws";

import { Id, Position } from "../../common/src/data";

const spawnPoint = 0

export const initServer = (wss: WebSocketServer, gs: Map<Id, Position>, conns: Map<Id, WebSocket>) => {
  wss.on('connection', (newClient: WebSocket) => {
    const id = genId()
    conns.set(id, newClient)
    gs.set(id, spawnPoint)
    newClient.on('message', (data) => {
      const msg = data.toString();
      const currPos = gs.get(id)!
      const newPos = handleInput(currPos, msg);
      gs.set(id, newPos);
    })
    newClient.on('close', () => {
      conns.delete(id)
      gs.delete(id)
    })
  })
}

const handleInput = (pos: Position, key: string) => {
  const step = 5
  const deltas: Record<string, number> = { a: -step, d: +step };
  const delta = deltas[key];
  if (delta === undefined) {
    throw new Error(`Unsupported input: ${key}`);
  }
  return pos + delta;
}

const genId = (): Id => {
  return Math.floor(Math.random() * 1000);
}

export const runTick = (gs: Map<Id, Position>, conns: Map<Id, WebSocket>) => {
  conns.forEach((conn, id) => {
    const jsonString = personalizeState(id, gs);
    conn.send(jsonString)
  })
}

export const personalizeState = (id: Id, gs: Map<Id, Position>): string => {
  const personalizedState: { p?: Position; others?: Record<number, Position> } = {};
  const others: Record<number, Position> = {};  

  for (const [key, value] of gs) {
    if (key === id) {
      personalizedState.p = value; 
    } else {
      others[key] = value; 
    }
  }
  personalizedState.others = others; 
  return JSON.stringify(personalizedState); 
}