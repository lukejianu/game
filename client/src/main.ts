import * as PIXI from 'pixi.js';

const connectToServer = (): WebSocket => {
  const socket = new WebSocket("ws://localhost:8080/ws"); // TODO: Replace.

  socket.onopen = () => console.log("Connected to server");
  socket.onerror = (err) => console.error("WebSocket error:", err);

  return socket;
}

function setupInput(send: (data: string) => void) {
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
      const message = key;
      send(JSON.stringify(message));
    }
  });
}

const app = new PIXI.Application();
app.init({ background: '#1099bb', width: 800, height: 600 })
document.body.appendChild(app.canvas);

type Posn = {
  x: number;
  y: number;
}

type GameState = {
  circles: Posn[];
}

let gameState: GameState = {
  circles: [{x: 50, y: 50}]
}

const circleRadius: number = 25;

app.ticker.add(() => {
  app.stage.removeChildren();
  const graphics = new PIXI.Graphics();
  gameState.circles.forEach(({x, y}) => graphics.circle(x, y, circleRadius))
  app.stage.addChild(graphics);
});

function startGame() {
  const socket = connectToServer();
  setupInput((data) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  });

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    gameState = data;
  };
}

startGame();
