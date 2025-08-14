import { connectToServer, drawGameState, handleMsg, initPixi, registerKeybinds } from "./app";

const ticksPerSecond = 5;
const timeStepMs = 1000 / ticksPerSecond;

const main = async () => {
  const pixi = await initPixi();
  const conn = connectToServer();
  registerKeybinds(conn);
  const gameState: Map<string, number> = new Map();
  conn.onmessage = (msg) => {
    handleMsg(gameState, msg);
  };
  setInterval(() => {
    drawGameState(gameState, pixi);
  }, timeStepMs)
}

main();
