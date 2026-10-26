import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import { BACKGROUND_AUDIO, TARGETS } from './config.js';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const container = document.querySelector('#ar-container');
const overlay = document.querySelector('#overlay');
const startButton = document.querySelector('#start');
const stopButton = document.querySelector('#stop');
const muteButton = document.querySelector('#mute');
const status = document.querySelector('#status');
const error = document.querySelector('#error');
const background = new Audio(asset(BACKGROUND_AUDIO));
background.loop = true;
background.volume = 0.3;
const tracks = TARGETS.map(t => { const a = new Audio(asset(t.audio)); a.loop = true; a.volume = 0.85; return a; });
let muted = false, running = false, active = null, ar, mixers = [], clock;

function showStatus(message) { status.textContent = message; }
function stopTargetAudio() { tracks.forEach(a => { a.pause(); a.currentTime = 0; }); }
function selectTarget(index) {
  if (!running || active === index) return;
  stopTargetAudio();
  active = index;
  ar.anchors.forEach((anchor, i) => { anchor.group.visible = i === index; });
  showStatus(`Image ${index + 1} detected`);
  tracks[index].muted = muted;
  tracks[index].play().catch(() => showStatus('Tap Start again if audio is blocked'));
}
function loseTarget(index) {
  if (active !== index) return;
  active = null;
  stopTargetAudio();
  ar.anchors[index].group.visible = false;
  showStatus('Point camera at an image');
}

async function initialize() {
  ar = new MindARThree({ container, imageTargetSrc: asset('targets/targets.mind'), filterMinCF: 0.001, filterBeta: 0.01, warmupTolerance: 5, missTolerance: 10, maxTrack: 2, uiScanning: "no"});
  const { renderer, scene, camera } = ar;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.2));
  const directional = new THREE.DirectionalLight(0xffffff, 1.5);
  directional.position.set(1, 2, 2);
  scene.add(directional);
  const loader = new GLTFLoader();
  const animations = [];
  for (const [i, target] of TARGETS.entries()) {
    const anchor = ar.addAnchor(target.index);
    anchor.group.visible = false;
    anchor.onTargetFound = () => selectTarget(i);
    anchor.onTargetLost = () => loseTarget(i);
    const gltf = await loader.loadAsync(asset(target.model));
    gltf.scene.scale.setScalar(target.scale);
    gltf.scene.position.set(...target.position);
    anchor.group.add(gltf.scene);
    if (gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach(clip => mixer.clipAction(clip).play());
      animations.push(mixer);
    }
  }
  mixers = animations;
  clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    mixers.forEach(m => m.update(dt));
    renderer.render(scene, camera);
  });
}

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  error.textContent = '';
  try {
    // Start sound within the user's click gesture for mobile playback permissions.
    background.muted = muted;
    await background.play();
    if (!ar) await initialize();
    await ar.start();
    running = true;
    overlay.hidden = true;
    stopButton.disabled = false;
    muteButton.disabled = false;
    showStatus('Point camera at an image');
  } catch (e) {
    console.error(e);
    background.pause();
    error.textContent = `Unable to start: ${e.message}. Check camera permissions and asset paths.`;
    startButton.disabled = false;
  }
});
stopButton.addEventListener('click', () => {
  running = false;
  active = null;
  stopTargetAudio();
  background.pause();
  background.currentTime = 0;
  ar?.stop();
  overlay.hidden = true;
  startButton.disabled = false;
  stopButton.disabled = true;
  muteButton.disabled = true;
  showStatus('Stopped');
});
muteButton.addEventListener('click', () => {
  muted = !muted;
  background.muted = muted;
  tracks.forEach(a => { a.muted = muted; });
  muteButton.textContent = muted ? 'Unmute' : 'Mute';
});
