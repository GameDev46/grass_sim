/*
╔═══╗             ╔╗       ╔╗    ╔══╗          ╔═══╗             ╔═══╗        ╔╗ ╔╗╔═══╗
║╔═╗║            ╔╝╚╗      ║║    ║╔╗║          ║╔═╗║             ╚╗╔╗║        ║║ ║║║╔══╝
║║ ╚╝╔═╗╔══╗╔══╗ ╚╗╔╝╔══╗╔═╝║    ║╚╝╚╗╔╗ ╔╗    ║║ ╚╝╔══╗ ╔╗╔╗╔══╗ ║║║║╔══╗╔╗╔╗║╚═╝║║╚══╗
║║ ╔╗║╔╝║╔╗║╚ ╗║  ║║ ║╔╗║║╔╗║    ║╔═╗║║║ ║║    ║║╔═╗╚ ╗║ ║╚╝║║╔╗║ ║║║║║╔╗║║╚╝║╚══╗║║╔═╗║
║╚═╝║║║ ║║═╣║╚╝╚╗ ║╚╗║║═╣║╚╝║    ║╚═╝║║╚═╝║    ║╚╩═║║╚╝╚╗║║║║║║═╣╔╝╚╝║║║═╣╚╗╔╝   ║║║╚═╝║
╚═══╝╚╝ ╚══╝╚═══╝ ╚═╝╚══╝╚══╝    ╚═══╝╚═╗╔╝    ╚═══╝╚═══╝╚╩╩╝╚══╝╚═══╝╚══╝ ╚╝    ╚╝╚═══╝
																			╔═╝║                                              
																			╚══╝                                              
																		 
																							  
*/

/* Three.js voxel game created by GameDev46 */

/* ------------------------------------ */

// https://threejs.org/examples

// import THREE.JS by Mr Doob https://threejs.org

//import {PointerLockControls} from 'https://threejs.org/examples/jsm/controls/PointerLockControls.js'

import * as THREE from './three/three.module.min.js';

import { PointerLockControls } from './three/PointerLockControls.js';

import { GLTFLoader } from './three/GLTFLoader.js';

import { Sky } from './three/sky.js';

import { vertexShader, fragmentShader } from './three/grassShader.js';

//import { GLTFLoader } from '/three/GLTFLoader.js';

let scene, camera, renderer, cube, clock, keyboard, controls, grassUniforms, grassInstances, grassMaterial, grassLODMap, cameraOffsetY, player;

grassUniforms;
grassInstances = [];
grassLODMap = [];
grassMaterial = 0;

cameraOffsetY = 0;

const WORLD_SIZE = 1600;

const speed = 10;
const sideSpeed = 7;

const runSpeedMultiplier = 2;

// 1 or larger
const density = 4;
const viewDistance = 35;

const chunkDimensions = 20;

const waterLevel = 1;
const maxGrassLevel = 12;

const treeSpread = 80;

player = {
	lastChunk: 0,
	currentChunk: 0
}

keyboard = {}

let sceneLoader = new THREE.TextureLoader();

let textureLoader = {
	grassTuft: sceneLoader.load('./textures/grass.png'),
	grassTuftAlpha2: sceneLoader.load('./textures/grassTuftAlpha2.png'),
	waterNormal: sceneLoader.load('./textures/waterNormal.png'),
}

let groundTextures = {
	texture: sceneLoader.load('./textures/ground.png')
}

function init() {

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

	clock = new THREE.Clock();

	//scene.fog = new THREE.Fog(0x63b9db, 10, 20);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor("#87CEEB")

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	renderer.shadowMap.autoUpdate = false;

	renderer.outputEncoding = THREE.sRGBEncoding

	// THREE.BasicShadowMap, THREE.PCFShadowMap, THREE.PCFSoftShadowMap, THREE.VSMShadowMap

	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.5;

	document.body.appendChild(renderer.domElement);

	// Create floor

	createPlane({
		position: {
			x: 0,
			y: 2,
			z: 0
		},
		scale: {
			x: WORLD_SIZE,
			y: WORLD_SIZE,
		},
		rotation: {
			x: Math.PI * -0.5,
			y: 0,
			z: 0
		},
		segments: {
			x: Math.round(WORLD_SIZE / 8),
			y: Math.round(WORLD_SIZE / 8)
		},
		name: "ground",
		colour: 0x454545,
		doubleSided: false
	});

	// Create Water

	createPlane({
		position: {
			x: 0,
			y: waterLevel,
			z: 0
		},
		scale: {
			x: WORLD_SIZE,
			y: WORLD_SIZE,
		},
		rotation: {
			x: Math.PI * -0.5,
			y: 0,
			z: 0
		},
		segments: {
			x: Math.round(WORLD_SIZE / 16),
			y: Math.round(WORLD_SIZE / 16)
		},
		name: "water",
		colour: 0xffffff,
		doubleSided: false
	});

	camera.position.z = 0;
	camera.position.y = 10;
	camera.position.x = 0;

	player.currentChunk = {
		x: Math.floor(camera.position.x / chunkDimensions),
		z: Math.floor(camera.position.z / chunkDimensions)
	}

	player.lastChunk = player.currentChunk;


	let sky = new Sky();
	sky.scale.setScalar(450000);
	scene.add(sky);

	let sun = new THREE.Vector3();

	let uniforms = sky.material.uniforms;
	uniforms['turbidity'].value = 3;
	uniforms['rayleigh'].value = 1.4;
	uniforms['mieCoefficient'].value = 0.07;
	uniforms['mieDirectionalG'].value = 0.9999;

	sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(-89), THREE.MathUtils.degToRad(225));

	uniforms['sunPosition'].value.copy(sun);

	// add lights

	let light = new THREE.DirectionalLight(0xffbb55, 0.5);

	light.position.set(0, 50, 0)
	light.castShadow = true;

	light.shadow.camera.near = 1;
	light.shadow.camera.far = 500;

	light.shadow.bias = -0.001;

	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;

	light.shadow.camera.left = 100;
	light.shadow.camera.right = -100;
	light.shadow.camera.top = 0;
	light.shadow.camera.bottom = -80;

	scene.add(light);

	light.target.position.set(-50, 40, -50)

	scene.add(light.target);

	light = new THREE.AmbientLight(0xffeeaa, 0.25)
	light.position.set(0, 0, 0)
	scene.add(light);

}

function loadTrees() {

	// "oak trees" (https://skfb.ly/6TGAC) by DJMaesen is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

	let loader = new GLTFLoader();

	loader.load('/oak_trees/scene.gltf', function(gltf) {

		let mesh = gltf.scene.children[0];

		for (let x = 0; x < WORLD_SIZE; x += ((Math.random() + 1) * treeSpread)) {

			for (let z = 0; z < WORLD_SIZE; z += ((Math.random() + 1) * treeSpread)) {

				//let randX = (Math.random() - 0.5) * 800;
				//let randZ = (Math.random() - 0.5) * 800;

				let randX = x - (WORLD_SIZE / 2);
				let randZ = z - (WORLD_SIZE / 2);

				randX += (Math.random() - 0.5) * treeSpread * 0.5;
				randZ += (Math.random() - 0.5) * treeSpread * 0.5;

				let groundHeight = getGroundHeight(randX, randZ);

				if (groundHeight > waterLevel) {

					let currentMesh = mesh.clone();

					scene.add(currentMesh);
					currentMesh.position.set(randX, groundHeight, randZ);
					currentMesh.scale.set(0.07, 0.07, 0.07);
					currentMesh.rotateZ(Math.random() * 3.1415 * 2);

				}

			}

		}

	});

	renderer.shadowMap.needsUpdate = true;

}

function createCube(objectInfo) {

	const geometry = new THREE.BoxGeometry(objectInfo.scale.x, objectInfo.scale.y, objectInfo.scale.z);

	const material = new THREE.MeshLambertMaterial({ color: objectInfo.colour || 0x61991c });

	cube = new THREE.Mesh(geometry, material);

	cube.position.x = objectInfo.position.x;
	cube.position.y = objectInfo.position.y;
	cube.position.z = objectInfo.position.z;

	cube.rotation.x = objectInfo.rotation.x;
	cube.rotation.y = objectInfo.rotation.y;
	cube.rotation.z = objectInfo.rotation.z;

	cube.receiveShadow = true;
	cube.castShadow = true;

	scene.add(cube);

	return cube;
}

// Create a plane

function createPlane(objectInfo) {

	const geometry = new THREE.PlaneGeometry(objectInfo.scale.x, objectInfo.scale.y, objectInfo.segments.x, objectInfo.segments.y);

	let material = new THREE.MeshLambertMaterial({ color: objectInfo.colour || 0x61991c });

	if (objectInfo.doubleSided) {
		material = new THREE.MeshLambertMaterial({ color: objectInfo.colour || 0x61991c, side: THREE.DoubleSide });
	}

	if (objectInfo.name == "ground") {

		let texture = groundTextures.texture
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.offset.set(0, 0);
		texture.repeat.set(80, 80);

		material = new THREE.MeshPhongMaterial({
			map: texture,
			specular: 0x1f1f1f,
			shininess: 1,
			color: objectInfo.colour || 0xffffff
		});

		const positionAttribute = geometry.getAttribute('position');

		const vertex = new THREE.Vector3();

		for (let i = 0; i < positionAttribute.count; i++) {

			vertex.fromBufferAttribute(positionAttribute, i); // read vertex

			// do something with vertex

			positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z - getGroundHeight(vertex.x, vertex.y)); // write coordinates back

		}

	}

	if (objectInfo.name == "water") {

		let texture = textureLoader.waterNormal
		texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
		texture.offset.set(0, 0);
		texture.repeat.set(100, 100);

		material = new THREE.MeshPhongMaterial({
			color: 0x4355a5,
			opacity: 0.7,
			normalMap: texture,
			normalScale: new THREE.Vector2(0.05, 0.05),
			side: THREE.DoubleSide,
			transparent: true,
			specular: 0xefefef,
			shininess: 50,
			reflectivity: 1
		});

	}

	let plane = new THREE.Mesh(geometry, material);

	plane.receiveShadow = true;
	plane.castShadow = true;

	if (objectInfo.name == "water") {
		plane.receiveShadow = false;
		plane.castShadow = false;
	}

	plane.position.x = objectInfo.position.x;
	plane.position.y = objectInfo.position.y;
	plane.position.z = objectInfo.position.z;

	plane.rotation.x = objectInfo.rotation.x;
	plane.rotation.y = objectInfo.rotation.y;
	plane.rotation.z = objectInfo.rotation.z;

	scene.add(plane);

	return plane
}

// Create a blade of grass

function createGrass(objectInfo) {

	// Setup instancing

	//const grassGeometry = new THREE.PlaneGeometry(objectInfo.scale.x, objectInfo.scale.y, objectInfo.segments.x, objectInfo.segments.y);

	let grassGeometry = new THREE.BufferGeometry();

	// create a simple square shape. We duplicate the top left and bottom right
	// vertices because each vertex needs to appear once per triangle.
	let vertices = new Float32Array([
		0.15, -2.0, 1.0, // v1
		-0.15, -2.0, 1.0, // v2
		0.0, 3.0, 1.0  // v3
	]);

	// Create your UVs array - two per vertex - based on your geometry
	// These example UV coordinates describe a right-angled triangle
	let uvs = [
		0, 0,
		1, 0,
		1, 1
	];

	if (objectInfo.LOD == 0) {

		// More vertices

		vertices = new Float32Array([
			-0.15, -2.0, 1.0, // v0
			0.15, -2.0, 1.0, // v1
			0.15, -0.2, 1.0, // v2

			0.15, -0.2, 1.0, // v3
			-0.15, -0.2, 1.0, // v4
			-0.15, -2.0, 1.0,  // v5

			0.15, -0.2, 1.0, // v1
			-0.15, -0.2, 1.0, // v2
			-0.1, 0.5, 1.0,  // v3

			0.15, -0.2, 1.0, // v4
			0.1, 0.5, 1.0, // v5
			-0.1, 0.5, 1.0,  // v6

			0.05, 2.0, 1.0, // v1
			0.1, 0.5, 1.0, // v2
			-0.1, 0.5, 1.0,  // v3

			0.05, 2.0, 1.0, // v4
			-0.05, 2.0, 1.0, // v5
			-0.1, 0.5, 1.0,  // v6

			0.05, 2.0, 1.0, // v1
			-0.05, 2.0, 1.0, // v2
			0.0, 3.0, 1.0  // v3

		]);

		uvs = [
			0, 0,
			1, 0,
			1, 0.25,

			1, 0.25,
			0, 0.25,
			0, 0,

			1, 0.25,
			0, 0.25,
			0, 0.5,

			1, 0.25,
			1, 0.5,
			0, 0.5,

			1, 0.75,
			1, 0.5,
			0, 0.5,

			1, 0.75,
			0, 0.75,
			0, 0.5,

			1, 0.75,
			0, 0.75,
			1, 1
		];

	} else if (objectInfo.LOD == 1) {

		vertices = new Float32Array([
			-0.15, -2.0, 1.0, // v0
			0.15, -2.0, 1.0, // v1
			0.15, -0.2, 1.0, // v2

			0.15, -0.2, 1.0, // v3
			-0.15, -0.2, 1.0, // v4
			-0.15, -2.0, 1.0,  // v5

			0.15, -0.2, 1.0, // v1
			-0.15, -0.2, 1.0, // v2
			0.0, 3.0, 1.0  // v3

		]);

		// Create your UVs array - two per vertex - based on your geometry
		// These example UV coordinates describe a right-angled triangle
		uvs = [
			0, 0,
			1, 0,
			1, 0.25,

			1, 0.25,
			0, 0.25,
			0, 0,

			1, 0.25,
			0, 0.25,
			1, 1
		];

	}

	// Set the attribute on your  geometry
	grassGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));

	// itemSize = 3 because there are 3 values (components) per vertex
	grassGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

	if (grassMaterial == 0) {

		let texture = textureLoader.grassTuft
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.offset.set(0, 0);
		texture.repeat.set(1, 1);

		let alphaText = textureLoader.grassTuftAlpha2;

		grassUniforms = {
			time: {
				value: 0
			},
			map: {
				type: 't',
				value: texture
			},
			alphaMap: {
				type: 't',
				value: alphaText
			},
			lightIntensity: {
				value: 0.2
			},
			sunColour: {
				value: new THREE.Vector3(1, 0.8, 0.6)
			},
			LOD: {
				value: 0
			}
		}

		grassMaterial = new THREE.ShaderMaterial({
			uniforms: grassUniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: THREE.DoubleSide
		});

		grassMaterial.transparent = false;
		//grassMaterial.depthWrite = true;

		/*plane = new THREE.Mesh(geometry, grassMaterial);

		plane.receiveShadow = true;
		plane.castShadow = true;

		plane.position.x = objectInfo.position.x;
		plane.position.y = objectInfo.position.y;
		plane.position.z = objectInfo.position.z;

		plane.rotation.x = objectInfo.rotation.x;
		plane.rotation.y = objectInfo.rotation.y;
		plane.rotation.z = objectInfo.rotation.z;*/

	}

	/*let material = new THREE.MeshPhongMaterial({
		 map: texture,
		 side: THREE.DoubleSide,
		 alphaMap: textureLoader.glassAlpha,
		 transparent: true,
		 specular: 0x575757,
		 shininess: 50
	 });*/

	const localDensity = Math.max(1, Math.round(density - objectInfo.LOD));

	let plane = new THREE.InstancedMesh(grassGeometry, grassMaterial, chunkDimensions * chunkDimensions * localDensity);

	const mock = new THREE.Object3D();

	let row = -1;
	let column = 0;

	for (let i = 0; i < chunkDimensions * chunkDimensions; i++) {

		if (i % chunkDimensions == 0) {
			row += 1;
			column = 0;
		}

		for (let d = 0; d < localDensity; d++) {

			let offsetX = (Math.random() - 0.5) / localDensity;
			let offsetZ = (Math.random() - 0.5) / localDensity;

			let xPos = objectInfo.position.x + column + offsetX;
			let zPos = objectInfo.position.z + row + offsetZ;

			let groundHeight = getGroundHeight(xPos + objectInfo.position.x, zPos + objectInfo.position.z);

			if (groundHeight <= waterLevel - 2.3) {
				groundHeight = -10000;
			}

			if (groundHeight >= maxGrassLevel + (Math.random() * 8)) {
				groundHeight = -10000;
			}

			let grassSize = Math.max(0.5, Math.min(1, (groundHeight - (waterLevel - 2.3)) * 3));

			mock.position.set(xPos, objectInfo.position.y + groundHeight, zPos);
			mock.rotation.set(0, Math.random() * Math.PI, 0)
			mock.scale.set(grassSize, grassSize, grassSize);
			mock.updateMatrix();

			plane.setMatrixAt((i * localDensity) + d, mock.matrix);

		}

		column++;

	}

	plane.instanceMatrix.needsUpdate = true;

	plane.receiveShadow = true;
	plane.castShadow = true;

	plane.position.x = objectInfo.position.x;
	plane.position.y = objectInfo.position.y;
	plane.position.z = objectInfo.position.z;

	plane.rotation.x = objectInfo.rotation.x;
	plane.rotation.y = objectInfo.rotation.y;
	plane.rotation.z = objectInfo.rotation.z;

	scene.add(plane);

	return plane
}

// Create the grass

function loadGrass() {

	// Create grass

	//let startX = camera.position.x - (chunkDimensions / 2);
	//let startZ = camera.position.z - (chunkDimensions / 2);

	let startX = 0;
	let startZ = 0;

	for (let z = -viewDistance; z <= viewDistance; z++) {

		grassInstances.push([]);
		grassLODMap.push([]);

		for (let x = -viewDistance; x <= viewDistance; x++) {

			let LOD = 0

			if (Math.abs(x) + Math.abs(z) > 2) {
				LOD = 1
			}

			if (Math.abs(x) + Math.abs(z) > 4) {
				LOD = 2
			}

			if (Math.abs(x) + Math.abs(z) > 6) {
				LOD = 3
			}

			grassLODMap[z + viewDistance].push(LOD);

			grassInstances[z + viewDistance].push(createGrass({
				position: {
					x: startX + (x * chunkDimensions * 0.5),
					y: 2,
					z: startZ + (z * chunkDimensions * 0.5)
				},
				scale: {
					x: 4,
					y: 4
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0
				},
				segments: {
					x: 1,
					y: 1
				},
				LOD: LOD,
				colour: 0x33dd33,
				doubleSided: true
			}));

		}

	}

}

function updateGrass() {

	// Create grass

	let startX = 0
	let startZ = 0

	for (let z = -viewDistance; z <= viewDistance; z++) {

		for (let x = -viewDistance; x <= viewDistance; x++) {

			let globalX = startX + (x * chunkDimensions * 0.5);
			let globalZ = startZ + (z * chunkDimensions * 0.5);

			let globalXToCam = startX + (x * chunkDimensions);
			let globalZToCam = startZ + (z * chunkDimensions);

			let xDistance = Math.floor(Math.abs(globalXToCam - camera.position.x) / chunkDimensions);
			let zDistance = Math.floor(Math.abs(globalZToCam - camera.position.z) / chunkDimensions);

			let LOD = 0

			if (xDistance + zDistance > 2) {
				LOD = 1
			}

			if (xDistance + zDistance > 4) {
				LOD = 2
			}

			if (xDistance + zDistance > 6) {
				LOD = 3
			}

			if (grassLODMap[z + viewDistance][x + viewDistance] != LOD) {

				scene.remove(grassInstances[z + viewDistance][x + viewDistance]);

				grassLODMap[z + viewDistance][x + viewDistance] = LOD;

				grassInstances[z + viewDistance][x + viewDistance] = createGrass({
					position: {
						x: globalX,
						y: 2,
						z: globalZ
					},
					scale: {
						x: 4,
						y: 4
					},
					rotation: {
						x: 0,
						y: 0,
						z: 0
					},
					segments: {
						x: 1,
						y: 1
					},
					LOD: LOD,
					colour: 0x33dd33,
					doubleSided: true
				});

			}

		}

	}

}

function animatePlants(delta) {

	grassUniforms.time.value = clock.getElapsedTime();

	grassMaterial.uniformsNeedUpdate = true;

}

function getGroundHeight(x, z) {
	//return 0;
	return Math.cos(x * 0.005) * Math.cos(z * 0.0025) * Math.sin((x * z * 0.15) * 0.0005) * 20;
}

// Change render scale on window size change

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

// Keyboard controlls

function processKeyboard(delta) {

	let isMoving = 0;
	let isRunning = 1;

	let actualSpeed = speed * delta;
	let actualSideSpeed = sideSpeed * delta;

	if (keyboard["Shift"]) {
		actualSpeed *= runSpeedMultiplier;
		isRunning = 1.5;
	}

	if (keyboard["w"]) {
		controls.moveForward(actualSpeed)
		isMoving = 1;
	}
	if (keyboard["s"]) {
		controls.moveForward(-actualSpeed)
		isMoving = 1;
	}

	if (keyboard["a"]) {
		controls.moveRight(-actualSideSpeed)
		isMoving = 1;
	}
	if (keyboard["d"]) {
		controls.moveRight(actualSideSpeed)
		isMoving = 1;
	}

	// Head bob

	let tick = clock.getElapsedTime();

	let groundHeight = getGroundHeight(camera.position.x, camera.position.z);

	let bobble = Math.abs(Math.sin(tick * 5 * isRunning) * 0.5) * isMoving * 1.5;
	cameraOffsetY = lerp(cameraOffsetY, bobble, 0.25)
	camera.position.y = groundHeight + 10 + cameraOffsetY;
}

function lerp(a, b, alpha) {
	return a + alpha * (b - a);
}

window.addEventListener("keydown", e => {
	keyboard[e.key] = true;
})

window.addEventListener("keyup", e => {
	keyboard[e.key] = false;
})

function setupMouseLook() {

	controls = new PointerLockControls(camera, renderer.domElement)

	document.addEventListener('mousedown', () => {
		controls.lock()
	});

}

// Events

window.addEventListener("resize", onWindowResize);

// Main Game Loop

function animate() {
	requestAnimationFrame(animate);

	let delta = clock.getDelta();
	processKeyboard(delta);
	animatePlants(delta);

	player.currentChunk = {
		x: Math.floor(camera.position.x / chunkDimensions),
		z: Math.floor(camera.position.z / chunkDimensions)
	}

	if (player.currentChunk.x != player.lastChunk.x || player.currentChunk.z != player.lastChunk.z) {
		player.lastChunk = player.currentChunk;
		updateGrass();
	}

	renderer.render(scene, camera);
}

init();
setupMouseLook();
loadGrass();
loadTrees();
animate();
