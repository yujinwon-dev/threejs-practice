import * as THREE from "three";
import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import { gsap } from "../node_modules/gsap/index.js";

// 1. 화면 만들기
const scene = new THREE.Scene();
// 2. 화면을 보려면 카메라 필요 -> 카메라 만들기
// 카메라 종류가 많은데 가장 일반적인 게 perspective camera
// 4개의 인자를 받음
// fov — 카메라 절두체 수직 시야.
// aspect — 카메라 절두체 종횡비.
// near — 카메라 절두체 근평면.
// far — 카메라 절두체 원평면.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// 3. 렌더러 생성 (캔버스의 모든 그래픽을 렌더링하는 데에 사용)
const renderer = new THREE.WebGLRenderer();
// 기본적으로 윈도우 사이즈여야 함
renderer.setSize(window.innerWidth, window.innerHeight);
// 렌더링된 DOM 요소가 캔버스 제공 -> 해당 캔버스를 body에 추가
document.body.appendChild(renderer.domElement);

// 배경색 설정 (두번째 인자는 투명도)
renderer.setClearColor(0xb7c3f3, 1);

const light = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(light);

// global variables
const start_position = 3;
const end_position = -start_position;
const text = document.querySelector(".text");
const TIME_LIMIT = 10;
let gameStat = "loading";
let isLookingBackward = true;

function createCube(size, positionX, rotY = 0, color = 0xfbc851) {
  // 4. 다양한 geometry가 존재 -> 그 중 상자 geometry를 사용
  const geometry = new THREE.BoxGeometry(size.w, size.h, size.d);
  // 5. geometry를 material로 감쌈
  const material = new THREE.MeshBasicMaterial({ color });
  // 6. geometry + material -> mesh 생성
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = positionX;
  cube.rotation.y = rotY;
  // 7. scene에 큐브를 추가
  scene.add(cube);
  return cube;
}

// 장면이 카메라에서 얼마나 떨어져있어야 하는지 지정
camera.position.z = 5;

const loader = new GLTFLoader();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Doll {
  constructor() {
    // 리소스의 URL과 콜백함수 작성
    loader.load("../models/scene.gltf", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.2, 0.2, 0.2);
      gltf.scene.position.set(0, -1, 0);
      this.doll = gltf.scene;
    });
  }

  lookBackward() {
    // this.doll.rotation.y = -3.15;
    // 스르륵 도는 효과를 위해 라이브러리 사용
    // 1초 동안 지속
    gsap.to(this.doll.rotation, { y: -3.15, duration: 0.45 });
    setTimeout(() => (isLookingBackward = true), 150);
  }

  lookForward() {
    // this.doll.rotation.y = 0;
    gsap.to(this.doll.rotation, { y: 0, duration: 0.45 });
    setTimeout(() => (isLookingBackward = false), 450);
  }

  // 뒤돌았다 앞으로 돌았다
  async start() {
    this.lookBackward();
    await delay(Math.random() * 1000 + 1000);
    this.lookForward();
    await delay(Math.random() * 750 + 750);
    this.start();
  }
}

function createTrack() {
  createCube({ w: 0.2, h: 1.5, d: 1.5 }, start_position, -0.35);
  createCube({ w: 0.2, h: 1.5, d: 1.5 }, end_position, 0.35);
  createCube(
    { w: start_position * 2 + 0.2, h: 1.5, d: 1.5 },
    0,
    0,
    0xe5a716
  ).position.z = -1;
}

createTrack();

class Player {
  constructor() {
    const geometry = new THREE.SphereGeometry(0.2, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.z = 1;
    sphere.position.x = start_position;
    scene.add(sphere);
    this.player = sphere;
    this.playerInfo = {
      positionX: start_position,
      velocity: 0,
    };
  }

  run() {
    this.playerInfo.velocity = 0.03;
  }

  stop() {
    // this.playerInfo.velocity = 0;
    // 멈추는 데에 애니메이션을 줘서 게임을 어렵게 만듦
    gsap.to(this.playerInfo, { velocity: 0, duration: 0.1 });
  }

  check() {
    if (this.playerInfo.velocity > 0 && !isLookingBackward) {
      gameStat = "over";
      text.innerText = "You lose";
    }
    if (this.playerInfo.positionX < end_position + 0.4) {
      gameStat = "over";
      text.innerText = "You win";
    }
  }
  update() {
    this.check();
    this.playerInfo.positionX -= this.playerInfo.velocity;
    this.player.position.x = this.playerInfo.positionX;
  }
}

const player = new Player();

let doll = new Doll();

async function init() {
  await delay(500);
  text.innerText = "Starting in 3";
  await delay(500);
  text.innerText = "Starting in 2";
  await delay(500);
  text.innerText = "Starting in 1";
  await delay(500);
  text.innerText = "Go!";
  startGame();
}

function startGame() {
  gameStat = "started";
  // 남은 시간에 따라 줄어듦
  let progressBar = createCube({ w: 5, h: 0.1, d: 1 }, 0);
  progressBar.position.y = 3.35;
  gsap.to(progressBar.scale, { x: 0, duration: TIME_LIMIT });
  doll.start();
  setTimeout(() => {
    if (gameStat != "over") {
      text.innerText = "You ran out of time";
      gameStat = "over";
    }
  }, TIME_LIMIT * 1000);
}

init();

// 애니메이션 기능을 '계속해서' 호출
function animate() {
  if (gameStat == "over") return;
  // requestAnimationFrame 함수의 위치는 별로 중요하지 않음
  requestAnimationFrame(animate);
  // 계속 움직여야 하므로 여기에 넣어줌
  player.update();
  // 숫자는 회전 속도를 의미
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

  // 장면에 무언가를 추가할 때마다 카메라에 장면을 전달
  renderer.render(scene, camera);
}

animate();

// 반응형 추가
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 화살표 키 누를 때 run 하도록 이벤트 추가
window.addEventListener("keydown", (e) => {
  if (gameStat != "started") return;
  if (e.key === "ArrowUp") {
    player.run();
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") {
    player.stop();
  }
});
