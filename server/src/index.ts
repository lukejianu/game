import { WebSocketServer } from 'ws';
import { Position, GameState } from '../../common/src/data';
import { serialize, deserialize } from '../../common/src/transport';

const port = 8080;
const timeStepMs = 1000;
const startState: Position = 0;

const wss = new WebSocketServer({ port });

// Generates a random integer in the range [0, n).
const randomInt = (n: number): number => {
  if (!Number.isInteger(n)) {
    throw new Error("Expected integer!");
  }
  return Math.floor(Math.random() * n);
}

const handleInput = (p: Position, key: string): Position => {
  const step = 5;
  if (key === 'a') {
    return p - step;
  } else if (key === 'd') {
    return p + step; 
  } else {
    throw Error('Unsupported input!');
  }
}

const state: GameState = new Map();

wss.on('connection', (ws) => {
  const clientId = randomInt(100).toString();
  state.set(clientId, startState);
  ws.on('message', (msg) => {
    const currPos = state.get(clientId)!;
    const newPos = handleInput(currPos, deserialize(msg));
    state.set(clientId, newPos);
  })
  ws.on('close', () => state.delete(clientId));
});

setInterval(() => {
  wss.clients.forEach((client) => client.send(serialize(Object.fromEntries(state))));
}, timeStepMs);
