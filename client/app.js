const app = new PIXI.Application(800, 600, { backgroundColor: 0x1099bb });
document.body.appendChild(app.view);

const socket = io();

const users = {};
const historySize = 20;
const ropeSize = 100;

app.ticker.add(onUpdate);

socket.on('cursor-movement', (user) => {
    users[user.userID].x = user.x;
    users[user.userID].y = user.y;
});

socket.on('new-user-connected', (user) => {
    initUser(user.userID);
});

socket.on('connected-users', (users) => {
    Object.keys(users).forEach((id) => {
        initUser(id);
    });
});

socket.on('disconnect', (user) => {
    onDisconnect(user);
});

function initUser(userID) {
    const newUser = createUser();

    users[userID] = newUser;
    app.stage.addChild(newUser.rope);
}

function createUser() {
    const points = createPoints();
    const history = crateRopeHistory();
    const rope = createRope(points);
    const user = {
        historyX: history.historyX,
        historyY: history.historyY,
        points: points,
        rope: rope,
        x: 0,
        y: 0
    };

    return user;
}

function onDisconnect(userID) {
    if (users[userID]) {
        console.log('User disconnected', userID);
        app.stage.removeChild(users[userID].rope);

        delete users[userID];
    }
}


function createPoints() {
    const points = [];
    for (let i = 0; i < ropeSize; i++) {
        points.push(new PIXI.Point(0, 0));
    }

    return points;
}

function crateRopeHistory() {
    const historyX = [];
    const historyY = [];
    for (let i = 0; i < historySize; i++) {
        historyX.push(0);
        historyY.push(0);
    }

    return { historyX, historyY };
}

function createRope(points) {
    const trailTexture = PIXI.Texture.fromImage('resources/images/trail.png');

    trailTexture.tint = Math.random() * 0xFFFFFF;

    //Create the rope
    const rope = new PIXI.mesh.Rope(trailTexture, points);

    //Set the blendmode
    rope.blendmode = PIXI.BLEND_MODES.ADD;

    return rope;
}

function onUpdate() {

    if (users[socket.id] && users[socket.id].rope) {
        let mousePosition = app.renderer.plugins.interaction.mouse.global;
        users[socket.id].x = mousePosition.x;
        users[socket.id].y = mousePosition.y;

        socket.emit('cursor-movement', mousePosition);
    }

    Object.keys(users).forEach((userID) => {
        updatePoints(users[userID]);
    });
}

function updatePoints(user) {

    user.historyX.pop();
    user.historyX.unshift(user.x);
    user.historyY.pop();
    user.historyY.unshift(user.y);

    for (let i = 0; i < ropeSize; i++) {
        let p = user.points[i];

        //Smooth the curve with cubic interpolation to prevent sharp edges.
        let ix = cubicInterpolation(user.historyX, i / ropeSize * historySize);
        let iy = cubicInterpolation(user.historyY, i / ropeSize * historySize);

        p.x = ix;
        p.y = iy;
    }
}

/**
 * Cubic interpolation based on https://github.com/osuushi/Smooth.js
 * @param	k
 * @return
 */
function clipInput(k, arr) {
    if (k < 0) k = 0;
    if (k > arr.length - 1) k = arr.length - 1;

    return arr[k];
}

function getTangent(k, factor, array) {
    return factor * (clipInput(k + 1, array) - clipInput(k - 1, array)) / 2;
}

function cubicInterpolation(array, t, tangentFactor) {
    if (tangentFactor == null) tangentFactor = 1;

    let k = Math.floor(t);
    let m = [getTangent(k, tangentFactor, array), getTangent(k + 1, tangentFactor, array)];
    let p = [clipInput(k, array), clipInput(k + 1, array)];
    t -= k;
    let t2 = t * t;
    let t3 = t * t2;
    return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
}