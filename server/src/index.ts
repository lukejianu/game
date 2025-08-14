import { WebSocketServer, WebSocket } from "ws";
import { initServer, runTick } from "./app";

const ticksPerSecond = 5;
const timeStepMs = 1000 / ticksPerSecond;
const port = 12345

const main = () => {
  const wss = new WebSocketServer({ port });
  const gs: Map<number, number> = new Map()
  const conns: Array<WebSocket> = new Array()
  initServer(wss, gs, conns);
  setInterval(() => runTick(gs, conns), timeStepMs)
}

main();
