import { WebSocketServer, WebSocket } from "ws";

const ticksPerSecond = 5;
const timeStepMs = 1000 / ticksPerSecond;
const port = 12345
const spawnPoint = 0

const main = () => {
  const wss = new WebSocketServer({ port });
  const gs: Map<number, number> = new Map()
  const conns: Array<WebSocket> = new Array()
  initServer(wss, gs, conns);
  setInterval(() => runTick(gs, conns), timeStepMs)
}

const initServer = (wss: WebSocketServer, gs: Map<number, number>, conns: Array<WebSocket>) => {
  wss.on('connection', (newClient: WebSocket) => {
    conns.push(newClient)
    const id = genId()
    gs.set(id, spawnPoint)
    newClient.on('message', (data) => {
      const msg = data.toString();
      const currPos = gs.get(id)!
      const newPos = handleInput(currPos, msg);
      gs.set(id, newPos);
    })
    newClient.on('close', () => gs.delete(id))
  })
}

const handleInput = (pos: number, key: string) => {
  const step = 5
  const deltas: Record<string, number> = { a: -step, d: +step };
  const delta = deltas[key];
  if (delta === undefined) {
    throw new Error(`Unsupported input: ${key}`);
  }
  return pos + delta;
}

const genId = () => {
  return Math.floor(Math.random() * 1000);
}

const runTick = (gs: Map<number, number>, conns: Array<WebSocket>) => {
  conns.forEach((conn) => {
    const json = Object.fromEntries(gs)
    conn.send(JSON.stringify(json))
  })
}

main();
