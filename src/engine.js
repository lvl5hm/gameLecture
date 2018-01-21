import utils from './utils';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.width = 1280;
canvas.height = 760;

const entities = utils.unorderedList();

const settings = {
  pixelsPerMeter: 48,
  tileSize: 1,
  timeSpeed: 1,
  gravity: 20
};

const time = {
  deltaTime: 0,
  totalTime: 0
};

window.settings = settings;

function addEntity(type) {
  const entity = {
    x: 0,
    y: 0,
    bbox: {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    },
    speedX: 0,
    speedY: 0,

    type,
    index: 0,
    collisionIndex: 0
  };

  const typeInfo = entityTypes[type];
  Object.assign(entity, typeInfo.defaultState);

  const index = entities.add(entity);
  entity.index = index;

  const collisionIndex = typeInfo.collisionList.add(entity);
  entity.collisionIndex = collisionIndex;

  return entity;
}

function destroyEntity(entity) {
  entities.remove(entity.index);

  const typeInfo = entityTypes[entity.type];
  typeInfo.collisionList.remove(entity.collisionIndex);
}

const keyCode = {
  SPACE: 32,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40
};

const keys = {};

Object.values(keyCode).forEach(
  code => (keys[code] = { isDown: false, wentDown: false, wentUp: false })
);

document.onkeydown = function (event) {
  const key = keys[event.keyCode];
  if (!key) {
    return;
  }
  if (!key.isDown) {
    key.wentDown = true;
    key.isDown = true;
  }
};

document.onkeyup = function (event) {
  const key = keys[event.keyCode];
  if (!key) {
    return;
  }
  if (key.isDown) {
    key.wentUp = true;
    key.isDown = false;
  }
};

const entityTypes = [];
const dictSymbolToEntityType = {};

function addEntityType(mapSymbol, updateFunc, defaultState = {}) {
  const type = entityTypes.length;
  entityTypes.push({
    updateFunc,
    collisionList: utils.unorderedList(),
    defaultState
  });
  dictSymbolToEntityType[mapSymbol] = type;
  return type;
}

let prevTime = performance.now();

const camera = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

function updateGame() {
  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cameraWidth = canvas.width / settings.pixelsPerMeter;
  const cameraHeight = canvas.height / settings.pixelsPerMeter;

  ctx.save();
  ctx.translate(
    -Math.floor((camera.x - cameraWidth / 2) * settings.pixelsPerMeter),
    -Math.floor((camera.y - cameraHeight / 2) * settings.pixelsPerMeter)
  );

  for (let index = 0; index < entities.items.length; index++) {
    const entity = entities.items[index];
    if (entity !== utils.unorderedList.REMOVED_ITEM) {
      const typeInfo = entityTypes[entity.type];
      if (typeInfo.updateFunc) {
        typeInfo.updateFunc(entity);
      }
    }
  }

  ctx.restore();

  // clear keyboard inputs
  Object.values(keys).forEach(key => {
    key.wentDown = false;
    key.wentUp = false;
  });

  const newTime = performance.now();
  time.deltaTime = (newTime - prevTime) * 0.001 * settings.timeSpeed;
  if (time.deltaTime > 0.1) {
    time.deltaTime = 0.016;
  }
  time.totalTime += time.deltaTime;
  prevTime = newTime;
  requestAnimationFrame(updateGame);
}

function drawRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    x * settings.pixelsPerMeter,
    y * settings.pixelsPerMeter,
    width * settings.pixelsPerMeter,
    height * settings.pixelsPerMeter
  );
}

function createMap(asciiMapRows) {
  for (let y = 0; y < asciiMapRows.length; y++) {
    const row = asciiMapRows[y];
    for (let x = 0; x < row.length; x++) {
      const entityType = dictSymbolToEntityType[row[x]];
      if (entityType !== undefined) {
        const e = addEntity(entityType);
        e.x = x * settings.tileSize;
        e.y = y * settings.tileSize;
      }
    }
  }
}

function checkCollision(entity, otherEntityType, offsetX = 0, offsetY = 0) {
  const typeInfo = entityTypes[otherEntityType];
  for (let other of typeInfo.collisionList.items) {
    if (other !== utils.unorderedList.REMOVED_ITEM && entity !== other) {
      const eLeft = entity.x + offsetX + entity.bbox.left;
      const eTop = entity.y + offsetY + entity.bbox.top;
      const eRight = eLeft + entity.bbox.width;
      const eBottom = eTop + entity.bbox.height;

      const oLeft = other.x + other.bbox.left;
      const oTop = other.y + other.bbox.top;
      const oRight = oLeft + other.bbox.width;
      const oBottom = oTop + other.bbox.height;

      const eps = 0.0001;

      if (
        eLeft >= oRight - eps ||
        eRight <= oLeft + eps ||
        eTop >= oBottom - eps ||
        eBottom <= oTop + eps
      ) {
        continue;
      }

      return other;
    }
  }
  return null;
}

function moveAndCheckForObstacles(entity, obstacleEntityType) {
  const horizWall = checkCollision(
    entity,
    obstacleEntityType,
    entity.speedX * time.deltaTime,
    0
  );
  if (horizWall) {
    if (entity.speedX > 0) {
      entity.x =
        horizWall.x +
        horizWall.bbox.left -
        entity.bbox.left -
        entity.bbox.width;
    } else {
      entity.x =
        horizWall.x +
        horizWall.bbox.left +
        horizWall.bbox.width -
        entity.bbox.left;
    }
    entity.speedX = 0;
  }

  const vertWall = checkCollision(
    entity,
    obstacleEntityType,
    entity.speedX * time.deltaTime,
    entity.speedY * time.deltaTime
  );
  if (vertWall) {
    if (entity.speedY > 0) {
      entity.y =
        vertWall.y + vertWall.bbox.top - entity.bbox.top - entity.bbox.height;
      entity.speedY = 0;
    } else {
      entity.y =
        vertWall.y + vertWall.bbox.top + vertWall.bbox.height - entity.bbox.top;
      entity.speedY *= -0.5;
    }
  }

  entity.x += entity.speedX * time.deltaTime;
  entity.y += entity.speedY * time.deltaTime;

  return { horizWall, vertWall };
}

function loadSprite(fileName, offsetX = 0, offsetY = 0, frameCount = 1) {
  const img = new Image();
  img.src = fileName;
  const sprite = {
    bitmap: img,
    width: 0,
    height: 0,
    frame: 0,
    offsetX,
    offsetY,
    frameCount
  };
  img.onload = () => {
    sprite.width = img.width / frameCount;
    sprite.height = img.height;
  };

  return sprite;
}

function drawSprite(sprite, x, y, speed = 0, scaleX = 1, scaleY = 1) {
  const currentFrame = Math.floor(sprite.frame);
  sprite.frame += speed;
  if (sprite.frame >= sprite.frameCount) {
    sprite.frame = 0;
  }

  ctx.save();
  ctx.scale(scaleX * settings.pixelsPerMeter / 16, scaleY * settings.pixelsPerMeter / 16);
  ctx.drawImage(
    sprite.bitmap,
    currentFrame * sprite.width,
    0,
    sprite.width,
    sprite.bitmap.height,
    x * scaleX * 16 + sprite.offsetX,
    y * scaleY * 16 + sprite.offsetY,
    sprite.width,
    sprite.height
  );
  ctx.restore();
}

updateGame();

export default {
  addEntityType,
  keys,
  keyCode,
  destroyEntity,
  addEntity,
  createMap,
  settings,
  moveAndCheckForObstacles,
  checkCollision,
  loadSprite,
  drawSprite,
  time,
  camera,
};