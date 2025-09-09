// Quantum Circuit Builder & Bloch Sphere Visualizer

class ComplexNumber {
    constructor(real = 0, imag = 0) {
        this.real = real;
        this.imag = imag;
    }
    
    add(other) {
        return new ComplexNumber(this.real + other.real, this.imag + other.imag);
    }
    
    subtract(other) {
        return new ComplexNumber(this.real - other.real, this.imag - other.imag);
    }
    
    multiply(other) {
        if (typeof other === 'number') {
            return new ComplexNumber(this.real * other, this.imag * other);
        }
        const real = this.real * other.real - this.imag * other.imag;
        const imag = this.real * other.imag + this.imag * other.real;
        return new ComplexNumber(real, imag);
    }
    
    conjugate() {
        return new ComplexNumber(this.real, -this.imag);
    }
    
    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }
    
    phase() {
        return Math.atan2(this.imag, this.real);
    }
    
    toString() {
        if (Math.abs(this.imag) < 1e-10) return this.real.toFixed(3);
        if (Math.abs(this.real) < 1e-10) return this.imag >= 0 ? `${this.imag.toFixed(3)}i` : `-${Math.abs(this.imag).toFixed(3)}i`;
        const imagPart = this.imag >= 0 ? `+${this.imag.toFixed(3)}i` : `-${Math.abs(this.imag).toFixed(3)}i`;
        return `${this.real.toFixed(3)}${imagPart}`;
    }
}

class QuantumSimulator {
    constructor(numQubits = 2) {
        this.numQubits = numQubits;
        this.numStates = Math.pow(2, numQubits);
        this.stateVector = new Array(this.numStates);
        this.reset();
    }
    
    reset() {
        for (let i = 0; i < this.numStates; i++) {
            this.stateVector[i] = new ComplexNumber(i === 0 ? 1 : 0, 0);
        }
    }
    
    setNumQubits(numQubits) {
        this.numQubits = numQubits;
        this.numStates = Math.pow(2, numQubits);
        this.stateVector = new Array(this.numStates);
        this.reset();
    }
    
    getGateMatrix(gateType, parameter = 0) {
        const cos = Math.cos;
        const sin = Math.sin;
        const c0 = new ComplexNumber(0, 0);
        const c1 = new ComplexNumber(1, 0);
        const ci = new ComplexNumber(0, 1);
        const cni = new ComplexNumber(0, -1);
        
        switch (gateType) {
            case 'H':
                return [
                    [new ComplexNumber(1/Math.sqrt(2), 0), new ComplexNumber(1/Math.sqrt(2), 0)],
                    [new ComplexNumber(1/Math.sqrt(2), 0), new ComplexNumber(-1/Math.sqrt(2), 0)]
                ];
            case 'X':
                return [[c0, c1], [c1, c0]];
            case 'Y':
                return [[c0, cni], [ci, c0]];
            case 'Z':
                return [[c1, c0], [c0, new ComplexNumber(-1, 0)]];
            case 'S':
                return [[c1, c0], [c0, ci]];
            case 'T':
                return [[c1, c0], [c0, new ComplexNumber(cos(Math.PI/4), sin(Math.PI/4))]];
            case 'RX':
                return [
                    [new ComplexNumber(cos(parameter/2), 0), new ComplexNumber(0, -sin(parameter/2))],
                    [new ComplexNumber(0, -sin(parameter/2)), new ComplexNumber(cos(parameter/2), 0)]
                ];
            case 'RY':
                return [
                    [new ComplexNumber(cos(parameter/2), 0), new ComplexNumber(-sin(parameter/2), 0)],
                    [new ComplexNumber(sin(parameter/2), 0), new ComplexNumber(cos(parameter/2), 0)]
                ];
            case 'RZ':
                return [
                    [new ComplexNumber(cos(-parameter/2), sin(-parameter/2)), c0],
                    [c0, new ComplexNumber(cos(parameter/2), sin(parameter/2))]
                ];
            default:
                return [[c1, c0], [c0, c1]]; // Identity
        }
    }
    
tensorProduct(matA, matB) {
    const result = [];
    for (let i = 0; i < matA.length * matB.length; i++) {
        result[i] = [];
    }
    for (let i = 0; i < matA.length; i++) {
        for (let k = 0; k < matB.length; k++) {
            const rowIndex = i * matB.length + k;
            for (let j = 0; j < matA[i].length; j++) {
                for (let l = 0; l < matB[k].length; l++) {
                    result[rowIndex][j * matB[k].length + l] = matA[i][j].multiply(matB[k][l]);
                }
            }
        }
    }
    return result;
}

    
    getIdentityMatrix() {
        return [
            [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
            [new ComplexNumber(0, 0), new ComplexNumber(1, 0)]
        ];
    }
    
buildGateMatrix(gateType, qubit, parameter = 0, controlQubit = -1, targetQubit = -1) {
    if (gateType === 'CNOT' || gateType === 'CZ') {
        return this.buildControlledGateMatrix(gateType, controlQubit, targetQubit);
    }
    // Create an array of matrices: gate for qubit, identity for others
    const matrices = [];
    for (let i = 0; i < this.numQubits; i++) {
        if (i === qubit) {
            matrices.push(this.getGateMatrix(gateType, parameter));
        } else {
            matrices.push(this.getIdentityMatrix());
        }
    }
    // Compute the tensor product of all matrices in order
    let fullMatrix = matrices[0];
    for (let i = 1; i < matrices.length; i++) {
        fullMatrix = this.tensorProduct(fullMatrix, matrices[i]);
    }
    return fullMatrix;
}

getFredkinMatrix() {
  const size = this.numStates;
  const matrix = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, () => new ComplexNumber(0, 0))
  );

  for (let i = 0; i < size; i++) {
    let j = i;
    // If control (q0) = 1, swap q1 and q2
    const b0 = (i >> 2) & 1; // control
    const b1 = (i >> 1) & 1;
    const b2 = (i >> 0) & 1;
    if (b0 === 1 && b1 !== b2) {
      j = i ^ 2; // flip middle bit
      j = j ^ 1; // flip last bit
    }
    matrix[j][i] = new ComplexNumber(1, 0);
  }

  return matrix;
}
getToffoliMatrix() {
  const size = this.numStates; // should be 8 for 3 qubits
  const matrix = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, () => new ComplexNumber(0, 0))
  );

  for (let i = 0; i < size; i++) {
    let j = i;
    // If both control bits (q0,q1) are 1, flip q2 (target)
    const b0 = (i >> 2) & 1; // MSB
    const b1 = (i >> 1) & 1;
    const b2 = (i >> 0) & 1; // LSB
    if (b0 === 1 && b1 === 1) {
      j = i ^ 1; // flip LSB (target)
    }
    matrix[j][i] = new ComplexNumber(1, 0);
  }

  return matrix;
}

    
   buildControlledGateMatrix(gateType, controlQubit, targetQubit) {
    const size = this.numStates; // 2^numQubits
    const matrix = [];

    // Initialize the matrix as identity: diagonal elements = 1, others = 0
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            matrix[i][j] = (i === j) ? new ComplexNumber(1, 0) : new ComplexNumber(0, 0);
        }
    }

    // Modify matrix elements where control qubit is |1⟩
    for (let state = 0; state < size; state++) {
        // Extract control qubit value from the bitstring representation of 'state'
        const controlBit = (state >> (this.numQubits - 1 - controlQubit)) & 1;
        if (controlBit === 1) {
            // Extract target qubit value
            const targetBit = (state >> (this.numQubits - 1 - targetQubit)) & 1;
            let newState = state;

            if (gateType === 'CNOT') {
                // Flip the target qubit bit (X gate) when control is 1
                newState = state ^ (1 << (this.numQubits - 1 - targetQubit));
                // Update matrix to reflect X operation on target qubit controlled by control qubit
                matrix[state][state] = new ComplexNumber(0, 0);      // zero diagonal entry
                matrix[newState][state] = new ComplexNumber(1, 0);   // flip amplitude
            } else if (gateType === 'CZ' && targetBit === 1) {
                // Apply Z gate phase flip (-1) on the target if targetBit = 1 and control is 1
                matrix[state][state] = new ComplexNumber(-1, 0);
            }
        }
    }

    return matrix;
}

    
applyGate(gateType, qubit, parameter = 0, controlQubit = -1, targetQubit = -1, targets = []) {
  let matrix;

  if (gateType === "CCNOT") {
    if (this.numQubits !== 3) {
      throw new Error("CCNOT gate supports exactly 3 qubits.");
    }
    matrix = this.getToffoliMatrix();

  } else if (gateType === "CSWAP") {
    if (this.numQubits !== 3) {
      throw new Error("CSWAP gate supports exactly 3 qubits.");
    }
    matrix = this.getFredkinMatrix();

  } else if (gateType === "SWAP") {
    if (targets.length !== 2) {
      throw new Error("SWAP gate requires exactly 2 target qubits.");
    }
    matrix = this.getSwapMatrix(targets[0], targets[1]);

  } else {
    // ✅ fall back to your existing single-qubit / controlled gate logic
    matrix = this.buildGateMatrix(gateType, qubit, parameter, controlQubit, targetQubit);
  }

  // Apply the matrix to the state vector
  const newState = new Array(this.numStates);
  for (let i = 0; i < this.numStates; i++) {
    newState[i] = new ComplexNumber(0, 0);
    for (let j = 0; j < this.numStates; j++) {
      newState[i] = newState[i].add(matrix[i][j].multiply(this.stateVector[j]));
    }
  }
  this.stateVector = newState;
}


getApproxSingleQubitState(qubit) {
  // Take amplitude slices where other qubits are |0>
  const alpha = this.stateVector.filter((_, i) => ((i >> (this.numQubits - 1 - qubit)) & 1) === 0)
                                .reduce((acc, val) => acc.add(val), new ComplexNumber(0, 0));
  const beta  = this.stateVector.filter((_, i) => ((i >> (this.numQubits - 1 - qubit)) & 1) === 1)
                                .reduce((acc, val) => acc.add(val), new ComplexNumber(0, 0));
  
  // Normalize
  const norm = Math.sqrt(alpha.magnitude()**2 + beta.magnitude()**2);
  if (norm > 1e-12) {
    alpha.real /= norm; alpha.imag /= norm;
    beta.real  /= norm; beta.imag  /= norm;
  }
  
  return { alpha, beta };
}

getBlochVectorApprox(qubit) {
  const { alpha, beta } = this.getApproxSingleQubitState(qubit);
  const x = 2 * (alpha.real * beta.real + alpha.imag * beta.imag);
  const y = 2 * (alpha.real * beta.imag - alpha.imag * beta.real);
  const z = alpha.magnitude()**2 - beta.magnitude()**2;
  return { x, y, z };
}

  getBlochVector(qubit) {
  const densityMatrix = this.getReducedDensityMatrix(qubit);
  let x = 2 * densityMatrix[0][1].real;
  let y = 2 * densityMatrix[0][1].imag;
  let z = densityMatrix[0][0].real - densityMatrix[1][1].real;

  // Normalize to unit length to represent pure state visually
  const length = Math.sqrt(x * x + y * y + z * z);
  if (length > 1e-10) {
    x /= length;
    y /= length;
    z /= length;
  } else {
    // Default to |0> if length is too small
    x = 0;
    y = 0;
    z = 0;
  }

  return { x, y, z };
}

    
    getReducedDensityMatrix(qubit) {
        const rho = [];
        for (let i = 0; i < 2; i++) {
            rho[i] = [];
            for (let j = 0; j < 2; j++) {
                rho[i][j] = new ComplexNumber(0, 0);
            }
        }
        
        for (let state = 0; state < this.numStates; state++) {
            const qubitState = (state >> (this.numQubits - 1 - qubit)) & 1;
            for (let otherState = 0; otherState < this.numStates; otherState++) {
                const otherQubitState = (otherState >> (this.numQubits - 1 - qubit)) & 1;
                
                // Check if all other qubits are the same
                let sameOthers = true;
                for (let q = 0; q < this.numQubits; q++) {
                    if (q !== qubit) {
                        const bit1 = (state >> (this.numQubits - 1 - q)) & 1;
                        const bit2 = (otherState >> (this.numQubits - 1 - q)) & 1;
                        if (bit1 !== bit2) {
                            sameOthers = false;
                            break;
                        }
                    }
                }
                
                if (sameOthers) {
                    rho[qubitState][otherQubitState] = rho[qubitState][otherQubitState].add(
                        this.stateVector[state].multiply(this.stateVector[otherState].conjugate())
                    );
                }
            }
        }
        
        return rho;
    }
    getDensityMatrix() {
    const n = this.numStates;           // 2^numQubits
    const rho = Array.from({ length: n }, () => Array(n).fill(null));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            // ρ_ij = ψ_i * ψ*_j
            rho[i][j] = this.stateVector[i].multiply(this.stateVector[j].conjugate());
        }
    }
    return rho;
}
    getMeasurementProbabilities() {
        const probs = [];
        for (let state = 0; state < this.numStates; state++) {
            const prob = this.stateVector[state].magnitude() ** 2;
            if (prob > 1e-10) {
                probs.push({
                    state: state.toString(2).padStart(this.numQubits, '0'),
                    probability: prob
                });
            }
        }
        return probs.sort((a, b) => b.probability - a.probability);
    }
}

class BlochSphere {
    constructor(container, label, colors) {
        this.container = container;
        this.label = label;
        this.colors = colors;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = null;
        this.stateVector = new THREE.Vector3(0, 0, 1);
        this.arrow = null;
        this.trail = [];
        this.trailLine = null;
        this.showTrails = true;
        this.showGrid = true;
        this.showLabels = true;
        this.sphereGroup = new THREE.Group();
        this.scene.add(this.sphereGroup);

        
        this.init();
    }


createXMarker(position, size = 0.05, color = 0x32B8C6) {
    const material = new THREE.LineBasicMaterial({ color: color });
    const group = new THREE.Group();

    // Normal vector (radial outward from origin)
    const normal = position.clone().normalize();

    // Find an arbitrary vector not parallel to normal
    const arbitrary = Math.abs(normal.x) < 0.9 ? new THREE.Vector3(1,0,0) : new THREE.Vector3(0,1,0);

    // First tangent direction
    const tangent1 = new THREE.Vector3().crossVectors(normal, arbitrary).normalize();
    // Second tangent direction (perpendicular to both normal and tangent1)
    const tangent2 = new THREE.Vector3().crossVectors(normal, tangent1).normalize();

    const halfSize = size / 2;

    // First line (tangent1 direction)
    const geometry1 = new THREE.BufferGeometry().setFromPoints([
        position.clone().add(tangent1.clone().multiplyScalar(-halfSize)),
        position.clone().add(tangent1.clone().multiplyScalar(halfSize))
    ]);
    const line1 = new THREE.Line(geometry1, material);

    // Second line (tangent2 direction)
    const geometry2 = new THREE.BufferGeometry().setFromPoints([
        position.clone().add(tangent2.clone().multiplyScalar(-halfSize)),
        position.clone().add(tangent2.clone().multiplyScalar(halfSize))
    ]);
    const line2 = new THREE.Line(geometry2, material);

    group.add(line1);
    group.add(line2);

    return group;
}

createLongitudeEdgesWithXMarkers(numEdges = 22, numMarkers = 38) {
    const radius = 1;
    for (let i = 0; i < numEdges; i++) {
        const phi = (i / numEdges) * 2 * Math.PI; // longitude angle
        const points = [];
        const segments = 64; // smooth line segments
        for (let j = 0; j <= segments; j++) {
            const theta = (j / segments) * Math.PI; // polar angle from north to south
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);
            points.push(new THREE.Vector3(x, y, z));
        }
        // Create longitude line
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: (250,250,250), opacity: 0.1, transparent: true });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);

        // Add "x" markers evenly spaced along the longitude line (skip north and south pole)
        for (let k = 1; k <= numMarkers; k++) {
            const frac = k / (numMarkers + 1); // fraction along the line
            const theta = frac * Math.PI;
            const posX = radius * Math.sin(theta) * Math.cos(phi);
            const posY = radius * Math.sin(theta) * Math.sin(phi);
            const posZ = radius * Math.cos(theta);
            const xMarker = this.createXMarker(new THREE.Vector3(posX, posY, posZ), 0.025, 0x32B8C6
, Math.PI / 6);
            this.scene.add(xMarker);
        }
    }
}



  init() {
    const size = Math.min(this.container.clientWidth, 300);

    // WebGL renderer (sphere, axes, arrow)
    this.renderer.setSize(size, size);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    // CSS2D renderer for labels
this.labelRenderer = new THREE.CSS2DRenderer();
this.labelRenderer.setSize(size, size);
this.labelRenderer.domElement.style.position = "absolute";
this.labelRenderer.domElement.style.top = "0";
this.labelRenderer.domElement.style.left = "0";
this.labelRenderer.domElement.style.pointerEvents = "none"; // don't block OrbitControls
this.container.appendChild(this.labelRenderer.domElement);


    // Camera position
    this.camera.position.set(2, 1, 1);
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);

    // OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    this.createSphere();
    this.createAxes();
    this.createLabels();
    this.createStateArrow();
    this.createLongitudeEdgesWithXMarkers();

    this.animate();
}


    
    createSphere() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0x3399ff,
        transparent: true,
        opacity: 0.25,
        shininess: 80,
        side: THREE.DoubleSide
    });
    this.sphereMesh = new THREE.Mesh(geometry, material);   // ✅ keep reference
    this.scene.add(this.sphereMesh);

    const wireframeGeometry = new THREE.SphereGeometry(1, 16, 1);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    this.wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial); // ✅ keep reference
    this.scene.add(this.wireframeMesh);
}

    
    
    createAxes() {
        // X axis (red)
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1.2, 0, 0),
            new THREE.Vector3(1.2, 0, 0)
        ]);
        const xMaterial = new THREE.LineBasicMaterial({ color: 0xff4444 });
        const xLine = new THREE.Line(xGeometry, xMaterial);
        this.scene.add(xLine);
        
        // Y axis (green)
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -1.2, 0),
            new THREE.Vector3(0, 1.2, 0)
        ]);
        const yMaterial = new THREE.LineBasicMaterial({ color: 0x44ff44 });
        const yLine = new THREE.Line(yGeometry, yMaterial);
        this.scene.add(yLine);
        
        // Z axis (blue)
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -1.2),
            new THREE.Vector3(0, 0, 1.2)
        ]);
        const zMaterial = new THREE.LineBasicMaterial({ color: 0x4444ff });
        const zLine = new THREE.Line(zGeometry, zMaterial);
        this.scene.add(zLine);
    }
    createLabel(text, position, color = "#ffffff") {
    const div = document.createElement("div");
    div.className = "bloch-label-text";
    div.textContent = text;
    div.style.color = color;

    const label = new THREE.CSS2DObject(div);
    label.position.copy(position);

    // attach to scene for labelRenderer
    this.scene.add(label);
    return label;
}
    
   createLabels() {
    const offset = 1.2; // distance from origin

    // Z axis
    this.createLabel("|0⟩", new THREE.Vector3(0, 0, offset), "#00ff00");
    this.createLabel("|1⟩", new THREE.Vector3(0, 0, -offset), "#00ff00");

    // X axis
    this.createLabel("|+⟩", new THREE.Vector3(offset, 0, 0), "#ffff00");
    this.createLabel("|-⟩", new THREE.Vector3(-offset, 0, 0), "#ffff00");

    // Y axis
    this.createLabel("|+i⟩", new THREE.Vector3(0, offset, 0), "#ff00ff");
    this.createLabel("|-i⟩", new THREE.Vector3(0, -offset, 0), "#ff00ff");
}




    
  createStateArrow(radius = 0.03, shaftHeight = 0.7, headRadius = 0.07, headHeight = 0.18, color = 0xffff00) {
    const shaftMaterial = new THREE.MeshBasicMaterial({ color });
    const headMaterial = new THREE.MeshBasicMaterial({ color });

    // Shaft (cylinder)
    const shaftGeometry = new THREE.CylinderGeometry(radius, radius, shaftHeight, 32);
    this.shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);

    // move shaft so its base is at origin
    this.shaft.position.set(0, 0, shaftHeight / 2);
    this.shaft.rotation.x = Math.PI / 2;

    // Head (cone)
    const headGeometry = new THREE.ConeGeometry(headRadius, headHeight, 32);
    this.head = new THREE.Mesh(headGeometry, headMaterial);

    // place at tip of shaft
    this.head.position.set(0, 0, shaftHeight + headHeight / 2);
    this.head.rotation.x = Math.PI / 2;

    // Group together
    this.arrowGroup = new THREE.Group();
    this.arrowGroup.add(this.shaft);
    this.arrowGroup.add(this.head);

    this.scene.add(this.arrowGroup);
}

    
   updateState(x, y, z) {
    this.stateVector.set(x, y, z);

    if (this.arrowGroup) {
        const dir = new THREE.Vector3(x, y, z).normalize();
        const axis = new THREE.Vector3(0, 0, 1); // default arrow points along +Z
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
        this.arrowGroup.setRotationFromQuaternion(quaternion);
    }

    // Keep your trail logic
    if (this.showTrails) {
        this.trail.push(new THREE.Vector3(x, y, z));
        if (this.trail.length > 50) {
            this.trail.shift();
        }
        this.updateTrail();
    }
}

    
    updateTrail() {
        if (this.trailLine) {
            this.scene.remove(this.trailLine);
        }
        
        if (this.trail.length > 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(this.trail);
            const material = new THREE.LineBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.5
            });
            this.trailLine = new THREE.Line(geometry, material);
            this.scene.add(this.trailLine);
        }
    }
    
    clearTrail() {
        this.trail = [];
        if (this.trailLine) {
            this.scene.remove(this.trailLine);
            this.trailLine = null;
        }
    }
    
animate() {
  requestAnimationFrame(() => this.animate());

  if (this.autoRotate) {
    const time = Date.now() * 0.0005;   // speed
    const radius = 3;
    const height = 1.5;

    this.camera.position.x = radius * Math.cos(time);
    this.camera.position.y = radius * Math.sin(time);
    this.camera.position.z = height;

    this.camera.lookAt(0, 0, 0);
  }

  if (this.controls) this.controls.update();
  this.renderer.render(this.scene, this.camera);
  if (this.labelRenderer) this.labelRenderer.render(this.scene, this.camera);
}




resize() {
    const size = Math.min(this.container.clientWidth, 300);
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(size, size);
    if (this.labelRenderer) this.labelRenderer.setSize(size, size);  // <-- add this
}

}

class QuantumCircuitApp {
    constructor() {
        this.simulator = new QuantumSimulator(1);
        this.circuit = [];
        this.selectedGate = null;
        this.blochSpheres = [];
        this.currentTab = 'bloch';
        this.showTrails = true;
        this.showGrid = true;
        this.showLabels = true;
        this.mode = 'view';
        this.pendingGate = null;
        this.autoRotate = true;   // sphere spins by default
 document.getElementById("toggle-rotation").addEventListener("click", () => {
            this.blochSpheres.forEach(blochSphere => {
                blochSphere.autoRotate = !blochSphere.autoRotate; // flip flag
            });
        });
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createCircuitCanvas();
        this.createBlochSpheres();
        this.updateVisualizations();
        this.updateGateVisibility(this.simulator.numQubits);
    }
    
    setupEventListeners() {
        // Gate palette
        document.querySelectorAll('.gate-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectGate(e.target.dataset.gate);
            });
        });
        
        // Qubit count - Fixed event listener
        const qubitSelect = document.getElementById('qubitCount');
        if (qubitSelect) {
            qubitSelect.addEventListener('change', (e) => {
                this.setNumQubits(parseInt(e.target.value));
            });
        }
        
        // Example circuits - Fixed event listener
        const exampleSelect = document.getElementById('exampleCircuit');
        if (exampleSelect) {
            exampleSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadExampleCircuit(e.target.value);
                }
            });
        }
        
        // Action buttons
        document.getElementById('resetCircuit').addEventListener('click', () => {
            this.resetCircuit();
        });
        
        document.getElementById('exportCircuit').addEventListener('click', () => {
            this.exportCircuit();
        });
        
        // Tab navigation - Fixed tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
     
        // Modal events
        this.setupModalEvents();
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.resizeBlochSpheres();
        });
    }
    
    setupModalEvents() {
        const modal = document.getElementById('parameterModal');
        const closeBtn = document.getElementById('modalClose');
        const cancelBtn = document.getElementById('modalCancel');
        const applyBtn = document.getElementById('modalApply');
        const slider = document.getElementById('angleSlider');
        const input = document.getElementById('angleInput');
        
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        applyBtn.addEventListener('click', () => this.applyGateParameter());
        
        slider.addEventListener('input', (e) => {
            input.value = e.target.value;
        });
        
        input.addEventListener('input', (e) => {
            slider.value = e.target.value;
        });
        
        document.querySelectorAll('[data-angle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const angle = parseFloat(e.target.dataset.angle);
                slider.value = angle;
                input.value = angle;
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }
    
    selectGate(gateType) {
        document.querySelectorAll('.gate-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedButton = document.querySelector(`[data-gate="${gateType}"]`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }
        this.selectedGate = gateType;
    }
    
    setNumQubits(numQubits) {
        this.simulator.setNumQubits(numQubits);
        this.circuit = [];
        this.createCircuitCanvas();
        this.createBlochSpheres();
        this.updateVisualizations();
        this.updateGateVisibility(numQubits);
    }
    
    createCircuitCanvas() {
        const canvas = document.getElementById('circuitCanvas');
        canvas.innerHTML = '';
        
        for (let qubit = 0; qubit < this.simulator.numQubits; qubit++) {
            const wire = document.createElement('div');
            wire.className = 'qubit-wire';
            wire.dataset.qubit = qubit;
            
            const label = document.createElement('div');
            label.className = 'qubit-label';
            label.textContent = `|q${qubit}⟩`;
            wire.appendChild(label);
            
            // Add gate slots
            for (let step = 0; step < 20; step++) {
                const slot = document.createElement('div');
                slot.className = 'gate-slot';
                slot.dataset.qubit = qubit;
                slot.dataset.step = step;
                slot.addEventListener('click', (e) => this.handleSlotClick(e));
                wire.appendChild(slot);
            }
            
            canvas.appendChild(wire);
        }
        
        this.renderCircuit();
    }
    
handleSlotClick(event) {
  const qubit = parseInt(event.target.dataset.qubit);
  const step = parseInt(event.target.dataset.step);

  // If slot already has a gate → remove it
  if (event.target.classList.contains('has-gate')) {
    this.removeGate(qubit, step);
    return;
  }

  if (!this.selectedGate) return;

  // --- Rotation gates (need angle) ---
  if (['RX', 'RY', 'RZ'].includes(this.selectedGate)) {
    this.pendingGate = { type: this.selectedGate, qubit, step };
    this.showParameterModal(this.selectedGate);
    return;
  }

  // --- Controlled gates (CNOT, CZ): two-click process ---
  if (['CNOT', 'CZ'].includes(this.selectedGate)) {
    if (!this.pendingControlledGate) {
      // First click → set control
      this.pendingControlledGate = { type: this.selectedGate, control: qubit, step };
      const controlSlot = document.querySelector(
        `[data-qubit="${qubit}"][data-step="${step}"]`
      );
      if (controlSlot) {
        controlSlot.classList.add('has-gate');
        const dot = document.createElement('div');
        dot.className = 'control-dot pending-dot';
        controlSlot.appendChild(dot);
      }
    } else {
      // Second click → must be same step, different qubit
      if (
        qubit === this.pendingControlledGate.control ||
        step !== this.pendingControlledGate.step
      ) {
        alert("Target must be a different qubit at the same step.");
        this.clearPendingControlledGate();
        return;
      }
      this.circuit.push({
        type: this.pendingControlledGate.type,
        control: this.pendingControlledGate.control,
        target: qubit,
        step
      });
      this.clearPendingControlledGate();
      this.renderCircuit();
      this.runCircuit();
    }
    return;
  }

  // --- Toffoli (CCNOT): two controls and one target ---
  if (this.selectedGate === 'CCNOT') {
    if (!this.pendingToffoliGate) {
      this.pendingToffoliGate = { controls: [], target: null, step };
    }
    const gate = this.pendingToffoliGate;
    // Select controls first (two distinct qubits)
    if (gate.controls.length < 2) {
      if (!gate.controls.includes(qubit)) {
        gate.controls.push(qubit);
        const controlSlot = document.querySelector(
          `[data-qubit="${qubit}"][data-step="${step}"]`
        );
        if (controlSlot) {
          controlSlot.classList.add('has-gate');
          const dot = document.createElement('div');
          dot.className = 'control-dot pending-dot';
          controlSlot.appendChild(dot);
        }
      }
    } else if (gate.target === null) {
      // Select target, must be different from controls
      if (gate.controls.includes(qubit)) {
        alert("Target must be different from control qubits.");
        return;
      }
      gate.target = qubit;
      const targetSlot = document.querySelector(
        `[data-qubit="${qubit}"][data-step="${step}"]`
      );
      if (targetSlot) {
        targetSlot.classList.add('has-gate');
        targetSlot.textContent = '⊕';
      }
      this.circuit.push({
        type: 'CCNOT',
        controls: [...gate.controls],
        target: gate.target,
        step
      });
      this.pendingToffoliGate = null;
      this.renderCircuit();
      this.runCircuit();
    }
    return;
  }

  // --- Fredkin (CSWAP): one control and two targets ---
  if (this.selectedGate === 'CSWAP') {
    if (!this.pendingFredkinGate) {
      this.pendingFredkinGate = { control: null, targets: [], step };
    }
    const gate = this.pendingFredkinGate;
    if (gate.control === null) {
      gate.control = qubit;
      const controlSlot = document.querySelector(
        `[data-qubit="${qubit}"][data-step="${step}"]`
      );
      if (controlSlot) {
        controlSlot.classList.add('has-gate');
        const dot = document.createElement('div');
        dot.className = 'control-dot pending-dot';
        controlSlot.appendChild(dot);
      }
    } else if (gate.targets.length < 2) {
      if (qubit === gate.control) {
        alert("Targets must be different from control.");
        return;
      }
      if (!gate.targets.includes(qubit)) {
        gate.targets.push(qubit);
        const targetSlot = document.querySelector(
          `[data-qubit="${qubit}"][data-step="${step}"]`
        );
        if (targetSlot) {
          targetSlot.classList.add('has-gate');
          targetSlot.textContent = '-x-';
        }
      }
      if (gate.targets.length === 2) {
        this.circuit.push({
          type: 'CSWAP',
          control: gate.control,
          targets: [...gate.targets],
          step
        });
        this.pendingFredkinGate = null;
        this.renderCircuit();
        this.runCircuit();
      }
    }
    return;
  }

  // --- SWAP: exactly two targets, no control ---
  if (this.selectedGate === 'SWAP') {
    if (!this.pendingSwapGate) {
      this.pendingSwapGate = { targets: [], step };
    }
    const gate = this.pendingSwapGate;
    if (gate.targets.length < 2) {
      if (!gate.targets.includes(qubit)) {
        gate.targets.push(qubit);
        const targetSlot = document.querySelector(
          `[data-qubit="${qubit}"][data-step="${step}"]`
        );
        if (targetSlot) {
          targetSlot.classList.add('has-gate');
          targetSlot.textContent = '×'; // swap symbol
        }
      }
      if (gate.targets.length === 2) {
        this.circuit.push({
          type: 'SWAP',
          targets: [...gate.targets],
          step
        });
        this.pendingSwapGate = null;
        this.renderCircuit();
        this.runCircuit();
      }
    }
    return;
  }

  // --- Default single-qubit gates ---
  this.circuit.push({ type: this.selectedGate, qubit, step });
  this.renderCircuit();
  this.runCircuit();
}



clearPendingControlledGate() {
    this.pendingControlledGate = null;
    // Remove temporary pending dot
    document.querySelectorAll('.pending-dot').forEach(el => el.remove());
    document.querySelectorAll('.pending-control').forEach(el => el.classList.remove('pending-control'));
}


removeGate(qubit, step) {
    this.circuit = this.circuit.filter(gate =>
        !(gate.qubit === qubit && gate.step === step) &&
        !(gate.target === qubit && gate.step === step) &&
        !(gate.control === qubit && gate.step === step)
    );
    this.renderCircuit();
    this.runCircuit();
}


    
    showParameterModal(gateType) {
        const modal = document.getElementById('parameterModal');
        const title = document.getElementById('modalTitle');
        title.textContent = `Set ${gateType} Parameter`;
        modal.classList.remove('hidden');
    }
    
    closeModal() {
        document.getElementById('parameterModal').classList.add('hidden');
        this.pendingGate = null;
    }
    
    applyGateParameter() {
        const angle = parseFloat(document.getElementById('angleInput').value);
        if (this.pendingGate) {
            this.circuit.push({
                ...this.pendingGate,
                parameter: angle
            });
            this.renderCircuit();
            this.runCircuit();
        }
        this.closeModal();
    }
renderCircuit() {
  const circuitCanvas = document.querySelector(".circuit-canvas");

  // Clear existing gates
  document.querySelectorAll(".gate-slot").forEach(slot => {
    slot.classList.remove("has-gate");
    slot.textContent = "";
  });

  // Remove existing control lines and dots
  document.querySelectorAll(".control-line, .control-dot").forEach(el => el.remove());

  // Render gates
  this.circuit.forEach(gate => {
    if (gate.type === "CNOT" || gate.type === "CZ") {
      // --- Controlled gate (one control, one target) ---
      this.renderControlledGate(gate);

      const allQubits = [gate.control, gate.target].sort((a, b) => a - b);
      const minQubit = allQubits[0];
      const maxQubit = allQubits[allQubits.length - 1];

      const line = document.createElement("div");
      line.className = "control-line";
      line.style.top = `${minQubit * (36 + 16) + 18}px`;
      line.style.height = `${(maxQubit - minQubit) * (36 + 16)}px`;

      const refSlot = document.querySelector(
        `[data-qubit="${minQubit}"][data-step="${gate.step}"]`
      );
      if (refSlot) {
        const slotRect = refSlot.getBoundingClientRect();
        const containerRect = circuitCanvas.getBoundingClientRect();
        const centerX = slotRect.left - containerRect.left + slotRect.width / 2;
        line.style.left = `${centerX}px`;
      }
      circuitCanvas.appendChild(line);

    } else if (gate.type === "CCNOT") {
      // --- Toffoli gate (two controls, one target) ---
      gate.controls.forEach(controlQubit => {
        const controlSlot = document.querySelector(
          `[data-qubit="${controlQubit}"][data-step="${gate.step}"]`
        );
        if (controlSlot) {
          controlSlot.classList.add("has-gate");
          const dot = document.createElement("div");
          dot.className = "control-dot";
          controlSlot.appendChild(dot);
        }
      });

      const targetSlot = document.querySelector(
        `[data-qubit="${gate.target}"][data-step="${gate.step}"]`
      );
      if (targetSlot) {
        targetSlot.classList.add("has-gate");
        targetSlot.textContent = "⊕";
      }

      const allQubits = [...gate.controls, gate.target].sort((a, b) => a - b);
      const minQubit = allQubits[0];
      const maxQubit = allQubits[allQubits.length - 1];

      const line = document.createElement("div");
      line.className = "control-line";
      line.style.top = `${minQubit * (36 + 16) + 18}px`;
      line.style.height = `${(maxQubit - minQubit) * (36 + 16)}px`;

      const refSlot = document.querySelector(
        `[data-qubit="${minQubit}"][data-step="${gate.step}"]`
      );
      if (refSlot) {
        const slotRect = refSlot.getBoundingClientRect();
        const containerRect = circuitCanvas.getBoundingClientRect();
        const centerX = slotRect.left - containerRect.left + slotRect.width / 2;
        line.style.left = `${centerX}px`;
      }
      circuitCanvas.appendChild(line);

    } else if (gate.type === "CSWAP") {
      // --- Fredkin gate (one control, two targets) ---
      const controlSlot = document.querySelector(
        `[data-qubit="${gate.control}"][data-step="${gate.step}"]`
      );
      if (controlSlot) {
        controlSlot.classList.add("has-gate");
        const dot = document.createElement("div");
        dot.className = "control-dot";
        controlSlot.appendChild(dot);
      }

      gate.targets.forEach(targetQubit => {
        const targetSlot = document.querySelector(
          `[data-qubit="${targetQubit}"][data-step="${gate.step}"]`
        );
        if (targetSlot) {
          targetSlot.classList.add("has-gate");
          targetSlot.textContent = "×";
        }
      });

      const allQubits = [gate.control, ...gate.targets].sort((a, b) => a - b);
      const minQubit = allQubits[0];
      const maxQubit = allQubits[allQubits.length - 1];

      const line = document.createElement("div");
      line.className = "control-line";
      line.style.top = `${minQubit * (36 + 16) + 18}px`;
      line.style.height = `${(maxQubit - minQubit) * (36 + 16)}px`;

      const refSlot = document.querySelector(
        `[data-qubit="${minQubit}"][data-step="${gate.step}"]`
      );
      if (refSlot) {
        const slotRect = refSlot.getBoundingClientRect();
        const containerRect = circuitCanvas.getBoundingClientRect();
        const centerX = slotRect.left - containerRect.left + slotRect.width / 2;
        line.style.left = `${centerX}px`;
      }
      circuitCanvas.appendChild(line);

    } else if (gate.type === "SWAP") {
      // --- Plain SWAP (two targets, no control) ---
      gate.targets.forEach(targetQubit => {
        const targetSlot = document.querySelector(
          `[data-qubit="${targetQubit}"][data-step="${gate.step}"]`
        );
        if (targetSlot) {
          targetSlot.classList.add("has-gate");
          targetSlot.textContent = "×";
        }
      });

      const allQubits = [...gate.targets].sort((a, b) => a - b);
      const minQubit = allQubits[0];
      const maxQubit = allQubits[allQubits.length - 1];

      const line = document.createElement("div");
      line.className = "control-line";
      line.style.top = `${minQubit * (36 + 16) + 18}px`;
      line.style.height = `${(maxQubit - minQubit) * (36 + 16)}px`;

      const refSlot = document.querySelector(
        `[data-qubit="${minQubit}"][data-step="${gate.step}"]`
      );
      if (refSlot) {
        const slotRect = refSlot.getBoundingClientRect();
        const containerRect = circuitCanvas.getBoundingClientRect();
        const centerX = slotRect.left - containerRect.left + slotRect.width / 2;
        line.style.left = `${centerX}px`;
      }
      circuitCanvas.appendChild(line);

    } else {
      // --- Single-qubit gates ---
      this.renderSingleGate(gate);
    }
  });
}


getSwapMatrix() {
  const size = this.numStates;
  const matrix = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new ComplexNumber(0, 0))
  );

  for (let i = 0; i < size; i++) {
    let j = i;

    // extract bit values
    const bitA = (i >> (this.numQubits - 1 - this.swapQubits[0])) & 1;
    const bitB = (i >> (this.numQubits - 1 - this.swapQubits[1])) & 1;

    // swap bits if different
    if (bitA !== bitB) {
      j = i ^ ((1 << (this.numQubits - 1 - this.swapQubits[0])) |
               (1 << (this.numQubits - 1 - this.swapQubits[1])));
    }

    matrix[j][i] = new ComplexNumber(1, 0);
  }

  return matrix;
}



updateGateVisibility(numQubits) {
    const single = document.getElementById("single-gates");
    const rotation = document.getElementById("rotation-gates");
    const two = document.getElementById("two-gates");
    const three = document.getElementById("three-gates");

    // Hide all first
    [single, rotation, two, three].forEach(section => {
        if (section) section.style.display = "none";
    });

    if (numQubits === 1) {
        if (single) single.style.display = "block";
        if (rotation) rotation.style.display = "block";
    } else if (numQubits === 2) {
        if (single) single.style.display = "block";
        if (rotation) rotation.style.display = "block";
        if (two) two.style.display = "block";
    } else if (numQubits === 3) {
        if (single) single.style.display = "block";
        if (rotation) rotation.style.display = "block";
        if (two) two.style.display = "block";
        if (three) three.style.display = "block";
    } else if (numQubits >= 4) {
        // Show everything
        [single, rotation, two, three].forEach(section => {
            if (section) section.style.display = "block";
        });
    }
}

    
    renderSingleGate(gate) {
        const slot = document.querySelector(`[data-qubit="${gate.qubit}"][data-step="${gate.step}"]`);
        if (slot) {
            slot.classList.add('has-gate');
            slot.textContent = gate.type;
            if (gate.parameter !== undefined) {
                slot.title = `${gate.type}(${gate.parameter.toFixed(2)})`;
            }
        }
    }
    
        renderControlledGate(gate) {
            const controlSlot = document.querySelector(`[data-qubit="${gate.control}"][data-step="${gate.step}"]`);
            const targetSlot = document.querySelector(`[data-qubit="${gate.target}"][data-step="${gate.step}"]`);
            
            if (controlSlot && targetSlot) {
                // Control dot
                const controlDot = document.createElement('div');
                controlDot.className = 'control-dot';
                controlSlot.appendChild(controlDot);
                
                // Target gate
                targetSlot.classList.add('has-gate');
                targetSlot.textContent = gate.type === 'CNOT' ? '⊕' : 'Z';
                
                // Control line
                const minQubit = Math.min(gate.control, gate.target);
                const maxQubit = Math.max(gate.control, gate.target);
                const lineHeight = (maxQubit - minQubit) * (40 + 16); // wire height + margin
                
                const controlLine = document.createElement('div');
                controlLine.className = 'control-line';
                controlLine.style.height = `${lineHeight}px`;
                controlLine.style.top = minQubit === gate.control ? '18px' : `-${lineHeight - 18}px`;
                
                controlSlot.style.position = 'relative';
                controlSlot.appendChild(controlLine);
            }
        }
    
    runCircuit() {
        this.simulator.reset();
        
        // Sort gates by step
        const sortedGates = this.circuit.slice().sort((a, b) => a.step - b.step);
        
        sortedGates.forEach(gate => {
            if (gate.type === 'CNOT' || gate.type === 'CZ') {
                this.simulator.applyGate(gate.type, -1, 0, gate.control, gate.target);
            } else {
                this.simulator.applyGate(gate.type, gate.qubit, gate.parameter || 0);
            }
        });
        
        this.updateVisualizations();
    }
    
   loadExampleCircuit(example) {
    if (!example) return;
    
    const examples = {
        bell: [
            { type: 'H', qubit: 0, step: 0 },
            { type: 'CNOT', control: 0, target: 1, step: 1 }
        ],
        ghz: [
            { type: 'H', qubit: 0, step: 0 },
            { type: 'CNOT', control: 0, target: 1, step: 1 },
            { type: 'CNOT', control: 1, target: 2, step: 2 }
        ],
       superposition: Array.from({ length: this.simulator.numQubits }, (_, i) => ({
            type: 'H',
            qubit: i,
            step: 0
        })),
        mixed: [
            { type: 'H', qubit: 0, step: 0 },
            { type: 'RY', qubit: 0, step: 1, parameter: Math.PI / 4 },
            { type: 'RX', qubit: 1, step: 0, parameter: Math.PI / 3 }
        ]
    };

    if (examples[example]) {
        // Ensure enough qubits
        const maxQubit = Math.max(...examples[example].map(g =>
            Math.max(g.qubit ?? 0, g.control ?? 0, g.target ?? 0)
        ));
        
        if (maxQubit >= this.simulator.numQubits) {
            document.getElementById('qubitCount').value = maxQubit + 1;
            this.setNumQubits(maxQubit + 1);
        }

        // Load example circuit
        this.circuit = examples[example];
        this.renderCircuit();
        this.runCircuit();

        // ✅ Keep dropdown on selected option
        document.getElementById('exampleCircuit').value = example;
    }
}

resetCircuit() {
    this.circuit = [];
    this.simulator.reset();
    this.renderCircuit();
    this.updateVisualizations();
    this.blochSpheres.forEach(sphere => sphere.clearTrail());

    // ✅ Reset dropdown back to default
    const exampleSelect = document.getElementById('exampleCircuit');
    if (exampleSelect) exampleSelect.value = '';
}

exportCircuit() {
    const exportData = {
        numQubits: this.simulator.numQubits,
        circuit: this.circuit,
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum_circuit.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Feedback animation
    const button = document.getElementById('exportCircuit');
    const originalText = button.textContent;
    button.textContent = 'Exported!';
    button.classList.add('btn--success');

    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('btn--success');
    }, 2000);
}

    
    createBlochSpheres() {
        const container = document.getElementById('blochContainer');
        container.innerHTML = '';
        this.blochSpheres = [];
        
        for (let i = 0; i < this.simulator.numQubits; i++) {
            const sphereContainer = document.createElement('div');
            sphereContainer.className = 'bloch-sphere';
            
            const label = document.createElement('div');
            label.className = 'bloch-label';
            label.textContent = `Qubit ${i}`;
            sphereContainer.appendChild(label);
            
            container.appendChild(sphereContainer);
            
            const sphere = new BlochSphere(sphereContainer, `Qubit ${i}`, {
                primary: '#32808d',
                xAxis: '#ff4444',
                yAxis: '#44ff44',
                zAxis: '#4444ff',
                arrow: '#ffff00'
            });
            
            this.blochSpheres.push(sphere);
        }
    }
    
    updateBlochSphereSettings() {
        this.blochSpheres.forEach(sphere => {
            sphere.showTrails = this.showTrails;
            sphere.showGrid = this.showGrid;
            sphere.showLabels = this.showLabels;
            
            if (!this.showTrails) {
                sphere.clearTrail();
            }
        });
    }
    
    resizeBlochSpheres() {
        this.blochSpheres.forEach(sphere => sphere.resize());
    }
    
    updateVisualizations() {
        this.updateBlochSpheres();
        this.updateStatesTab();
        this.updateMatricesTab();
    }
    
 updateBlochSpheres() {
    for (let i = 0; i < this.simulator.numQubits; i++) {
        // Use approximate Bloch vector (ignores entanglement)
        const blochVector = this.simulator.getBlochVectorApprox(i);
        if (this.blochSpheres[i]) {
            this.blochSpheres[i].updateState(blochVector.x, blochVector.y, blochVector.z);
        }
    }
}

    
    updateStatesTab() {
        const stateVector = document.getElementById('stateVector');
        const probabilities = document.getElementById('probabilities');
        
        // State vector display
        let stateHtml = '<div class="state-display">';
        this.simulator.stateVector.forEach((amplitude, index) => {
            const state = index.toString(2).padStart(this.simulator.numQubits, '0');
            const prob = amplitude.magnitude() ** 2;
            if (prob > 1e-10) {
                stateHtml += `<div class="state-item">|${state}⟩: ${amplitude.toString()}</div>`;
            }
        });
        stateHtml += '</div>';
        stateVector.innerHTML = stateHtml;
        
        // Measurement probabilities
        const probs = this.simulator.getMeasurementProbabilities();
        let probHtml = '';
        probs.forEach(prob => {
            probHtml += `
                <div class="probability-item">
                    <span>|${prob.state}⟩</span>
                    <span>${(prob.probability * 100).toFixed(1)}%</span>
                    <div class="probability-bar">
                        <div class="probability-fill" style="width: ${prob.probability * 100}%"></div>
                    </div>
                </div>
            `;
        });
        probabilities.innerHTML = probHtml;
    }
    
      
updateMatricesTab() {
    const densityMatrix = document.getElementById('densityMatrix');
    const reducedMatrices = document.getElementById('reducedMatrices');

    // --- Full density matrix ---
    const rhoFull = this.simulator.getDensityMatrix();
    const dim = rhoFull.length;

    let densityHtml = '<div class="matrix-title">Full system density matrix ρ</div>';
    densityHtml += '<table class="matrix-table">';
    for (let r = 0; r < dim; r++) {
        densityHtml += '<tr>';
        for (let c = 0; c < dim; c++) {
            densityHtml += `<td>${rhoFull[r][c].toString()}</td>`;
        }
        densityHtml += '</tr>';
    }
    densityHtml += '</table>';
    densityMatrix.innerHTML = densityHtml;

    // --- Reduced density matrices (existing) ---
    let reducedHtml = '';
    for (let i = 0; i < this.simulator.numQubits; i++) {
        const rho = this.simulator.getReducedDensityMatrix(i);
        reducedHtml += `<h4>Qubit ${i}</h4>`;
        reducedHtml += '<table class="matrix-table">';
        for (let row = 0; row < 2; row++) {
            reducedHtml += '<tr>';
            for (let col = 0; col < 2; col++) {
                reducedHtml += `<td>${rho[row][col].toString()}</td>`;
            }
            reducedHtml += '</tr>';
        }
        reducedHtml += '</table>';
    }
    reducedMatrices.innerHTML = reducedHtml;
}
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const activeContent = document.getElementById(`${tabName}Tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        if (tabName === 'bloch') {
            // Trigger resize for Bloch spheres
            setTimeout(() => this.resizeBlochSpheres(), 100);
        }
    }
    
    setMode(mode) {
        document.querySelectorAll('#viewMode, #editMode, #measureMode').forEach(btn => {
            btn.classList.remove('btn--primary');
            btn.classList.add('btn--outline');
        });
        
        const activeMode = document.getElementById(`${mode}Mode`);
        if (activeMode) {
            activeMode.classList.remove('btn--outline');
            activeMode.classList.add('btn--primary');
        }
        
        this.mode = mode;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuantumCircuitApp();

    const resizer = document.querySelector(".resizer");
    const leftPanel = document.querySelector(".circuit-panel");
    const container = document.querySelector(".app-container");

    let isResizing = false;

    resizer.addEventListener("mousedown", () => {
      isResizing = true;
      document.body.style.cursor = "col-resize";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const minWidth = 200;
      const maxWidth = container.clientWidth * 0.7;
      const newWidth = Math.min(Math.max(e.clientX - container.offsetLeft, minWidth), maxWidth);
      leftPanel.style.flex = `0 0 ${newWidth}px`;
    });

    document.addEventListener("mouseup", () => {
      isResizing = false;
      document.body.style.cursor = "default";
    });
});
