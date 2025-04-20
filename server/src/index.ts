import { WebSocket, WebSocketServer } from "ws";
import { Position, GameState } from "../../common/src/data";
import {
  serializeGameState,
  deserializeFromJson,
} from "../../common/src/transport";
import { ECS, Entity, Component, System } from "../../common/src/ecs";

const port = 8080;
const updatesPerSecond = 3;
const timeStepMs = 1000 / updatesPerSecond;
const startState: number = 0;

class PositionComponent extends Component {
  public x: number;

  constructor(x: number) {
    super();
    this.x = x;
  }
}

class InputComponent extends Component {

  constructor(public inputs: [number, string][], public lastAppliedInputSeqId: number) {
    super();
  }
}

class ConnectionComponent extends Component {
  public socket: WebSocket;

  constructor(socket: WebSocket) {
    super();
    this.socket = socket;
  }
}

class MovementSystem extends System {
  public componentsRequired: Set<Function> = new Set([
    PositionComponent,
    InputComponent,
  ]);

  public update(entities: Set<Entity>): void {
    const positions = new Set([...entities].map(e => {
      const cs = this.ecs.getComponents(e);
      const posCom = cs.get(PositionComponent);
      return posCom.x;
    }));
    entities.forEach((e) => {
      const cs = this.ecs.getComponents(e);
      const posCom = cs.get(PositionComponent);
      const inputCom = cs.get(InputComponent);
      const others = positions.difference(new Set([posCom.x]));
      const x = posCom.x;
      const inputs = inputCom.inputs;
      const newX = inputs.reduce((acc, [_seqId, key]) => this.handleInput(acc, key, others), x);
      posCom.x = newX;
      inputCom.inputs = [];
      inputCom.lastAppliedInputSeqId = (inputs.length === 0) ? inputCom.lastAppliedInputSeqId : inputs.pop()![0];
    });
  }

  private handleInput = (
    position: number,
    key: string,
    others: Set<number>,
  ): number => {
    const radius = 20; // TODO: Pull into common.
    const step = 5;
    const deltas: Record<string, number> = { a: -step, d: +step };
  
    const delta = deltas[key];
    if (delta === undefined) {
      throw new Error(`Unsupported input: ${key}`);
    }
  
    const next = position + delta;
    const wouldCollide = Array.from(others)
      .some(other => Math.abs(other - next) < 2 * radius);
    
    return wouldCollide ? position : next;
  };
}

class BroadcastSystem extends System {
  public componentsRequired: Set<Function> = new Set([
    PositionComponent,
    ConnectionComponent,
    InputComponent
  ]);

  public update(entities: Set<Entity>): void {
    const positions: Map<Entity, Position> = new Map(
      [...entities].map((e) => [
        e,
        this.ecs.getComponents(e).get(PositionComponent).x
      ])
    );
    entities.forEach((e) => {
      const cs = this.ecs.getComponents(e);
      const posCom = cs.get(PositionComponent);
      const conCom = cs.get(ConnectionComponent);
      const inputCom = cs.get(InputComponent);
      const gs = this.mkGameState(e, posCom.x, inputCom.lastAppliedInputSeqId, positions);
      conCom.socket.send(serializeGameState(gs));
    });
  }

  private mkGameState = (
    e: Entity,
    p: Position,
    lastSeqId: number,
    m: Map<Entity, Position>
  ): GameState => {
    const mCopy = new Map(m);
    mCopy.delete(e);
    return {
      p: [lastSeqId, p],
      others: mCopy,
    };
  };
}

const main = () => {
  const wss = new WebSocketServer({ port });

  const ecs = new ECS();
  ecs.addSystem(new MovementSystem());
  ecs.addSystem(new BroadcastSystem());
  setInterval(() => ecs.update(), timeStepMs);

  wss.on("connection", (ws: WebSocket) => {
    const newEntity = ecs.addEntity();
    const inputComponent = new InputComponent([], -1);
    ecs.addComponent(newEntity, new PositionComponent(startState));
    ecs.addComponent(newEntity, inputComponent);
    ecs.addComponent(newEntity, new ConnectionComponent(ws));
    ws.on("message", (msg) => {
      inputComponent.inputs.push(deserializeFromJson(msg.toString()));
    });
    ws.on("close", () => {
      ecs.removeEntity(newEntity);
    });
  });
};

main()
