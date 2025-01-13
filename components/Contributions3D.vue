<template>
  <div class="relative w-full">
    <div ref="container" class="w-full" style="height: 500px; min-height: 500px; background: #161b22;">
      <canvas ref="canvas" class="w-full h-full"></canvas>
    </div>
    <button @click="downloadModel" class="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
      Download 3D Model (STL)
    </button>
  </div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default {
  name: 'Contributions3D',
  props: {
    data: {
      type: Array,
      required: true
    },
    githubUsername: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      basePlate: null,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initScene();
    });
  },
  methods: {
    initScene() {
      // Initialize Three.js scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x161b22);

      const container = this.$refs.container;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Setup camera for side view
      this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      this.camera.position.set(25, 10, 0); // Moved camera to side
      this.camera.lookAt(0, 0, 0);

      // Setup renderer
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: this.$refs.canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Add controls with adjusted settings for side view
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 15;
      this.controls.maxDistance = 50;
      this.controls.maxPolarAngle = Math.PI / 2;

      // Adjust lighting for side view
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(ambientLight);

      const mainLight = new THREE.SpotLight(0xffffff, 0.8);
      mainLight.position.set(20, 15, 0);
      mainLight.angle = Math.PI / 4;
      mainLight.penumbra = 0.3;
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      this.scene.add(mainLight);

      const fillLight = new THREE.SpotLight(0xffffff, 0.4);
      fillLight.position.set(-20, 15, 0);
      fillLight.angle = Math.PI / 4;
      fillLight.penumbra = 0.3;
      fillLight.castShadow = true;
      fillLight.shadow.mapSize.width = 2048;
      fillLight.shadow.mapSize.height = 2048;
      this.scene.add(fillLight);

      // Handle window resize
      window.addEventListener('resize', this.onWindowResize, false);

      // Create the visualization
      this.createBasePlate();
      this.createContributionBlocks();
      this.animate();
    },
    createBasePlate() {
      // Optimize base dimensions based on grid size
      const gridWidth = 7;
      const gridSpacing = 1.2;
      const totalGridWidth = (gridWidth - 1) * gridSpacing;
      
      // Base dimensions optimized for grid
      const baseWidth = totalGridWidth + 2; // Add margin
      const baseLength = 65; // Keep current length
      const baseHeight = 1;

      // Create base plate
      const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
      const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc0a080, // Bronze color
        metalness: 0.7,
        roughness: 0.2,
        reflectivity: 0.5,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2
      });

      const basePlate = new THREE.Mesh(baseGeometry, baseMaterial);
      basePlate.position.set(0, -baseHeight/2, 0);
      basePlate.receiveShadow = true;
      basePlate.castShadow = true;
      this.scene.add(basePlate);

      // Add username text on the side
      const fontLoader = new FontLoader();
      fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new TextGeometry(this.githubUsername, {
          font: font,
          size: 1.2,
          height: 0.3,
          curveSegments: 32,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.02,
          bevelOffset: 0,
          bevelSegments: 16
        });

        const textMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xd4b08c,
          metalness: 0.9,
          roughness: 0.1,
          reflectivity: 0.7,
          clearcoat: 0.5,
          clearcoatRoughness: 0.1
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
        
        // Position text on the side of the base plate, centered vertically and horizontally
        textMesh.rotation.y = Math.PI / 2;
        textMesh.position.set(
          -(baseWidth/2 + 0.3), // Slight offset from base
          0, // Place at base level
          0 // Center on Z axis
        );
        
        // Center the text by computing its bounding box
        textGeometry.computeBoundingBox();
        const centerOffset = new THREE.Vector3();
        centerOffset.x = 0;
        centerOffset.y = 0;
        centerOffset.z = -(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
        textMesh.geometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);
        
        textMesh.castShadow = true;
        
        this.scene.add(textMesh);
      });
    },
    createContributionBlocks() {
      const maxContributions = Math.max(...this.data.map(d => d.count));
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      
      // Grid configuration
      const gridWidth = 7;
      const gridLength = Math.ceil(this.data.length / gridWidth);
      const spacing = 1.2;
      
      // Calculate total grid dimensions
      const totalGridWidth = (gridWidth - 1) * spacing;
      const totalGridLength = (gridLength - 1) * spacing;
      
      // Start position (centered on base plate)
      const startX = -totalGridWidth / 2;
      const startZ = -totalGridLength / 2;
      
      // Create contribution blocks
      this.data.forEach((contribution, index) => {
        const height = (contribution.count / maxContributions) * 2 || 0.1;
        const material = new THREE.MeshPhysicalMaterial({
          color: this.getContributionColor(contribution.count, maxContributions),
          metalness: 0.5,
          roughness: 0.3,
          reflectivity: 0.5,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2
        });

        const cube = new THREE.Mesh(geometry, material);
        const row = Math.floor(index / gridWidth);
        const col = index % gridWidth;

        // Position cubes with precise alignment
        cube.position.set(
          startX + col * spacing,
          height/2 + 0.01, // Slight offset to prevent z-fighting
          startZ + row * spacing
        );
        cube.scale.y = height;
        cube.castShadow = true;
        cube.receiveShadow = true;

        this.scene.add(cube);
      });
    },
    getContributionColor(count, maxCount) {
      const colors = [0x161b22, 0x0e4429, 0x006d33, 0x26a642, 0x39d353];
      const index = Math.floor((count / maxCount) * (colors.length - 1));
      return colors[index] || colors[0];
    },
    animate() {
      if (this.renderer && this.scene && this.camera) {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      }
    },
    downloadModel() {
      if (!this.scene) return;
      
      const exporter = new STLExporter();
      const stlString = exporter.parse(this.scene);
      
      const blob = new Blob([stlString], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.githubUsername}-contributions-3d.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onWindowResize() {
      if (this.camera && this.renderer) {
        const container = this.$refs.container;
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    },
  },
  beforeDestroy() {
    if (this.renderer) {
      this.renderer.dispose();
      window.removeEventListener('resize', this.onWindowResize);
    }
  },
}
</script>

<style scoped>
.w-full {
  width: 100%;
}
.h-full {
  height: 100%;
}
</style> 