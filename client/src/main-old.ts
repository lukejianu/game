import * as PIXI from "pixi.js";

import { GameState } from "../../common/src/data";
import { deserializeGameState, serializeToJson } from "../../common/src/transport";

const gameServerPort = 8080;
let gameState: GameState | undefined = undefined;

const main = async () => {
  const conn = connectToServer();
  await setupGraphics();
  registerKeyListeners(conn);
  conn.onmessage = (msg) => {
    const newState: GameState = deserializeGameState(msg.data);
    gameState = newState;
  };
};

const connectToServer = (): WebSocket => {
  const socket = new WebSocket(`ws://localhost:${gameServerPort}/ws`);
  socket.onopen = () => console.log("Connected to server");
  socket.onerror = (err) => console.error("WebSocket error:", err);
  return socket;
};

const registerKeyListeners = (conn: WebSocket): void => {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (["a", "d"].includes(key)) {
      conn.send(serializeToJson(key));
    }
  });
};

const setupGraphics = async (): Promise<void> => {
  const circleRadius: number = 20;

  const app = new PIXI.Application();
  await app.init({ background: 'grey', width: 400, height: circleRadius * 2 });
  document.body.appendChild(app.canvas);

  const y = 20;

  app.ticker.add(() => {
    app.stage.removeChildren();
    if (gameState) {
      const graphics = new PIXI.Graphics();
      graphics.circle(gameState.p, y, circleRadius).fill( {color: 'blue'} )
      gameState.others.forEach((x, _id) =>
        graphics.circle(x, y, circleRadius).fill( {color: 'red'} )
      );
      app.stage.addChild(graphics);
    }
  });
};

await main();
