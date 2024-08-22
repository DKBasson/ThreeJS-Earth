import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const groundTexture = new THREE.TextureLoader().load('assets/images/universe.jpg');
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
const wallHeight = 10;

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
}

const mainBallRadius = 1;
const mainBallShape = new CANNON.Sphere(mainBallRadius);
const mainBallBody = new CANNON.Body({ mass: 5 });
mainBallBody.addShape(mainBallShape);
mainBallBody.position.set(0, mainBallRadius + 5, 0);
mainBallBody.linearDamping = 0.1;
mainBallBody.angularDamping = 0.1;
world.addBody(mainBallBody);

const mainBallTexture = new THREE.TextureLoader().load('assets/images/earth.jpg');
const mainBallGeometry = new THREE.SphereGeometry(mainBallRadius, 32, 32);
const mainBallMaterial = new THREE.MeshStandardMaterial({ map: mainBallTexture });
const mainBallMesh = new THREE.Mesh(mainBallGeometry, mainBallMaterial);
mainBallMesh.castShadow = true;
mainBallMesh.receiveShadow = true;
scene.add(mainBallMesh);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 4096;
light.shadow.mapSize.height = 4096;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

camera.position.set(0, 10, 20);
controls.target = mainBallMesh.position;

const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

function updatePhysics(deltaTime) {
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
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = 1 / 60;
    updatePhysics(deltaTime);

    const offset = new THREE.Vector3(0, 5, 10);
    const cameraPosition = mainBallMesh.position.clone().add(offset);
    camera.position.lerp(cameraPosition, 0.1);
    camera.lookAt(mainBallMesh.position);
    controls.update();

    renderer.render(scene, camera);
}

animate();
