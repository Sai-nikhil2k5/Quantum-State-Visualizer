// Enhanced quantum state data with visual settings
const visualSettings = {
    backgroundColor: 0x000000,
    sphereColor: 0x87CEEB,
    axisColors: {
        x: 0xFF4444,
        y: 0x44FF44, 
        z: 0x4444FF
    },
    // MODIFIED: Removed rotationSpeeds as they are no longer needed
    lighting: {
        ambient: 0.4,
        directional: 0.8
    }
};

const quantumStates = {
    "PhiPlus": {
        "name": "Bell State |Φ+⟩",
        "description": "(|00⟩ + |11⟩)/√2",
        "qubit1": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "qubit2": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "qubit3": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "entanglement": 1.0,
        "correlations": [[0,1,1.0]]
    },
    "PsiPlus": {
        "name": "Bell State |Ψ+⟩", 
        "description": "(|01⟩ + |10⟩)/√2",
        "qubit1": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "qubit2": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "qubit3": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "entanglement": 1.0,
        "correlations": [[0,1,1.0]]
    },
    "GHZ": {
        "name": "GHZ State",
        "description": "(|000⟩ + |111⟩)/√2",
        "qubit1": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "qubit2": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "qubit3": {"x": 0, "y": 0, "z": 0, "purity": 0.5},
        "entanglement": 1.0,
        "correlations": [[0,1,0.5], [0,2,0.5], [1,2,0.5]]
    },
    "W": {
        "name": "W State",
        "description": "(|001⟩ + |010⟩ + |100⟩)/√3",
        "qubit1": {"x": 0, "y": 0, "z": -0.33, "purity": 0.67},
        "qubit2": {"x": 0, "y": 0, "z": -0.33, "purity": 0.67},
        "qubit3": {"x": 0, "y": 0, "z": -0.33, "purity": 0.67},
        "entanglement": 0.67,
        "correlations": [[0,1,0.33], [0,2,0.33], [1,2,0.33]]
    },
    "separable": {
        "name": "Separable State",
        "description": "|0⟩⊗|0⟩⊗|0⟩",
        "qubit1": {"x": 0, "y": 0, "z": 1, "purity": 1.0},
        "qubit2": {"x": 0, "y": 0, "z": 1, "purity": 1.0},
        "qubit3": {"x": 0, "y": 0, "z": 1, "purity": 1.0},
        "entanglement": 0.0,
        "correlations": []
    }
};

// OrbitControls implementation (inline to avoid CDN issues)
class OrbitControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = true;
        this.enableDamping = true;
        this.dampingFactor = 0.05;
        this.enableZoom = true;
        this.enablePan = true;
        this.enableRotate = true;
        this.minDistance = 3;
        this.maxDistance = 50;
        this.autoRotate = false;
        
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        this.scale = 1;
        this.panOffset = new THREE.Vector3();
        
        this.rotateStart = new THREE.Vector2();
        this.rotateEnd = new THREE.Vector2();
        this.rotateDelta = new THREE.Vector2();
        
        this.panStart = new THREE.Vector2();
        this.panEnd = new THREE.Vector2();
        this.panDelta = new THREE.Vector2();
        
        this.dollyStart = new THREE.Vector2();
        this.dollyEnd = new THREE.Vector2();
        this.dollyDelta = new THREE.Vector2();
        
        this.target = new THREE.Vector3();
        
        this.state = {
            NONE: -1,
            ROTATE: 0,
            DOLLY: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_DOLLY: 4,
            TOUCH_PAN: 5
        };
        
        this.currentState = this.state.NONE;
        
        // MODIFIED: Do not add own event listeners, we will control it manually
        // this.setupEventListeners(); 
    }
    
    // MODIFIED: Original event listeners are removed, now we use these from our main script
    
    onMouseDown(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        if (event.button === 0) {
            this.currentState = this.state.ROTATE;
            this.rotateStart.set(event.clientX, event.clientY);
        } else if (event.button === 2) {
            this.currentState = this.state.PAN;
            this.panStart.set(event.clientX, event.clientY);
        }
    }
    
    onMouseMove(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        if (this.currentState === this.state.ROTATE) {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
            
            const element = this.domElement;
            
            this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth);
            this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);
            
            this.rotateStart.copy(this.rotateEnd);
            
        } else if (this.currentState === this.state.PAN) {
            this.panEnd.set(event.clientX, event.clientY);
            this.panDelta.subVectors(this.panEnd, this.panStart);
            this.pan(this.panDelta.x, this.panDelta.y);
            this.panStart.copy(this.panEnd);
        }
        
        this.update();
    }
    
    onMouseUp() {
        if (!this.enabled) return;
        this.currentState = this.state.NONE;
    }
  // This is inside the OrbitControls class in app.js
    onMouseWheel(event) {
        if (!this.enabled || !this.enableZoom) return;

        event.preventDefault();

        // --- CORRECTED LOGIC: Swapped the zoom-in and zoom-out scales ---
        const scale = (event.deltaY < 0) ? this.getZoomScale() : 1 / this.getZoomScale();

        // 2. Raycast to find the point under the mouse
        const rect = this.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            const newTarget = new THREE.Vector3();

            // 3. Calculate the new pivot (target) point
            // The new target is interpolated from the intersection point towards the old target
            newTarget.subVectors(this.target, intersectionPoint).multiplyScalar(scale).add(intersectionPoint);

            // 4. Set the new target and apply the zoom scale
            this.target.copy(newTarget);
            this.scale = scale;

        } else {
            // If the mouse is not over any object, perform the old-style zoom
            this.scale = scale;
        }

        this.update();
    }
    
    onContextMenu(event) {
        if (!this.enabled) return;
        event.preventDefault();
    }
    
    rotateLeft(angle) {
        this.sphericalDelta.theta -= angle;
    }
    
    rotateUp(angle) {
        this.sphericalDelta.phi -= angle;
    }
    
    pan(deltaX, deltaY) {
        const offset = new THREE.Vector3();
        const position = this.camera.position.clone().sub(this.target);
        const targetDistance = position.length();
        
        targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);
        
        const panLeft = new THREE.Vector3();
        panLeft.setFromMatrixColumn(this.camera.matrix, 0);
        panLeft.multiplyScalar(-2 * deltaX * targetDistance / this.domElement.clientHeight);
        
        const panUp = new THREE.Vector3();
        panUp.setFromMatrixColumn(this.camera.matrix, 1);
        panUp.multiplyScalar(2 * deltaY * targetDistance / this.domElement.clientHeight);
        
        offset.copy(panLeft).add(panUp);
        this.panOffset.add(offset);
    }
    
    dollyIn(dollyScale) {
        this.scale /= dollyScale;
    }
    
    dollyOut(dollyScale) {
        this.scale *= dollyScale;
    }
    
    getZoomScale() {
        return Math.pow(0.95, 1);
    }
    
    update() {
        const offset = new THREE.Vector3();
        const quat = new THREE.Quaternion().setFromUnitVectors(this.camera.up, new THREE.Vector3(0, 1, 0));
        const quatInverse = quat.clone().invert();
        
        const lastPosition = new THREE.Vector3();
        const lastQuaternion = new THREE.Quaternion();
        
        lastPosition.copy(this.camera.position);
        lastQuaternion.copy(this.camera.quaternion);
        
        offset.copy(this.camera.position).sub(this.target);
        offset.applyQuaternion(quat);
        
        this.spherical.setFromVector3(offset);
        
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        this.spherical.phi = Math.max(0.000001, Math.min(Math.PI - 0.000001, this.spherical.phi));
        
        this.spherical.radius *= this.scale;
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
        
        this.target.add(this.panOffset);
        
        offset.setFromSpherical(this.spherical);
        offset.applyQuaternion(quatInverse);
        
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
        
        if (this.enableDamping) {
            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);
            this.panOffset.multiplyScalar(1 - this.dampingFactor);
        } else {
            this.sphericalDelta.set(0, 0, 0);
            this.panOffset.set(0, 0, 0);
        }
        
        this.scale = 1;
        
        if (lastPosition.distanceToSquared(this.camera.position) > 0.000001 ||
            8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > 0.000001) {
            return true;
        }
        
        return false;
    }
    
    reset() {
        this.target.set(0, 0, 0);
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(this.target);
        this.update();
    }
}

// Global variables
let scene, camera, renderer, controls;
let blochSpheres = [];
let blochVectors = [];
let entanglementArrows = [];
let puritySpheres = [];
let currentState = 'PhiPlus';

// Variables for manual rotation
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedSphere = null;
let previousMousePosition = { x: 0, y: 0 };

// NEW: Add these two lines here
let targetQuaternion = new THREE.Quaternion();
const dampingFactor = 0.1;


// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            console.log('Three.js loaded, initializing...');
            try {
                initThreeJS();
                createBlochSpheres();
                setupControls();
                setQuantumState('PhiPlus');
                animate();
                console.log('Application initialized successfully');
            } catch (error) {
                console.error('Error during initialization:', error);
                showErrorMessage('3D visualization initialization failed: ' + error.message);
            }
        } else {
            console.error('Three.js library not loaded');
            showErrorMessage('Three.js library failed to load');
        }
    }, 200);
});

function showErrorMessage(message) {
    const container = document.getElementById('threejs-container');
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                    background: #000; color: #87CEEB; font-family: Arial, sans-serif; text-align: center;">
            <div>
                <h3 style="color: #ff4757; margin-bottom: 10px;">⚠️ Error</h3>
                <p>${message}</p>
                <p style="font-size: 12px; opacity: 0.7; margin-top: 10px;">
                    Please refresh the page to try again
                </p>
            </div>
        </div>
    `;
}

function initThreeJS() {
    const container = document.getElementById('threejs-container');
    
    if (!container) {
        throw new Error('Container element not found');
    }
    
    // Scene setup with black background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(visualSettings.backgroundColor);
    
    // Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup with enhanced settings
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(visualSettings.backgroundColor, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear container and add canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // Enhanced lighting for black background
    const ambientLight = new THREE.AmbientLight(0xffffff, visualSettings.lighting.ambient);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0x87CEEB, visualSettings.lighting.directional);
    directionalLight1.position.set(10, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-10, -10, -5);
    scene.add(directionalLight2);
    
    // Setup OrbitControls for 360-degree camera movement
    controls = new OrbitControls(camera, renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    // NEW: Add event listeners for manual rotation
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    renderer.domElement.addEventListener('wheel', (e) => controls.onMouseWheel(e), false);
    renderer.domElement.addEventListener('contextmenu', (e) => controls.onContextMenu(e), false);
    
    console.log('Three.js scene initialized with black background');
}

// ... (createBlochSpheres, createQubitLabel, createEntanglementArrows functions remain the same)
function createBlochSpheres() {
    const positions = [
        { x: -3, y: 0, z: 0 },   // Qubit 1
        { x: 3, y: 0, z: 0 },    // Qubit 2
        { x: 0, y: 3, z: 0 }     // Qubit 3
    ];
    
    const vectorColors = [ 0xFFFF00, 0xFFFF00, 0xFFFF00];

    positions.forEach((pos, index) => {
        const sphereGroup = new THREE.Group();
        sphereGroup.userData.isBlochSphere = true;

        const glassMaterial = new THREE.MeshPhongMaterial({ color: visualSettings.sphereColor, transparent: true, opacity: 0.15, shininess: 90 });
        const glassSphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), glassMaterial);
        sphereGroup.add(glassSphere);

        const wireframeMaterial = new THREE.MeshBasicMaterial({ color: visualSettings.sphereColor, wireframe: true, transparent: true, opacity: 0.3 });
        const wireframeSphere = new THREE.Mesh(new THREE.SphereGeometry(1.001, 24, 24), wireframeMaterial);
        sphereGroup.add(wireframeSphere);

        const purityMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, emissive: 0x333333 });
        const puritySphere = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), purityMaterial);
        puritySphere.scale.set(0.5, 0.5, 0.5);
        sphereGroup.add(puritySphere);
        puritySpheres.push(puritySphere);

        const ringMaterial = new THREE.MeshBasicMaterial({ color: visualSettings.sphereColor, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        const equator = new THREE.Mesh(new THREE.RingGeometry(1.01, 1.02, 64), ringMaterial);
        equator.rotation.x = Math.PI / 2;
        sphereGroup.add(equator);
        const meridian1 = new THREE.Mesh(new THREE.RingGeometry(1.01, 1.02, 64), ringMaterial);
        sphereGroup.add(meridian1);

        const axisLength = 1.4;
        const axisColors = [visualSettings.axisColors.x, visualSettings.axisColors.y, visualSettings.axisColors.z];
        
        for (let i = 0; i < 3; i++) {
            const axisGeometry = new THREE.CylinderGeometry(0.015, 0.015, axisLength * 2, 8);
            const axisMaterial = new THREE.MeshPhongMaterial({ color: axisColors[i], emissive: new THREE.Color(axisColors[i]).multiplyScalar(0.3) });
            const axis = new THREE.Mesh(axisGeometry, axisMaterial);
            if (i === 0) axis.rotateZ(Math.PI / 2);
            if (i === 2) axis.rotateX(Math.PI / 2);
            sphereGroup.add(axis);
        }

        // --- Axis Labels Are Created Here ---
        const labelDist = 1.25;
        sphereGroup.add(createAxisLabel('|0⟩', new THREE.Vector3(0, 0.1, labelDist)));
        sphereGroup.add(createAxisLabel('|1⟩', new THREE.Vector3(0, 0.1, -labelDist)));
        sphereGroup.add(createAxisLabel('|+⟩', new THREE.Vector3(labelDist, 0.1, 0)));
        sphereGroup.add(createAxisLabel('|-⟩', new THREE.Vector3(-labelDist, 0.1, 0)));
        sphereGroup.add(createAxisLabel('|i⟩', new THREE.Vector3(0.1, labelDist, 0)));
        sphereGroup.add(createAxisLabel('|-i⟩', new THREE.Vector3(0.1, -labelDist, 0)));
        // --- End of Axis Labels ---
        
        const vectorGroup = new THREE.Group();
        const shaftGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
        const shaftMaterial = new THREE.MeshPhongMaterial({ color: vectorColors[index], emissive: new THREE.Color(vectorColors[index]).multiplyScalar(0.2), shininess: 100 });
        const arrowShaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        arrowShaft.position.y = 0.5;
        vectorGroup.add(arrowShaft);
        
        const headGeometry = new THREE.ConeGeometry(0.1, 0.25, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: vectorColors[index], emissive: new THREE.Color(vectorColors[index]).multiplyScalar(0.3), shininess: 100 });
        const arrowHead = new THREE.Mesh(headGeometry, headMaterial);
        arrowHead.position.y = 1.125;
        vectorGroup.add(arrowHead);
        
        sphereGroup.add(vectorGroup);
        blochVectors.push(vectorGroup);
        
        sphereGroup.position.set(pos.x, pos.y, pos.z);
        scene.add(sphereGroup);
        blochSpheres.push(sphereGroup);
        
        createQubitLabel(sphereGroup, `Qubit ${index + 1}`, index);
    });
    
    createEntanglementArrows();
}

function createQubitLabel(sphereGroup, text, index) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = context.createLinearGradient(0, 0, 512, 128);
    gradient.addColorStop(0, 'rgba(135, 206, 235, 0.8)');
    gradient.addColorStop(1, 'rgba(135, 206, 235, 0.4)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 128);
    
    // Add border
    context.strokeStyle = '#87CEEB';
    context.lineWidth = 4;
    context.strokeRect(0, 0, 512, 128);
    
    // Add text
    context.fillStyle = '#ffffff';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.shadowColor = '#000000';
    context.shadowBlur = 10;
    context.fillText(text, 256, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        alphaTest: 0.1
    });
    
    const labelGeometry = new THREE.PlaneGeometry(1.5, 0.375);
    const labelMesh = new THREE.Mesh(labelGeometry, material);
    labelMesh.position.set(0, -2.2, 0);
    
    sphereGroup.add(labelMesh);
}
function createAxisLabel(text, position) {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    // MODIFIED: Changed to pure, non-transparent white for maximum brightness
    context.fillStyle = '#FFFFFF';
    
    // MODIFIED: Increased font size for better clarity
    context.font = 'bold 48px Arial';
    
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    
    // MODIFIED: Increased the scale to make the labels significantly larger
    sprite.scale.set(0.6, 0.6, 1.0);

    return sprite;
}

function createEntanglementArrows() {
    // Clear existing arrows
    entanglementArrows.forEach(arrow => scene.remove(arrow));
    entanglementArrows = [];
    
    const state = quantumStates[currentState];
    if (!state.correlations.length) return;
    
    state.correlations.forEach(([i, j, strength]) => {
        if (i >= blochSpheres.length || j >= blochSpheres.length) return;
        
        const pos1 = blochSpheres[i].position.clone();
        const pos2 = blochSpheres[j].position.clone();
        
        // Create straight line for better visibility
        const points = [pos1, pos2];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Enhanced arrow material with glow effect
        const color = new THREE.Color().lerpColors(
            new THREE.Color(0x444444),
            new THREE.Color(0xff4757),
            strength
        );
        
        const material = new THREE.LineBasicMaterial({ 
            color: color, 
            linewidth: 5,
            transparent: true,
            opacity: 0.8
        });
        
        const arrow = new THREE.Line(geometry, material);
        scene.add(arrow);
        entanglementArrows.push(arrow);
    });
}
// ...
function updateBlochVector(qubitIndex, x, y, z, purity) {
    if (qubitIndex >= blochVectors.length) return;
    
    const vector = blochVectors[qubitIndex];
    const length = Math.sqrt(x*x + y*y + z*z);
    const scaledLength = Math.max(0.1, length * purity);
    
    if (length > 0 || scaledLength > 0.1) {
        // Update shaft
        const shaft = vector.children[0];
        shaft.scale.set(1, scaledLength, 1);
        shaft.position.set(0, scaledLength / 2, 0);
        
        // Update head
        const head = vector.children[1];
        head.position.set(0, scaledLength + 0.125, 0);

        // Orient the vector
        if (length > 0) {
            const direction = new THREE.Vector3(x, y, z).normalize();
            // This sets the vector's rotation relative to its parent (the sphere)
            // It rotates the default up-vector (0,1,0) to the new direction
            vector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        }
        
        vector.visible = true;
    } else {
        vector.visible = false;
    }
}

function setQuantumState(stateKey) {
    currentState = stateKey;
    const state = quantumStates[stateKey];
    
    // Update visual elements
    updateBlochVector(0, state.qubit1.x, state.qubit1.y, state.qubit1.z, state.qubit1.purity);
    updateBlochVector(1, state.qubit2.x, state.qubit2.y, state.qubit2.z, state.qubit2.purity);
    updateBlochVector(2, state.qubit3.x, state.qubit3.y, state.qubit3.z, state.qubit3.purity);
    
    createEntanglementArrows();
    
    // Update UI
    document.getElementById('current-state').textContent = state.name;
    document.getElementById('state-description').textContent = state.description;
    document.getElementById('entanglement-value').textContent = state.entanglement.toFixed(2);
    document.getElementById('q1-purity').textContent = state.qubit1.purity.toFixed(2);
    document.getElementById('q2-purity').textContent = state.qubit2.purity.toFixed(2);
    document.getElementById('q3-purity').textContent = state.qubit3.purity.toFixed(2);
    
      [state.qubit1, state.qubit2, state.qubit3].forEach((q, i) => {
        if (puritySpheres[i]) puritySpheres[i].scale.set(q.purity, q.purity, q.purity);
    });
    // Update sliders
    document.getElementById('x1-slider').value = state.qubit1.x;
    document.getElementById('y1-slider').value = state.qubit1.y;
    document.getElementById('z1-slider').value = state.qubit1.z;
    document.getElementById('x1-value').textContent = state.qubit1.x.toFixed(2);
    document.getElementById('y1-value').textContent = state.qubit1.y.toFixed(2);
    document.getElementById('z1-value').textContent = state.qubit1.z.toFixed(2);
    
    // Update active button
    document.querySelectorAll('.state-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-state="${stateKey}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// MODIFIED: setupControls updated to use new manual slider logic from previous step
function setupControls() {
    // Preset state buttons
    document.querySelectorAll('.state-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setQuantumState(btn.dataset.state);
        });
    });

    const sliders = ['x1', 'y1', 'z1'];
    sliders.forEach(sliderId => {
        const slider = document.getElementById(`${sliderId}-slider`);
        const valueDisplay = document.getElementById(`${sliderId}-value`);
        let isDragging = false;

        const updateFromSlider = (newValue) => {
            const clampedValue = Math.max(-1, Math.min(1, newValue));
            slider.value = clampedValue;
            valueDisplay.textContent = clampedValue.toFixed(2);
            const x = parseFloat(document.getElementById('x1-slider').value);
            const y = parseFloat(document.getElementById('y1-slider').value);
            const z = parseFloat(document.getElementById('z1-slider').value);
            const length = Math.sqrt(x * x + y * y + z * z);
            const purity = Math.min(1, Math.max(0.1, length));
            updateBlochVector(0, x, y, z, purity);
            updateEntangledQubits(x, y, z);
        };
        
        const handleDrag = (event) => {
            const rect = slider.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const percentage = offsetX / rect.width;
            const newValue = percentage * 2 - 1;
            updateFromSlider(newValue);
        };
        
        slider.addEventListener('mousedown', (event) => {
            isDragging = true;
            handleDrag(event);
        });

        document.addEventListener('mousemove', (event) => {
            if (isDragging) { handleDrag(event); }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    });
    
    document.getElementById('resetCamera').addEventListener('click', () => {
        if (controls) { controls.reset(); }
    });
}

function updateEntangledQubits(x1, y1, z1) {
    const state = quantumStates[currentState];
    
    if (state.correlations.length > 0) {
        state.correlations.forEach(([i, j, strength]) => {
            if (i === 0 && j < blochVectors.length) {
                const phase = j === 1 ? 1 : -0.7;
                const corrX = x1 * strength * phase;
                const corrY = y1 * strength * phase;
                const corrZ = z1 * strength * phase;
                const corrLength = Math.sqrt(corrX*corrX + corrY*corrY + corrZ*corrZ);
                const corrPurity = Math.min(1, Math.max(0.3, corrLength + 0.4));
                updateBlochVector(j, corrX, corrY, corrZ, corrPurity);
                if (puritySpheres[j]) puritySpheres[j].scale.set(corrPurity, corrPurity, corrPurity);
            }
        });
    }
}


// --- NEW MOUSE CONTROL FUNCTIONS ---

function onMouseDown(event) {
    event.preventDefault();

    // --- LOGIC ADDED: Only check for sphere rotation on left-click (button 0) ---
    if (event.button === 0) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            let clickedObject = intersects[0].object;
            while (clickedObject.parent && !clickedObject.userData.isBlochSphere) {
                clickedObject = clickedObject.parent;
            }

            if (clickedObject.userData.isBlochSphere) {
                selectedSphere = clickedObject;
                targetQuaternion.copy(selectedSphere.quaternion);
                previousMousePosition = { x: event.clientX, y: event.clientY };
                return; // Sphere selected, so we stop here.
            }
        }
        // If a sphere was NOT clicked with the left mouse button, we intentionally do nothing.
    } else {
        // For any other button (like right-click), let the camera controls handle it (for panning).
        controls.onMouseDown(event);
    }
}
function onMouseMove(event) {
    event.preventDefault();

    if (selectedSphere) {
        // This is the sphere rotation logic, which remains the same.
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        const rotationSpeed = 0.005;
        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                deltaMove.y * rotationSpeed,
                deltaMove.x * rotationSpeed,
                0,
                'XYZ'
            ));
        targetQuaternion.multiplyQuaternions(deltaRotationQuaternion, targetQuaternion);
        previousMousePosition = { x: event.clientX, y: event.clientY };
    } else {
        // If no sphere is selected, allow camera controls to work (for panning).
        controls.onMouseMove(event);
    }
}

function onMouseUp(event) {
    event.preventDefault();
    selectedSphere = null;
    // Always tell the controls the mouse is up, so it can stop any action (like panning).
    controls.onMouseUp(event);
}

// MODIFIED: Animate function
function animate() {
    requestAnimationFrame(animate);

    if (renderer && scene && camera) {
        // NEW: Add this block for smooth rotation
        // If a sphere is selected, smoothly interpolate its rotation to the target
        if (selectedSphere) {
            selectedSphere.quaternion.slerp(targetQuaternion, dampingFactor);
        }

        // Enhanced pulsing effect for entanglement arrows
        entanglementArrows.forEach((arrow, index) => {
            if (arrow.material && arrow.material.opacity !== undefined) {
                const time = Date.now() * 0.002;
                arrow.material.opacity = 0.6 + 0.3 * Math.sin(time + index * 0.5);
            }
        });

        // Update label orientations to always face camera
        blochSpheres.forEach(sphere => {
            const label = sphere.children.find(child =>
                child.geometry && child.geometry.type === 'PlaneGeometry'
            );
            if (label) {
                label.lookAt(camera.position);
            }
        });

        renderer.render(scene, camera);
    }
}