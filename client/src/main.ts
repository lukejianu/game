import { connectToServer, drawGameState, processMessages, initPixi, registerKeybinds, ClientGameState } from "./app";

const ticksPerSecond = 5;
const timeStepMs = 1000 / ticksPerSecond;

const main = async () => {
  const pixi = await initPixi();
  const conn = connectToServer();
  const gs: ClientGameState = new Map();
  const msgQueue: Array<MessageEvent<any>> = new Array();
  registerKeybinds(gs, conn);
  conn.onmessage = (msg) => {
    msgQueue.push(msg);
  };
  setInterval(() => {
    processMessages(gs, msgQueue);
    drawGameState(gs, pixi);
  }, timeStepMs)
}

main();
