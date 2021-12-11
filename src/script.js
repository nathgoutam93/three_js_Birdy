import './style.css';
var THREE = require('three');
var initializeDomEvents = require('threex-domevents/threex.domevents');
var THREEx = initializeDomEvents(THREE);

const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const {
  OrbitControls,
} = require('three/examples/jsm/controls/OrbitControls.js');

//canvas
const canvas = document.querySelector('canvas.webgl');

//canvasSize
const sizes = {
  width: canvas.parentElement.clientWidth,
  height: canvas.parentElement.clientHeight,
};

//clock
const clock = new THREE.Clock();
let mixer = null;
let actions = [];
let currentAction = 1;
let model = null;

let target = new THREE.Vector3();
let mouseX = 0,
  mouseY = 0;
//scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff);
scene.fog = new THREE.FogExp2(0xaaccff, 0.0007);

//camera
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(0, 0, 2);

//renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

var domEvents = new THREEx.DomEvents(camera, renderer.domElement);

//GLTF loader
const modelLoader = new GLTFLoader();

// model
modelLoader.load(
  'inland.glb',
  (gltf) => {
    model = gltf.scene;
    model.castShadow = true;
    model.receiveShadow = true;
    model.position.set(0, 0, 0);
    scene.add(model);

    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        domEvents.addEventListener(child, 'mouseover', () => {
          spin();
        });
      }
    });

    mixer = new THREE.AnimationMixer(model);
    let clips = gltf.animations;

    for (let i = 0; i < clips.length; i++) {
      let clip = clips[i];
      let action = mixer.clipAction(clip);
      if (i !== 1) {
        action.setLoop(THREE.LoopOnce);
      }
      actions.push(action);
    }

    actions[1].play();
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

//lights
const light = new THREE.AmbientLight(0x404040);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;

const btn_sayHi = document.getElementById('wave');
btn_sayHi.addEventListener('click', sayHi);

const btn_spin = document.getElementById('spin');
btn_spin.addEventListener('click', spin);

function sayHi() {
  if (currentAction !== 3) {
    actions[currentAction].fadeOut(0.2);
    currentAction = 3;
    actions[currentAction]
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(0.2)
      .play();
    mixer.addEventListener('finished', restoreState);
  }
}

function spin() {
  if (currentAction !== 2 && currentAction !== 0) {
    actions[currentAction].fadeOut(0.2);

    Math.random() > 0.5 ? (currentAction = 2) : (currentAction = 0);

    actions[currentAction]
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(0.2)
      .play();
    mixer.addEventListener('finished', restoreState);
  }
}

function restoreState() {
  mixer.removeEventListener('finished', restoreState);

  actions[currentAction].fadeOut(0.2);
  currentAction = 1;

  actions[currentAction]
    .reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(0.2)
    .play();
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function onDocumentMouseMove(event) {
  mouseX = event.clientX - window.innerWidth / 2;
  mouseY = event.clientY - window.innerHeight / 2;
}
window.addEventListener('mousemove', onDocumentMouseMove);

const tick = () => {
  // Render
  renderer.render(scene, camera);

  const delta = clock.getDelta();

  // controls.update();

  mixer?.update(delta);

  target.x = mouseX;
  target.y = -mouseY;
  target.z = camera.position.z + 1000; // assuming the camera is located at ( 0, 0, z );

  model?.lookAt(target);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
