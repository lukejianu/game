import * as PIXI from "pixi.js";

import { Id, Position } from "../../common/src/data";

const CANVAS_WIDTH = 400;
const CIRCLE_RADIUS = 20;
const MY_CIRCLE_COLOR = 'red';
const OTHER_CIRCLE_COLOR = 'blue'; // TODO: Use this.

export type ClientGameState = Map<Id, Position>; // TODO: Use this.

export const connectToServer = (): WebSocket => {
  const gameServerPort = 12345;
  const localUrl = `ws://localhost:${gameServerPort}/ws`;
  const socket = new WebSocket(localUrl);
  socket.onopen = () => console.log("Connected to server");
  socket.onerror = (err) => console.error("WebSocket error:", err);
  return socket;
};

export const initPixi = async (): Promise<PIXI.Application> => {
  const pixi = new PIXI.Application();
  await pixi.init({ background: "grey", width: CANVAS_WIDTH, height: CIRCLE_RADIUS * 2 });
  document.body.appendChild(pixi.canvas);
  return pixi;
};

/**
 * NOTE: If there is more than one message in the queue, then something is
 * wrong. This is because this function is called more often than the server's
 * function that sends messages (new states). Thus, the only way there can be
 * more than one message in the queue is due to a poor network connection. In
 * this case, it's might be good to speed up the tick speed of the client so
 * that it can catch up, as opposed to always taking the most recent new state.
 * For now, the function will use the most recent state and will log if it
 * has more than one.   
 * 
 * NOTE: This function's job is to interpolate entities. Interpolation is
 * necessary to smooth the behavior of other entities, since there is always a
 * gap between receiving states from the server. During time t to t + 1, we
 * simulate what *likely* happened between time t - 1 and t. This means that
 * this function needs to be called many times in the interval [t - 1, t]. It
 * also needs to know where in the interval its being called (how far through).
 */
export const processMessages = (gs: ClientGameState, msgQueue: Array<MessageEvent<any>>) => {
  if (msgQueue.length != 1) {
    console.warn(`Message queue has ${msgQueue.length} elements!`)
  }
  for (const msg of msgQueue) {
    handleMsg(gs, msg)
  }
  msgQueue.length = 0
}

const handleMsg = (gs: ClientGameState, msg: MessageEvent<any>) => {
    const obj = JSON.parse(msg.data)
    gs.clear()
    for (const key in obj) {
      gs.set(parseInt(key, 10), obj[key])
    }
}

export const drawGameState = (gs: ClientGameState, pixi: PIXI.Application) => {
  pixi.stage.removeChildren();
  gs.forEach((pos, _id) => drawCircle(pos, MY_CIRCLE_COLOR, pixi));
}

const drawCircle = (x: number, color: PIXI.FillInput, pixi: PIXI.Application) => {
  const gfx = new PIXI.Graphics();
  gfx.circle(x, CIRCLE_RADIUS, CIRCLE_RADIUS).fill(color);
  pixi.stage.addChild(gfx);
}

export const registerKeybinds = (gs: ClientGameState, socket: WebSocket) => {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (["a", "d"].includes(key)) {
      socket.send(key)
      handleInput(gs, key)
    }
  });
}

export const handleInput = (gs: ClientGameState, key: string) => {
  // TODO: Predict.
}


// TODO: Delete.
export function add(a: number, b: number) {
  return a + b;
}
