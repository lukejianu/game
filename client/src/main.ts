import { ClientGameStateMsg } from "../../common/src/data";
import { connectToServer, drawGameState, processMessages, initPixi, registerKeybinds, deserializeClientGameStateMsg, ClientGameState } from "./app";

const ticksPerSecond = 5;
const timeStepMs = 1000 / ticksPerSecond;

const drawPerSecond = 60; 
const clientDrawMs = 1000 / drawPerSecond; 

const main = async () => {
  const pixi = await initPixi();
  const conn = connectToServer();
  // TODO: Don't initialize this until we receive the first message from the server.
  const gs: ClientGameState = {
    p: 0,
    others: new Map(),
    actionSequence: 0, 
  }
  const msgQueue: Array<ClientGameStateMsg> = new Array();
  registerKeybinds(gs, conn);
  conn.onmessage = (msg) => {
    msgQueue.push(deserializeClientGameStateMsg(msg.data));
  };
  setInterval(() => {
    processMessages(gs, msgQueue);
  }, timeStepMs); 

  setInterval(() => {
    drawGameState(gs, pixi);
  }, clientDrawMs); 
}

main();
