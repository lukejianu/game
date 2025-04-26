import * as PIXI from "pixi.js";

import { GameState } from "../../common/src/data";
import {
  deserializeGameState,
  serializeToJson,
} from "../../common/src/transport";
import {
  ECS,
  Entity,
  Component,
  System,
  ComponentContainer,
} from "../../common/src/ecs";

const updatesPerSecond = 60;
const timeStepMs = 1000 / updatesPerSecond;

class PositionComponent extends Component {
  constructor(public x: number) {
    super();
  }
}

class ServerIdComponent extends Component {
  constructor(public id: number) {
    super();
  }
}

class ClientInputComponent extends Component {
  constructor(public keys: [number, string][]) {
    super();
  }
}

class ServerStateComponent extends Component {
  constructor(public lastX: number | undefined, public lastXUpdateTs: number | undefined, public newX: number, public newXUpdateTs: number) {
    super();
  }
}

class RemoteMovementSystem extends System {
  public componentsRequired: Set<Function> = new Set([ServerStateComponent]);

  public update(entities: Set<Entity>): void {
    entities.forEach((e) => {
      const coms = this.ecs.getComponents(e);
      const posCom = coms.get(PositionComponent);
      const serverInputCom = coms.get(ServerStateComponent);
      if (!posCom) {
        this.ecs.addComponent(e, new PositionComponent(serverInputCom.newX));
      } else if (coms.get(ClientInputComponent)) {
        // TODO: Reconcile.
      } else if (!serverInputCom.lastX) {
        posCom.x = serverInputCom.newX;
      } else {
        // This is probably a horrible failure of Elementary School Physics. 
        const now = Date.now();
        const gap = serverInputCom.newXUpdateTs - serverInputCom.lastXUpdateTs!;
        const dt = now - serverInputCom.newXUpdateTs!;
        const dx = (serverInputCom.newX - serverInputCom.lastX);
        if (gap === 0 || dx === 0) {
          posCom.x = serverInputCom.newX;
        } else {
          const progThroughGap = dt / gap;
          const x = serverInputCom.lastX + (dx * progThroughGap);
          posCom.x = x;
        }
      }
    });
  }
}

class LocalMovementSystem extends System {
  public componentsRequired: Set<Function> = new Set([PositionComponent, ClientInputComponent]);

  public update(entities: Set<Entity>): void {
    entities.forEach((e) => {
      const coms = this.ecs.getComponents(e);
      const posCom = coms.get(PositionComponent);
      const clientInputCom = coms.get(ClientInputComponent);
      const newX = clientInputCom.keys.reduce((acc, [_, key]) => acc + this.keyToMove(key), posCom.x)
      posCom.x = newX;
    });
  }

  private keyToMove(key: string): number {
    // TODO: Eventually, use the server's logic for this (share).
    const step = 5; // TODO: Don't dupe constants.
    if (key === 'd') {
      return step;
    } else {
      return -step;
    }
  }
}

class LocalInputSystem extends System {
  public componentsRequired = new Set([]);
  private nextInputSeqNum: number = 0

  constructor(clientInputCom: ClientInputComponent) {
    super();
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (["a", "d"].includes(key)) {
        clientInputCom.keys.push([this.nextInputSeqNum, key]);
        this.nextInputSeqNum++;
      }
    });
  }

  public update(_entities: Set<Entity>): void {}
}

class NetworkReceiveSystem extends System {
  public componentsRequired = new Set([ServerIdComponent]);
  private gsBuf: GameState[] = [];

  constructor(private localEntityId: Entity, conn: WebSocket) {
    super();
    conn.onmessage = (msg) => {
      const newState: GameState = deserializeGameState(msg.data);
      this.gsBuf.push(newState);
    };
  }

  public update(_entities: Set<Entity>): void {
    const serverStateCom = this.ecs
      .getComponents(this.localEntityId)
      .get(ServerStateComponent);
    const serverEntities = _entities;
    const ts = Date.now();
    this.gsBuf.forEach((gs) => {
      // Update local player.
      if (!serverStateCom) {
        this.ecs.addComponent(
          this.localEntityId,
          new ServerStateComponent(undefined, undefined, gs.p[1], ts)
        );
      } else {
        serverStateCom.lastX = serverStateCom.newX;
        serverStateCom.lastXUpdateTs = serverStateCom.newXUpdateTs;
        serverStateCom.newX = gs.p[1];
        serverStateCom.newXUpdateTs = ts;
      }

      // Update remote players.
      gs.others.forEach((x, serverId) => {
        const isNewNew = this.findEntityId(serverId, serverEntities) === -1;
        if (isNewNew) {
          const newEntity = this.createNewRemotePlayer(x, serverId, ts);
          serverEntities.add(newEntity);
        } else {
          const e = this.findEntityId(serverId, serverEntities);
          const serverStateCom = this.ecs
            .getComponents(e)
            .get(ServerStateComponent);
          serverStateCom.lastX = serverStateCom.newX;
          serverStateCom.lastXUpdateTs = serverStateCom.newXUpdateTs;
          serverStateCom.newX = x;
          serverStateCom.newXUpdateTs = ts;
        }
      });
    });

    // Remove dead ids.
    const mostRecentGs = this.gsBuf.pop();
    if (mostRecentGs) {
      const deads = this.computeDeadEntities(
        this.localEntityId,
        mostRecentGs,
        serverEntities
      );
      deads.forEach((e) => {
        this.ecs.removeEntity(e);
      });
    }

    this.gsBuf = [];
  }

  private createNewRemotePlayer(x: number, serverId: number, ts: number): Entity {
    const entityId = this.ecs.addEntity();
    this.ecs.addComponent(entityId, new ServerStateComponent(undefined, undefined, x, ts));
    this.ecs.addComponent(entityId, new ServerIdComponent(serverId));
    return entityId;
  }

  private findEntityId(serverId: number, entities: Set<Entity>): Entity {
    for (let e of entities) {
      const id = this.ecs.getComponents(e).get(ServerIdComponent).id;
      if (id === serverId) {
        return e;
      }
    }
    return -1;
  }

  private computeDeadEntities(
    localEntityId: Entity,
    lastGs: GameState,
    entities: Set<Entity>
  ): Set<Entity> {
    entities.delete(localEntityId);
    lastGs.others.forEach((_v, serverId) => {
      const e = this.findEntityId(serverId, entities);
      entities.delete(e);
    });
    return entities;
  }
}

class NetworkSendSystem extends System {
  public componentsRequired: Set<Function> = new Set([ClientInputComponent]);

  constructor(private conn: WebSocket) {
    super();
  }

  public update(entities: Set<Entity>): void {
    entities.forEach((e) => {
      const clientInputCom = this.ecs
        .getComponents(e)
        .get(ClientInputComponent);
      clientInputCom.keys.forEach((key) => {
        this.conn.send(serializeToJson(key));
      });
      clientInputCom.keys = [];
    });
  }
}

class RenderSystem extends System {
  public componentsRequired = new Set([PositionComponent]);

  constructor(
    private app: PIXI.Application,
    private y: number,
    private circleRadius: number
  ) {
    super();
  }

  public update(entities: Set<Entity>): void {
    this.app.stage.removeChildren();
    const gfx = new PIXI.Graphics();
    entities.forEach((eid) => {
      const cmps = this.ecs.getComponents(eid);
      const x = cmps.get(PositionComponent).x;
      const color = this.chooseColor(cmps);
      this.drawCircle(gfx, x, color);
    });
    this.app.stage.addChild(gfx);
  }

  private chooseColor(cmps: ComponentContainer): PIXI.ColorSource {
    if (cmps.has(ServerIdComponent)) {
      return "blue";
    } else {
      return "red";
    }
  }

  private drawCircle(
    gfx: PIXI.Graphics,
    x: number,
    color: PIXI.ColorSource
  ): void {
    gfx.circle(x, this.y, this.circleRadius).fill({ color });
  }
}

const main = async () => {
  const conn = connectToServer();

  const ecs = new ECS();

  const id = ecs.addEntity();

  const clientInputCom = new ClientInputComponent([]);
  ecs.addComponent(id, clientInputCom);

  ecs.addSystem(await createRenderSystem());
  ecs.addSystem(new LocalInputSystem(clientInputCom));
  ecs.addSystem(new LocalMovementSystem());
  ecs.addSystem(new NetworkSendSystem(conn));
  ecs.addSystem(new NetworkReceiveSystem(id, conn));
  ecs.addSystem(new RemoteMovementSystem());

  setInterval(() => ecs.update(), timeStepMs);
};

const connectToServer = (): WebSocket => {
  const gameServerPort = 8080;
  const socket = new WebSocket(`ws://localhost:${gameServerPort}/ws`);
  socket.onopen = () => console.log("Connected to server");
  socket.onerror = (err) => console.error("WebSocket error:", err);
  return socket;
};

const createRenderSystem = async (): Promise<RenderSystem> => {
  const circleRadius: number = 20;
  const y: number = 20;

  const app = new PIXI.Application();
  await app.init({ background: "grey", width: 400, height: circleRadius * 2 });
  document.body.appendChild(app.canvas);

  return new RenderSystem(app, y, circleRadius);
};

await main();
