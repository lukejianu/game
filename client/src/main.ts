import * as PIXI from "pixi.js";

const CANVAS_WIDTH = 400;
const CIRCLE_RADIUS = 20;
const MY_CIRCLE_COLOR = 'red';
const OTHER_CIRCLE_COLOR = 'blue'; // TODO: Use this.

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

const connectToServer = (): WebSocket => {
  const gameServerPort = 12345;
  const localUrl = `ws://localhost:${gameServerPort}/ws`;
  const socket = new WebSocket(localUrl);
  socket.onopen = () => console.log("Connected to server");
  socket.onerror = (err) => console.error("WebSocket error:", err);
  return socket;
};

const initPixi = async (): Promise<PIXI.Application> => {
  const pixi = new PIXI.Application();
  await pixi.init({ background: "grey", width: CANVAS_WIDTH, height: CIRCLE_RADIUS * 2 });
  document.body.appendChild(pixi.canvas);
  return pixi;
};

const handleMsg = (gameState: Map<string, number>, msg: MessageEvent<any>) => {
    const obj = JSON.parse(msg.data)
    gameState.clear()
    for (const key in obj) {
      gameState.set(key, obj[key])
    }
}

const drawGameState = (gs: Map<string, number>, pixi: PIXI.Application) => {
  pixi.stage.removeChildren();
  gs.forEach((pos, _id) => drawCircle(pos, MY_CIRCLE_COLOR, pixi));
}

const drawCircle = (x: number, color: PIXI.FillInput, pixi: PIXI.Application) => {
  const gfx = new PIXI.Graphics();
  gfx.circle(x, CIRCLE_RADIUS, CIRCLE_RADIUS).fill(color);
  pixi.stage.addChild(gfx);
}

const registerKeybinds = (socket: WebSocket) => {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (["a", "d"].includes(key)) {
      socket.send(key)
    }
  });
}

main();
