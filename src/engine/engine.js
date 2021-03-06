import utils from './utils';

// canvas initialization
const SCALING_FACTOR = 4;

const _canvas = document.querySelector('#game');
_canvas.style.imageRendering = 'pixelated';
_canvas.width = 300;
_canvas.height = 200;
_canvas.style.width = _canvas.width * SCALING_FACTOR;
_canvas.style.height = _canvas.height * SCALING_FACTOR;
const _ctx = _canvas.getContext('2d');

// global variables
const _settings = {
    pixelsPerMeter: 16,
    tileSize: 1,
    timeSpeed: 1,
    gravity: 20
};

const _entityTypesObj = {};
const _entityList = utils.unorderedList();

const _keyCode = {
    SPACE: 32,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40
};
const _keys = {};

const _timeInfo = {
    deltaTime: 0,
    totalTime: 0,
    prevFrameTime: performance.now()
};

const _camera = {
    x: _canvas.width / 2 / _settings.pixelsPerMeter,
    y: _canvas.height / 2 / _settings.pixelsPerMeter,
    width: _canvas.width / _settings.pixelsPerMeter,
    height: _canvas.height / _settings.pixelsPerMeter
};

// add all keys defined in keyCode to globalKeys object
Object.values(_keyCode).forEach(
    code => (_keys[code] = { isDown: false, wentDown: false, wentUp: false })
);

// start the game
mainGameLoop();

// define api functions
const apiAddEntityType = (mapSymbol, updateFunc, defaultState) =>
    addEntityType(_entityTypesObj, mapSymbol, updateFunc, defaultState);

const apiAddEntity = type => addEntity(_entityTypesObj, _entityList, type);

/**
 * Удаляет сущность из игры
 * @param {object} entity Удаляемая сущность
 */
const apiRemoveEntity = entity => removeEntity(_entityList, entity);

const apiCreateMap = asciiMapRows =>
    createMap(_entityTypesObj, _entityList, _settings, asciiMapRows);

/**
 * Рисует спрайт по координатам заданной сущности
 * @param {object} sprite Спрайт, который будет нарисован на экране
 * @param {object} entity Игровая сущность, по координатам x и y которой будет нарисован спрайт
 * @param {number} animationSpeed Скорость смены кадров спрайта
 * @param {number} scaleX Масштаб по оси x - например, если этот параметр равен -1, то спрайт будет отражен по горизонтали
 * @param {number} scaleY Масштаб по оси y
 */
const apiDrawSprite = (sprite, entity, animationSpeed, scaleX, scaleY) =>
    drawSprite(_ctx, sprite, entity, animationSpeed, scaleX, scaleY);

const apiDrawRect = (x, y, width, height, color) =>
    drawRect(_ctx, x, y, width, height, color);

/**
 * Проверяет, произошло ли столкновение сущности entity с какой-либо другой сущностью
 * @param {object} entity Сущность, которая проверяет столкновение
 * @param {array} otherTypes Список типов сущностей, с которыми будет рассчитываться столкновение
 * @param {number} offsetX Сдвиг по оси Х
 * @param {number} offsetY Сдвиг по оси Y
 * @returns {object} Сущность, с которой произошло столкновение в данный кадр или null
 */
const apiCheckCollision = (entity, otherTypes, offsetX, offsetY) =>
    checkCollision(_entityList, entity, otherTypes, offsetX, offsetY);

/**
 * Передвигает сущность и останавливает ее, если она сталкивается с другими заданными сущностями
 * @param {object} entity Игровая сущность, которая будет передвигаться на entity.speedX и entity.speedY
 * @param {array} otherTypes Список типов сущностей, с которыми будет рассчитываться столкновение
 * @returns {object} Сущности, с которыми произошло столкновение в данный кадр по горизонтали и вертикали
 */
const apiMoveAndCheckForObstacles = (entity, otherTypes) =>
    moveAndCheckForObstacles(_entityList, _timeInfo, entity, otherTypes);

const apiDrawText = (text, x, y, color) => drawText(_ctx, text, x, y, color);

// in user api, all global variables are passed implicitly
export {
    _settings as settings,
    _keyCode as keyCode,
    _keys as keys,
    _timeInfo as time,
    _camera as camera,
    // entities
    apiAddEntityType as addEntityType,
    apiAddEntity as addEntity,
    apiRemoveEntity as removeEntity,
    apiCreateMap as createMap,
    // drawing
    loadSprite,
    apiDrawSprite as drawSprite,
    apiDrawRect as drawRect,
    // audio
    loadSound,
    playSound,
    stopSound,
    // collision
    apiCheckCollision as checkCollision,
    apiMoveAndCheckForObstacles as moveAndCheckForObstacles,
    apiDrawText as drawText
};

// entities
function addEntityType(
    entityTypesObj,
    mapSymbol,
    updateFunc,
    defaultState = {}
) {
    entityTypesObj[mapSymbol] = {
        updateFunc,
        defaultState
    };
    return mapSymbol;
}

function addEntity(entityTypesObj, entityList, type) {
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
        isInitialized: false
    };

    const typeInfo = entityTypesObj[type];
    Object.assign(entity, typeInfo.defaultState); // set object default state as was defined in addEntityType()
    entity.index = entityList.add(entity);

    return entity;
}

function removeEntity(entityList, entity) {
    entityList.remove(entity.index);
}

function createMap(entityTypesObj, entityList, globalSettings, asciiMapRows) {
    for (let y = 0; y < asciiMapRows.length; y++) {
        const row = asciiMapRows[y];
        for (let x = 0; x < row.length; x++) {
            if (entityTypesObj[row[x]]) {
                const e = addEntity(_entityTypesObj, entityList, row[x]);
                e.x = x * globalSettings.tileSize;
                e.y = y * globalSettings.tileSize;
            }
        }
    }
}

// keyboard input

document.onkeydown = function(event) {
    const key = _keys[event.keyCode];
    if (!key) {
        return;
    }
    if (!key.isDown) {
        key.wentDown = true;
        key.isDown = true;
    }
};

document.onkeyup = function(event) {
    const key = _keys[event.keyCode];
    if (!key) {
        return;
    }
    if (key.isDown) {
        key.wentUp = true;
        key.isDown = false;
    }
};

// timing and main game loop

function mainGameLoop() {
    _camera.width = _canvas.width / _settings.pixelsPerMeter;
    _camera.height = _canvas.height / _settings.pixelsPerMeter;

    _ctx.fillStyle = '#444';
    _ctx.fillRect(0, 0, _canvas.width, _canvas.height);

    _ctx.save();
    _ctx.translate(
        -(_camera.x * _settings.pixelsPerMeter - _canvas.width / 2),
        -(_camera.y * _settings.pixelsPerMeter - _canvas.height / 2)
    );

    for (let index = 0; index < _entityList.items.length; index++) {
        const entity = _entityList.items[index];
        if (entity !== utils.unorderedList.REMOVED_ITEM) {
            const typeInfo = _entityTypesObj[entity.type];
            if (typeInfo.updateFunc) {
                typeInfo.updateFunc(entity);
            }
        }
    }

    _ctx.restore();

    // clear keyboard inputs
    Object.values(_keys).forEach(key => {
        key.wentDown = false;
        key.wentUp = false;
    });

    const newTime = performance.now();
    _timeInfo.deltaTime =
        (newTime - _timeInfo.prevFrameTime) * 0.001 * _settings.timeSpeed;
    if (_timeInfo.deltaTime > 0.1) {
        _timeInfo.deltaTime = 0.016;
    }
    _timeInfo.totalTime += _timeInfo.deltaTime;
    _timeInfo.prevFrameTime = newTime;
    requestAnimationFrame(mainGameLoop);
}

// graphics functions
function loadSprite(fileName, offsetX = 0, offsetY = 0, frameCount = 1) {
    const img = new Image();
    img.src = fileName;
    const sprite = {
        bitmap: img,
        width: 0,
        height: 0,
        offsetX,
        offsetY,
        frameCount,
        entityFrameMap: new Map()
    };
    img.onload = () => {
        sprite.width = img.width / frameCount;
        sprite.height = img.height;
    };

    return sprite;
}

function drawSprite(
    ctx,
    sprite,
    entity,
    animationSpeed = 0,
    scaleX = 1,
    scaleY = 1
) {
    // the current frame of the sprite is saved in a map(entity -> currentFrame)
    let savedFrame = sprite.entityFrameMap.get(entity) || 0;

    const currentFrame = Math.floor(savedFrame);
    savedFrame += animationSpeed;
    if (savedFrame >= sprite.frameCount) {
        savedFrame = 0;
    }
    sprite.entityFrameMap.set(entity, savedFrame);

    const factor = _settings.pixelsPerMeter / 16;

    ctx.save();
    ctx.scale(scaleX * factor, scaleY * factor);
    ctx.drawImage(
        sprite.bitmap,
        currentFrame * sprite.width,
        0,
        sprite.width,
        sprite.height,
        entity.x * scaleX * 16 + sprite.offsetX,
        entity.y * scaleY * 16 + sprite.offsetY,
        sprite.width,
        sprite.height
    );
    ctx.restore();
}

function drawRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
        x * _settings.pixelsPerMeter,
        y * _settings.pixelsPerMeter,
        width * _settings.pixelsPerMeter,
        height * _settings.pixelsPerMeter
    );
}

// audio functions

function loadSound(fileName) {
    const sound = new Audio(fileName);
    sound.volume = 0.02;
    return sound;
}

/**
 * Проигрывает звук
 * @param {object} sound Звук
 * @param {bool} loop Зацикливание звука
 * @param {number} volume Громкость
 */
function playSound(sound, loop = false, volume = 0.02) {
    sound.currentTime = 0;
    sound.pause();
    sound.loop = loop;
    sound.volume = volume;
    sound.play();
}

/**
 * Останавливает проигрывание звука
 * @param {object} sound Звук
 */
function stopSound(sound) {
    sound.currentTime = 0;
    sound.pause();
}

// collision functions

function checkCollision(
    entityList,
    entity,
    otherEntityTypes,
    offsetX = 0,
    offsetY = 0
) {
    for (let other of entityList.items) {
        if (other !== utils.unorderedList.REMOVED_ITEM && entity !== other) {
            if (!otherEntityTypes.includes(other.type)) {
                continue;
            }
            const eLeft = entity.x + offsetX + entity.bbox.left;
            const eTop = entity.y + offsetY + entity.bbox.top;
            const eRight = eLeft + entity.bbox.width;
            const eBottom = eTop + entity.bbox.height;

            const oLeft = other.x + other.bbox.left;
            const oTop = other.y + other.bbox.top;
            const oRight = oLeft + other.bbox.width;
            const oBottom = oTop + other.bbox.height;

            const eps = 0.000001;

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

function moveAndCheckForObstacles(entityList, time, entity, otherTypes) {
    const horizWall = checkCollision(
        entityList,
        entity,
        otherTypes,
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
        _entityList,
        entity,
        otherTypes,
        entity.speedX * time.deltaTime,
        entity.speedY * time.deltaTime
    );
    if (vertWall) {
        if (entity.speedY > 0) {
            entity.y =
                vertWall.y +
                vertWall.bbox.top -
                entity.bbox.top -
                entity.bbox.height;
            entity.speedY = 0;
        } else {
            entity.y =
                vertWall.y +
                vertWall.bbox.top +
                vertWall.bbox.height -
                entity.bbox.top;
            entity.speedY *= -0.5;
        }
    }

    entity.x += entity.speedX * time.deltaTime;
    entity.y += entity.speedY * time.deltaTime;

    return { horizWall, vertWall };
}

function drawText(ctx, text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = '50px Visitor';
    ctx.fillText(
        text,
        (x + _camera.x) * _settings.pixelsPerMeter,
        (y + _camera.y) * _settings.pixelsPerMeter
    );
}
