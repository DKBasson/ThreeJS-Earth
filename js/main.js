import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const groundTexture = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/2/2f/Hubble_ultra_deep_field.jpg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(4, 4);

const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);
const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const wallThickness = 1;
const wallHeight = 100;

const wallPositions = [
    { x: 0, y: wallHeight / 2, z: -50 }, // back
    { x: 0, y: wallHeight / 2, z: 50 },  // front
    { x: -50, y: wallHeight / 2, z: 0 }, // left
    { x: 50, y: wallHeight / 2, z: 0 }   // right
];

wallPositions.forEach((pos, index) => {
    const wallGeometry = new CANNON.Box(new CANNON.Vec3(50, wallHeight / 2, wallThickness / 2));
    const wallBody = new CANNON.Body({ mass: 0 });
    wallBody.addShape(wallGeometry);
    wallBody.position.set(pos.x, pos.y, pos.z);
    if (index >= 2) {
        wallBody.quaternion.setFromEuler(0, Math.PI / 2, 0);
    }
    world.addBody(wallBody);
});

const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

const aiBalls = [];

for (let i = 0; i < 10; i++) {
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.position.set(Math.random() * 30 - 15, 5, Math.random() * 30 - 15);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    scene.add(ballMesh);

    const ballShape = new CANNON.Sphere(1);
    const ballBody = new CANNON.Body({ mass: 1 });
    ballBody.addShape(ballShape);
    ballBody.position.copy(ballMesh.position);
    world.addBody(ballBody);

    ballMesh.userData.physicsBody = ballBody;
    aiBalls.push(ballMesh);
}

const mainBallRadius = 1;
const mainBallShape = new CANNON.Sphere(mainBallRadius);
const mainBallBody = new CANNON.Body({ mass: 5 });
mainBallBody.addShape(mainBallShape);
mainBallBody.position.set(0, mainBallRadius + 5, 0);
mainBallBody.linearDamping = 0.1;
mainBallBody.angularDamping = 0.1;
world.addBody(mainBallBody);

const mainBallTexture = new THREE.TextureLoader().load('https://i.sstatic.net/ojwD8.jpg');
const mainBallGeometry = new THREE.SphereGeometry(mainBallRadius, 32, 32);
const mainBallMaterial = new THREE.MeshStandardMaterial({ map: mainBallTexture });
const mainBallMesh = new THREE.Mesh(mainBallGeometry, mainBallMaterial);
mainBallMesh.castShadow = true;
mainBallMesh.receiveShadow = true;
scene.add(mainBallMesh);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 20, 0);
light.castShadow = true;
light.shadow.mapSize.width = 4096;
light.shadow.mapSize.height = 4096;
light.shadow.camera.left = -50;
light.shadow.camera.right = 50;
light.shadow.camera.top = 50;
light.shadow.camera.bottom = -50;
light.shadow.camera.near = 1;
light.shadow.camera.far = 30;

scene.add(light);

const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
scene.add(shadowHelper);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

camera.position.set(0, 10, 20);

const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

let points = 0;
let timeLeft = 30;
let gameStarted = false;

const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.fontSize = '24px';
scoreElement.style.color = 'white';
scoreElement.innerHTML = `Points: ${points}`;
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '40px';
timerElement.style.left = '10px';
timerElement.style.fontSize = '24px';
timerElement.style.color = 'white';
timerElement.innerHTML = `Time left: ${timeLeft}s`;
document.body.appendChild(timerElement);

function checkCollisions() {
    aiBalls.forEach((ballMesh) => {
        const distance = ballMesh.position.distanceTo(mainBallMesh.position);
        if (distance < mainBallRadius * 2) {
            points += 1;
            scoreElement.innerHTML = `Points: ${points}`;

        }
    });
}

function startGame() {
    gameStarted = true;
    points = 0;
    timeLeft = 30;
    scoreElement.innerHTML = `Points: ${points}`;
    timerElement.innerHTML = `Time left: ${timeLeft}s`;

    const timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft -= 1;
            timerElement.innerHTML = `Time left: ${timeLeft}s`;
        } else {
            clearInterval(timerInterval);
            gameStarted = false;
            console.log(`Game Over! Final Score: ${points}`);
            timerElement.innerHTML = `Game Over! Final Score: ${points}`;
        }
    }, 1000);
}

document.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !gameStarted) {
        startGame();
    }
});

function updatePhysics(deltaTime) {
    if (gameStarted) {
        checkCollisions();
    }

    const force = 50;
    const direction = new CANNON.Vec3(0, 0, 0);

    if (keys.w) {
        direction.z -= force;
    }
    if (keys.s) {
        direction.z += force;
    }
    if (keys.a) {
        direction.x -= force;
    }
    if (keys.d) {
        direction.x += force;
    }

    if (direction.lengthSquared() > 0) {
        mainBallBody.applyForce(direction);
    }

    world.step(deltaTime);
    mainBallMesh.position.copy(mainBallBody.position);
    mainBallMesh.quaternion.copy(mainBallBody.quaternion);

    scene.children.forEach((child) => {
        if (child.userData.physicsBody) {
            child.position.copy(child.userData.physicsBody.position);
            child.quaternion.copy(child.userData.physicsBody.quaternion);
        }
    });

    aiBalls.forEach((ballMesh) => {
        const ballBody = ballMesh.userData.physicsBody;
        const directionToMainBall = new THREE.Vector3().subVectors(ballMesh.position, mainBallMesh.position).normalize();
        const distanceToPlayer = ballMesh.position.distanceTo(mainBallMesh.position);
        const force = 20;
        const avoidWallsForce = 50;
        const randomFactor = (Math.random() - 0.5) * 20;

        if (distanceToPlayer < 10) {
            const forceDirection = new CANNON.Vec3(
                directionToMainBall.x * (force + randomFactor),
                0,
                directionToMainBall.z * (force + randomFactor)
            );
            ballBody.applyForce(forceDirection);
        }

        wallPositions.forEach((wallPos) => {
            const wallDistanceThreshold = 10;
            if (Math.abs(ballMesh.position.z - wallPos.z) < wallDistanceThreshold) {
                const avoidDirection = new THREE.Vector3(0, 0, ballMesh.position.z - wallPos.z).normalize();
                const avoidForce = new CANNON.Vec3(avoidDirection.x * avoidWallsForce, 0, avoidDirection.z * avoidWallsForce);
                ballBody.applyForce(avoidForce);
            }
            if (Math.abs(ballMesh.position.x - wallPos.x) < wallDistanceThreshold) {
                const avoidDirection = new THREE.Vector3(ballMesh.position.x - wallPos.x, 0, 0).normalize();
                const avoidForce = new CANNON.Vec3(avoidDirection.x * avoidWallsForce, 0, avoidDirection.z * avoidWallsForce);
                ballBody.applyForce(avoidForce);
            }
        });
    });
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = 1 / 60;
    updatePhysics(deltaTime);

    const offset = new THREE.Vector3(0, 5, 10);
    const cameraPosition = mainBallMesh.position.clone().add(offset);
    camera.position.lerp(cameraPosition, 0.1);
    camera.lookAt(mainBallMesh.position);

    renderer.render(scene, camera);
}

animate();
