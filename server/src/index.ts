import { WebSocketServer, WebSocket } from "ws";
import { retrieveCookie, genId } from "../utils"; 
import { setPlayerCookie } from "../db/playerStore"

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
  connectionHandler(wss, gs, conns); 
}

const connectionHandler = (wss: WebSocketServer, gs: Map<number, number>, conns: Array<WebSocket>) => {
  wss.on('connection', (newClient: WebSocket, req: any) => {
    const cookie = retrieveCookie(req.headers.cookie); 
    // put the cookie in the DB along with the id 
    setPlayerCookie(cookie); 

    const id = genId(); // replace this with a username from the user. 
    registerDataHandler(newClient, gs, id); 
    conns.push(newClient)
    gs.set(id, spawnPoint)
    newClient.on('close', () => gs.delete(id))
  })
}

const registerDataHandler = (client: WebSocket, gs: Map<number, number>, id: number) => {
  client.on('message', (data) => { 
    // should case on the data. Is it a move message? chat message? etc... 
    const msg = data.toString();
    const currPos = gs.get(id)!
    const newPos = handleInput(currPos, msg);
    gs.set(id, newPos);
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


const runTick = (gs: Map<number, number>, conns: Array<WebSocket>) => {
  conns.forEach((conn) => {
    const json = Object.fromEntries(gs)
    conn.send(JSON.stringify(json))
  })
}

main();
