import { WebSocketServer, WebSocket } from "ws";
import { PlayerState, initServer, runTick } from "./app";
import { Id, Position } from "../../common/src/data";

const ticksPerSecond = 1;
const timeStepMs = 1000 / ticksPerSecond;
const port = 12345; 

const main = () => {
  const wss = new WebSocketServer({ port });
  const gs: Map<Id, PlayerState> = new Map()
  const conns: Map<Id, WebSocket> = new Map()
  initServer(wss, gs, conns);
  setInterval(() => runTick(gs, conns), timeStepMs); 
}

main();
