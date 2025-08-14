import { WebSocketServer, WebSocket } from "ws";
import { initServer, runTick } from "./app";
import { Id, Position } from "../../common/src/data";

const ticksPerSecond = 5;
const timeStepMs = 1000 / ticksPerSecond;
const port = 12345

const main = () => {
  const wss = new WebSocketServer({ port });
  const gs: Map<Id, Position> = new Map()
  const conns: Map<Id, WebSocket> = new Map()
  initServer(wss, gs, conns);
  setInterval(() => runTick(gs, conns), timeStepMs)
}

main();
