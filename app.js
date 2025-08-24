// Enhanced Quantum Circuit Bloch Sphere Visualizer
// Fixed version with proper event handling and functionality

class Complex {
    constructor(real, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    static add(a, b) {
        return new Complex(a.real + b.real, a.imag + b.imag);
    }

    static multiply(a, b) {
        return new Complex(
            a.real * b.real - a.imag * b.imag,
            a.real * b.imag + a.imag * b.real
        );
    }

    static conjugate(a) {
        return new Complex(a.real, -a.imag);
    }

    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    phase() {
        return Math.atan2(this.imag, this.real);
    }

    toString() {
        if (Math.abs(this.imag) < 1e-10) return this.real.toFixed(3);
        if (Math.abs(this.real) < 1e-10) return `${this.imag.toFixed(3)}i`;
        const imagStr = this.imag >= 0 ? `+${this.imag.toFixed(3)}i` : `${this.imag.toFixed(3)}i`;
        return `${this.real.toFixed(3)}${imagStr}`;
    }
}

class QuantumGates {
    static get I() {
        return [
            [new Complex(1), new Complex(0)],
            [new Complex(0), new Complex(1)]
        ];
    }

    static get H() {
        const sqrt2 = 1 / Math.sqrt(2);
        return [
            [new Complex(sqrt2), new Complex(sqrt2)],
            [new Complex(sqrt2), new Complex(-sqrt2)]
        ];
    }

    static get X() {
        return [
            [new Complex(0), new Complex(1)],
            [new Complex(1), new Complex(0)]
        ];
    }

    static get Y() {
        return [
            [new Complex(0), new Complex(0, -1)],
            [new Complex(0, 1), new Complex(0)]
        ];
    }

    static get Z() {
        return [
            [new Complex(1), new Complex(0)],
            [new Complex(0), new Complex(-1)]
        ];
    }

    static get S() {
        return [
            [new Complex(1), new Complex(0)],
            [new Complex(0), new Complex(0, 1)]
        ];
    }

    static get T() {
        const sqrt2 = 1 / Math.sqrt(2);
        return [
            [new Complex(1), new Complex(0)],
            [new Complex(0), new Complex(sqrt2, sqrt2)]
        ];
    }

    static RX(angle) {
        const cos = Math.cos(angle / 2);
        const sin = Math.sin(angle / 2);
        return [
            [new Complex(cos), new Complex(0, -sin)],
            [new Complex(0, -sin), new Complex(cos)]
        ];
    }

    static RY(angle) {
        const cos = Math.cos(angle / 2);
        const sin = Math.sin(angle / 2);
        return [
            [new Complex(cos), new Complex(-sin)],
            [new Complex(sin), new Complex(cos)]
        ];
    }

    static RZ(angle) {
        const cos = Math.cos(angle / 2);
        const sin = Math.sin(angle / 2);
        return [
            [new Complex(cos, -sin), new Complex(0)],
            [new Complex(0), new Complex(cos, sin)]
        ];
    }
}

class QuantumSimulator {
    constructor(numQubits) {
        this.numQubits = numQubits;
        this.stateSize = Math.pow(2, numQubits);
        this.reset();
    }

    reset() {
        this.state = new Array(this.stateSize).fill(0).map(() => new Complex(0));
        this.state[0] = new Complex(1); // |00...0⟩
    }

    tensorProduct(matrixA, matrixB) {
        const rowsA = matrixA.length;
        const colsA = matrixA[0].length;
        const rowsB = matrixB.length;
        const colsB = matrixB[0].length;
        
        const result = [];
        for (let i = 0; i < rowsA * rowsB; i++) {
            result[i] = [];
            for (let j = 0; j < colsA * colsB; j++) {
                const aRow = Math.floor(i / rowsB);
                const aCol = Math.floor(j / colsB);
                const bRow = i % rowsB;
                const bCol = j % colsB;
                result[i][j] = Complex.multiply(matrixA[aRow][aCol], matrixB[bRow][bCol]);
            }
        }
        return result;
    }

    buildGateMatrix(gate, qubit, parameter = null) {
        let gateMatrix;
        
        switch (gate) {
            case 'H': gateMatrix = QuantumGates.H; break;
            case 'X': gateMatrix = QuantumGates.X; break;
            case 'Y': gateMatrix = QuantumGates.Y; break;
            case 'Z': gateMatrix = QuantumGates.Z; break;
            case 'S': gateMatrix = QuantumGates.S; break;
            case 'T': gateMatrix = QuantumGates.T; break;
            case 'RX': gateMatrix = QuantumGates.RX(parameter); break;
            case 'RY': gateMatrix = QuantumGates.RY(parameter); break;
            case 'RZ': gateMatrix = QuantumGates.RZ(parameter); break;
            default: gateMatrix = QuantumGates.I; break;
        }

        let fullMatrix = [[[new Complex(1)]]];
        
        for (let i = 0; i < this.numQubits; i++) {
            const currentGate = (i === qubit) ? gateMatrix : QuantumGates.I;
            if (i === 0) {
                fullMatrix = currentGate;
            } else {
                fullMatrix = this.tensorProduct(fullMatrix, currentGate);
            }
        }
        
        return fullMatrix;
    }

    buildTwoQubitGateMatrix(gate, control, target) {
        let fullMatrix = [];
        const size = this.stateSize;
        
        for (let i = 0; i < size; i++) {
            fullMatrix[i] = [];
            for (let j = 0; j < size; j++) {
                fullMatrix[i][j] = new Complex(i === j ? 1 : 0);
            }
        }

        if (gate === 'CNOT') {
            for (let i = 0; i < size; i++) {
                const controlBit = (i >> (this.numQubits - 1 - control)) & 1;
                if (controlBit === 1) {
                    const newState = i ^ (1 << (this.numQubits - 1 - target));
                    if (newState !== i) {
                        const temp = [...fullMatrix[i]];
                        fullMatrix[i] = [...fullMatrix[newState]];
                        fullMatrix[newState] = temp;
                    }
                }
            }
        } else if (gate === 'CZ') {
            for (let i = 0; i < size; i++) {
                const controlBit = (i >> (this.numQubits - 1 - control)) & 1;
                const targetBit = (i >> (this.numQubits - 1 - target)) & 1;
                if (controlBit === 1 && targetBit === 1) {
                    fullMatrix[i][i] = new Complex(-1);
                }
            }
        }
        
        return fullMatrix;
    }

    applyGate(gate, qubit, parameter = null) {
        const gateMatrix = this.buildGateMatrix(gate, qubit, parameter);
        this.applyMatrix(gateMatrix);
    }

    applyTwoQubitGate(gate, control, target) {
        const gateMatrix = this.buildTwoQubitGateMatrix(gate, control, target);
        this.applyMatrix(gateMatrix);
    }

    applyMatrix(matrix) {
        const newState = new Array(this.stateSize);
        for (let i = 0; i < this.stateSize; i++) {
            newState[i] = new Complex(0);
            for (let j = 0; j < this.stateSize; j++) {
                newState[i] = Complex.add(newState[i], Complex.multiply(matrix[i][j], this.state[j]));
            }
        }
        this.state = newState;
    }

    getDensityMatrix() {
        const rho = [];
        for (let i = 0; i < this.stateSize; i++) {
            rho[i] = [];
            for (let j = 0; j < this.stateSize; j++) {
                rho[i][j] = Complex.multiply(this.state[i], Complex.conjugate(this.state[j]));
            }
        }
        return rho;
    }

    getReducedDensityMatrix(qubit) {
        const rho = this.getDensityMatrix();
        const reducedSize = 2;
        const reduced = [];
        
        for (let i = 0; i < reducedSize; i++) {
            reduced[i] = [];
            for (let j = 0; j < reducedSize; j++) {
                reduced[i][j] = new Complex(0);
            }
        }

        for (let i = 0; i < this.stateSize; i++) {
            for (let j = 0; j < this.stateSize; j++) {
                const iBit = (i >> (this.numQubits - 1 - qubit)) & 1;
                const jBit = (j >> (this.numQubits - 1 - qubit)) & 1;
                
                let otherBitsMatch = true;
                for (let k = 0; k < this.numQubits; k++) {
                    if (k !== qubit) {
                        const iBitK = (i >> (this.numQubits - 1 - k)) & 1;
                        const jBitK = (j >> (this.numQubits - 1 - k)) & 1;
                        if (iBitK !== jBitK) {
                            otherBitsMatch = false;
                            break;
                        }
                    }
                }
                
                if (otherBitsMatch) {
                    reduced[iBit][jBit] = Complex.add(reduced[iBit][jBit], rho[i][j]);
                }
            }
        }
        
        return reduced;
    }

    getBlochVector(qubit) {
        const rho = this.getReducedDensityMatrix(qubit);
        
        const sigmaX = QuantumGates.X;
        const sigmaY = QuantumGates.Y;
        const sigmaZ = QuantumGates.Z;
        
        let x = 0, y = 0, z = 0;
        
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const productX = Complex.multiply(rho[i][j], sigmaX[j][i]);
                const productY = Complex.multiply(rho[i][j], sigmaY[j][i]);
                const productZ = Complex.multiply(rho[i][j], sigmaZ[j][i]);
                x += productX.real;
                y += productY.real;
                z += productZ.real;
            }
        }
        
        return { x, y, z };
    }

    getPurity(qubit) {
        const rho = this.getReducedDensityMatrix(qubit);
        let trace = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const product = Complex.multiply(rho[i][j], rho[j][i]);
                trace += product.real;
            }
        }
        return trace;
    }

    getMeasurementProbabilities(qubit) {
        const rho = this.getReducedDensityMatrix(qubit);
        return {
            zero: rho[0][0].real,
            one: rho[1][1].real,
            computational: { zero: rho[0][0].real, one: rho[1][1].real },
            hadamard: this.getMeasurementProbsInBasis(qubit, 'X'),
            circular: this.getMeasurementProbsInBasis(qubit, 'Y')
        };
    }

    getMeasurementProbsInBasis(qubit, basis) {
        const bloch = this.getBlochVector(qubit);
        switch (basis) {
            case 'X':
                const plusX = (1 + bloch.x) / 2;
                return { plus: plusX, minus: 1 - plusX };
            case 'Y':
                const plusY = (1 + bloch.y) / 2;
                return { plus: plusY, minus: 1 - plusY };
            default:
                const plusZ = (1 + bloch.z) / 2;
                return { plus: plusZ, minus: 1 - plusZ };
        }
    }

    getProbabilities() {
        const probs = [];
        for (let i = 0; i < this.stateSize; i++) {
            probs.push({
                state: i.toString(2).padStart(this.numQubits, '0'),
                probability: Math.pow(this.state[i].magnitude(), 2)
            });
        }
        return probs;
    }
}

class EnhancedBlochSphereRenderer {
    constructor(container, qubitIndex, config = {}) {
        this.container = container;
        this.qubitIndex = qubitIndex;
        this.config = {
            showTrails: config.showTrails !== false,
            showGrid: config.showGrid !== false,
            showLabels: config.showLabels !== false,
            interactionMode: config.interactionMode || 'view'
        };
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true
        });
        
        this.trails = [];
        this.maxTrailLength = 20;
        this.blochPoint = null;
        this.blochVector = null;
        this.probabilityClouds = [];
        
        this.setupRenderer();
        this.setupLighting();
        this.createEnhancedSphere();
        this.createAxes();
        this.createLabels();
        this.createGridLines();
        this.setupControls();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(300, 280);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        this.camera.position.set(2.5, 2, 2.5);
        this.camera.lookAt(0, 0, 0);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const rimLight = new THREE.DirectionalLight(0x32b8c5, 0.3);
        rimLight.position.set(-3, -3, -3);
        this.scene.add(rimLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
        pointLight.position.set(2, 2, 2);
        this.scene.add(pointLight);
    }

    createEnhancedSphere() {
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x32b8c5,
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 0.5,
            clearcoatRoughness: 0.1
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);
        this.sphereMaterial = material;
        
        const wireframeGeometry = new THREE.SphereGeometry(1.01, 32, 32);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x32b8c5,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const wireframeSphere = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.scene.add(wireframeSphere);
    }

    createAxes() {
        const axisLength = 1.3;
        const axisThickness = 0.02;
        
        // X axis (red)
        const xGeometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength * 2, 8);
        const xMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff4444,
            emissive: 0x220000
        });
        const xAxis = new THREE.Mesh(xGeometry, xMaterial);
        xAxis.rotation.z = Math.PI / 2;
        this.scene.add(xAxis);
        
        // Y axis (green)
        const yMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x44ff44,
            emissive: 0x002200
        });
        const yAxis = new THREE.Mesh(xGeometry, yMaterial);
        yAxis.rotation.x = Math.PI / 2;
        this.scene.add(yAxis);
        
        // Z axis (blue)
        const zMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4444ff,
            emissive: 0x000022
        });
        const zAxis = new THREE.Mesh(xGeometry, zMaterial);
        this.scene.add(zAxis);
        
        // Add arrows
        const arrowGeometry = new THREE.ConeGeometry(0.05, 0.1, 8);
        
        const xArrowPos = new THREE.Mesh(arrowGeometry, xMaterial);
        xArrowPos.position.set(axisLength, 0, 0);
        xArrowPos.rotation.z = -Math.PI / 2;
        this.scene.add(xArrowPos);
        
        const yArrowPos = new THREE.Mesh(arrowGeometry, yMaterial);
        yArrowPos.position.set(0, axisLength, 0);
        this.scene.add(yArrowPos);
        
        const zArrowPos = new THREE.Mesh(arrowGeometry, zMaterial);
        zArrowPos.position.set(0, 0, axisLength);
        this.scene.add(zArrowPos);
    }

    createLabels() {
        if (!this.config.showLabels) return;
        
        const labelDistance = 1.4;
        const labelSize = 0.08;
        const labelGeometry = new THREE.SphereGeometry(labelSize, 16, 16);
        
        // |0⟩ at north pole
        const zeroMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4444ff,
            emissive: 0x111144
        });
        const zeroLabel = new THREE.Mesh(labelGeometry, zeroMaterial);
        zeroLabel.position.set(0, 0, labelDistance);
        this.scene.add(zeroLabel);
        
        // |1⟩ at south pole
        const oneMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff4444,
            emissive: 0x441111
        });
        const oneLabel = new THREE.Mesh(labelGeometry, oneMaterial);
        oneLabel.position.set(0, 0, -labelDistance);
        this.scene.add(oneLabel);
    }

    createGridLines() {
        if (!this.config.showGrid) return;
        
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0x32b8c5,
            transparent: true,
            opacity: 0.2
        });
        
        // Equatorial line
        const equatorPoints = [];
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            equatorPoints.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
        }
        const equatorGeometry = new THREE.BufferGeometry().setFromPoints(equatorPoints);
        const equator = new THREE.Line(equatorGeometry, gridMaterial);
        this.scene.add(equator);
        
        // Meridian lines
        for (let j = 0; j < 8; j++) {
            const meridianPoints = [];
            const phi = (j / 8) * Math.PI * 2;
            for (let i = 0; i <= 32; i++) {
                const theta = (i / 32) * Math.PI;
                meridianPoints.push(new THREE.Vector3(
                    Math.sin(theta) * Math.cos(phi),
                    Math.sin(theta) * Math.sin(phi),
                    Math.cos(theta)
                ));
            }
            const meridianGeometry = new THREE.BufferGeometry().setFromPoints(meridianPoints);
            const meridian = new THREE.Line(meridianGeometry, gridMaterial);
            this.scene.add(meridian);
        }
    }

    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            const rotationSpeed = 0.005;
            this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deltaMove.x * rotationSpeed);
            this.camera.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -deltaMove.y * rotationSpeed);
            this.camera.lookAt(0, 0, 0);
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const distance = this.camera.position.length();
            const newDistance = Math.max(1.5, Math.min(6, distance + e.deltaY * zoomSpeed * 0.01));
            this.camera.position.normalize().multiplyScalar(newDistance);
        });
    }

    updateBlochVector(blochVector, options = {}) {
        this.removeOldElements();
        
        if (this.config.showTrails) {
            this.addToTrail(blochVector);
        }
        
        this.createStatePoint(blochVector, options);
        this.createVectorArrow(blochVector, options);
        
        if (options.purity && options.purity < 0.95) {
            this.createProbabilityClouds(blochVector, options);
        }
    }

    removeOldElements() {
        if (this.blochPoint) {
            this.scene.remove(this.blochPoint);
            this.blochPoint = null;
        }
        if (this.blochVector) {
            this.scene.remove(this.blochVector);
            this.blochVector = null;
        }
        this.probabilityClouds.forEach(cloud => this.scene.remove(cloud));
        this.probabilityClouds = [];
    }

    addToTrail(blochVector) {
        this.trails.push({
            position: new THREE.Vector3(blochVector.x, blochVector.y, blochVector.z),
            timestamp: Date.now()
        });
        
        if (this.trails.length > this.maxTrailLength) {
            this.trails.shift();
        }
        
        this.updateTrailVisualization();
    }

    updateTrailVisualization() {
        const oldTrail = this.scene.getObjectByName('blochTrail');
        if (oldTrail) this.scene.remove(oldTrail);
        
        if (this.trails.length < 2) return;
        
        const trailPoints = this.trails.map(t => t.position);
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        
        const colors = [];
        for (let i = 0; i < this.trails.length; i++) {
            const alpha = i / (this.trails.length - 1);
            const color = new THREE.Color().setHSL(0.5, 1, 0.5 + alpha * 0.5);
            colors.push(color.r, color.g, color.b);
        }
        trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        trail.name = 'blochTrail';
        this.scene.add(trail);
    }

    createStatePoint(blochVector, options) {
        const pointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const color = this.getQubitThemeColor(this.qubitIndex, 'primary');
        
        let pointMaterial;
        if (options.purity > 0.95) {
            pointMaterial = new THREE.MeshLambertMaterial({
                color: color,
                emissive: new THREE.Color(color).multiplyScalar(0.3)
            });
        } else {
            pointMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.7
            });
        }
        
        this.blochPoint = new THREE.Mesh(pointGeometry, pointMaterial);
        this.blochPoint.position.set(blochVector.x, blochVector.z, -blochVector.y); // Note coordinate mapping
        this.scene.add(this.blochPoint);
        
        if (options.purity > 0.95) {
            this.addPulsingEffect(this.blochPoint);
        }
    }

    createVectorArrow(blochVector, options) {
        const length = Math.sqrt(blochVector.x ** 2 + blochVector.y ** 2 + blochVector.z ** 2);
        if (length < 0.01) return;
        
        const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
        const color = this.getQubitThemeColor(this.qubitIndex, 'secondary');
        const shaftMaterial = new THREE.MeshLambertMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        
        const direction = new THREE.Vector3(blochVector.x, blochVector.z, -blochVector.y).normalize();
        shaft.position.copy(direction.clone().multiplyScalar(length / 2));
        shaft.lookAt(new THREE.Vector3(blochVector.x, blochVector.z, -blochVector.y));
        shaft.rotateX(Math.PI / 2);
        
        const headGeometry = new THREE.ConeGeometry(0.05, 0.1, 8);
        const head = new THREE.Mesh(headGeometry, shaftMaterial);
        head.position.set(blochVector.x, blochVector.z, -blochVector.y);
        head.lookAt(new THREE.Vector3(0, 0, 0));
        head.rotateX(Math.PI);
        
        const vectorGroup = new THREE.Group();
        vectorGroup.add(shaft);
        vectorGroup.add(head);
        
        this.blochVector = vectorGroup;
        this.scene.add(this.blochVector);
    }

    createProbabilityClouds(blochVector, options) {
        if (!options.measurementProbs) return;
        
        const cloudGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        
        const zeroCloudMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.1 + options.measurementProbs.zero * 0.3
        });
        const zeroCloud = new THREE.Mesh(cloudGeometry, zeroCloudMaterial);
        zeroCloud.position.set(0, 1, 0);
        zeroCloud.scale.setScalar(Math.sqrt(options.measurementProbs.zero));
        
        const oneCloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.1 + options.measurementProbs.one * 0.3
        });
        const oneCloud = new THREE.Mesh(cloudGeometry, oneCloudMaterial);
        oneCloud.position.set(0, -1, 0);
        oneCloud.scale.setScalar(Math.sqrt(options.measurementProbs.one));
        
        this.probabilityClouds.push(zeroCloud, oneCloud);
        this.scene.add(zeroCloud);
        this.scene.add(oneCloud);
        
        this.addPulsingEffect(zeroCloud, 2000);
        this.addPulsingEffect(oneCloud, 2500);
    }

    addPulsingEffect(object, period = 2000) {
        const startTime = Date.now();
        const originalScale = object.scale.clone();
        
        const pulse = () => {
            const elapsed = Date.now() - startTime;
            const phase = (elapsed % period) / period * Math.PI * 2;
            const scale = 1 + 0.1 * Math.sin(phase);
            object.scale.copy(originalScale).multiplyScalar(scale);
        };
        
        object.userData.pulse = pulse;
    }

    getQubitThemeColor(index, type = 'primary') {
        const themes = [
            { primary: 0xe74c3c, secondary: 0x3498db, glow: 0xf39c12 },
            { primary: 0x9b59b6, secondary: 0x2ecc71, glow: 0xf1c40f },
            { primary: 0x34495e, secondary: 0xe67e22, glow: 0x1abc9c },
            { primary: 0x27ae60, secondary: 0x8e44ad, glow: 0xe74c3c },
            { primary: 0x2980b9, secondary: 0xc0392b, glow: 0x16a085 }
        ];
        
        const theme = themes[index % themes.length];
        return theme[type] || theme.primary;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.scene.traverse((object) => {
            if (object.userData.pulse) {
                object.userData.pulse();
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
    }
}

class QuantumCircuitApp {
    constructor() {
        this.numQubits = 2;
        this.circuit = [];
        this.simulator = new QuantumSimulator(this.numQubits);
        this.blochRenderers = [];
        this.currentTab = 'bloch';
        this.selectedGate = null;
        this.interactionMode = 'view';
        this.renderConfig = {
            showTrails: true,
            showGrid: true,
            showLabels: true
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateCircuit();
        this.updateVisualization();
    }

    initializeElements() {
        this.circuitCanvas = document.getElementById('circuit-canvas');
        this.qubitCountSelect = document.getElementById('qubit-count');
        this.exampleSelect = document.getElementById('example-select');
        this.blochContainer = document.getElementById('bloch-container');
        this.resetButton = document.getElementById('reset-circuit');
        this.exportButton = document.getElementById('export-btn');
        
        // Visualization controls
        this.showTrailsCheckbox = document.getElementById('show-trails');
        this.showGridCheckbox = document.getElementById('show-grid');
        this.showLabelsCheckbox = document.getElementById('show-labels');
        
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Modal elements
        this.modal = document.getElementById('gate-param-modal');
        this.modalClose = document.getElementById('modal-close');
        this.modalCancel = document.getElementById('modal-cancel');
        this.modalApply = document.getElementById('modal-apply');
        this.gateAngleInput = document.getElementById('gate-angle');
        this.angleSlider = document.getElementById('angle-slider');
        
        this.stateModal = document.getElementById('state-detail-modal');
        this.stateModalClose = document.getElementById('state-modal-close');
        
        this.pendingGate = null;
    }

    setupEventListeners() {
        // Qubit count change
        this.qubitCountSelect.addEventListener('change', (e) => {
            this.numQubits = parseInt(e.target.value);
            this.simulator = new QuantumSimulator(this.numQubits);
            this.circuit = [];
            this.updateCircuit();
            this.updateVisualization();
        });

        // Example circuits - Fixed event handler
        this.exampleSelect.addEventListener('change', (e) => {
            const example = e.target.value;
            if (example && example !== '') {
                this.loadExample(example);
                e.target.selectedIndex = 0;
            }
        });

        // Control buttons
        this.resetButton.addEventListener('click', () => this.resetCircuit());
        this.exportButton.addEventListener('click', () => this.exportCircuit());

        // Visualization controls
        if (this.showTrailsCheckbox) {
            this.showTrailsCheckbox.addEventListener('change', (e) => {
                this.renderConfig.showTrails = e.target.checked;
                this.updateBlochConfig();
            });
        }
        
        if (this.showGridCheckbox) {
            this.showGridCheckbox.addEventListener('change', (e) => {
                this.renderConfig.showGrid = e.target.checked;
                this.updateBlochConfig();
            });
        }
        
        if (this.showLabelsCheckbox) {
            this.showLabelsCheckbox.addEventListener('change', (e) => {
                this.renderConfig.showLabels = e.target.checked;
                this.updateBlochConfig();
            });
        }

        // Mode switching
        this.modeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchMode(e.target.dataset.mode);
            });
        });

        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Setup gate interactions
        this.setupGateInteractions();

        // Modal controls - Fixed event handlers
        if (this.modalClose) {
            this.modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal();
            });
        }
        
        if (this.modalCancel) {
            this.modalCancel.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal();
            });
        }
        
        if (this.modalApply) {
            this.modalApply.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.applyGateParameter();
            });
        }

        // Close modal on background click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }

        // Prevent modal content clicks from closing modal
        const modalContent = this.modal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Angle slider sync
        if (this.angleSlider && this.gateAngleInput) {
            this.angleSlider.addEventListener('input', (e) => {
                this.gateAngleInput.value = e.target.value;
            });
            
            this.gateAngleInput.addEventListener('input', (e) => {
                this.angleSlider.value = e.target.value;
            });
        }

        // Angle presets
        document.querySelectorAll('[data-angle]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const angle = e.target.dataset.angle;
                if (this.gateAngleInput) this.gateAngleInput.value = angle;
                if (this.angleSlider) this.angleSlider.value = angle;
            });
        });

        // State detail modal
        if (this.stateModalClose) {
            this.stateModalClose.addEventListener('click', () => {
                this.stateModal.classList.add('hidden');
            });
        }

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                if (this.stateModal) {
                    this.stateModal.classList.add('hidden');
                }
            }
        });
    }

    setupGateInteractions() {
        const gateItems = document.querySelectorAll('.gate-item');
        
        gateItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Clear previous selections
                gateItems.forEach(g => g.classList.remove('selected'));
                
                // Select current gate
                item.classList.add('selected');
                this.selectedGate = item.dataset.gate;
                
                console.log('Selected gate:', this.selectedGate);
                this.showPlacementInstruction(this.selectedGate);
            });

            item.addEventListener('dragstart', (e) => {
                this.selectedGate = item.dataset.gate;
                e.dataTransfer.setData('text/plain', this.selectedGate);
            });
        });

        this.setupCircuitCanvasInteractions();
    }

    setupCircuitCanvasInteractions() {
        this.circuitCanvas.addEventListener('click', (e) => {
            if (!this.selectedGate) return;
            
            const rect = this.circuitCanvas.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const qubit = this.getQubitFromPosition(y);
            
            console.log('Circuit canvas clicked, qubit:', qubit, 'gate:', this.selectedGate);
            
            if (qubit >= 0 && qubit < this.numQubits) {
                this.addGate(this.selectedGate, qubit);
                this.clearGateSelection();
            }
        });

        this.circuitCanvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.circuitCanvas.classList.add('drag-over');
        });

        this.circuitCanvas.addEventListener('dragleave', (e) => {
            if (!this.circuitCanvas.contains(e.relatedTarget)) {
                this.circuitCanvas.classList.remove('drag-over');
            }
        });

        this.circuitCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.circuitCanvas.classList.remove('drag-over');
            
            const gate = e.dataTransfer.getData('text/plain') || this.selectedGate;
            if (!gate) return;
            
            const rect = this.circuitCanvas.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const qubit = this.getQubitFromPosition(y);
            
            console.log('Drop event, qubit:', qubit, 'gate:', gate);
            
            if (qubit >= 0 && qubit < this.numQubits) {
                this.addGate(gate, qubit);
                this.clearGateSelection();
            }
        });
    }

    getQubitFromPosition(y) {
        const qubitHeight = 70;
        return Math.floor(y / qubitHeight);
    }

    clearGateSelection() {
        document.querySelectorAll('.gate-item').forEach(g => g.classList.remove('selected'));
        this.selectedGate = null;
        this.hidePlacementInstruction();
    }

    showPlacementInstruction(gate) {
        this.hidePlacementInstruction();
        
        const instruction = document.createElement('div');
        instruction.className = 'placement-instruction';
        instruction.textContent = `Click on a qubit line to place ${gate} gate`;
        
        this.circuitCanvas.style.position = 'relative';
        this.circuitCanvas.appendChild(instruction);
        
        setTimeout(() => {
            if (instruction.parentNode) {
                instruction.remove();
            }
        }, 3000);
    }

    hidePlacementInstruction() {
        const instruction = document.querySelector('.placement-instruction');
        if (instruction) instruction.remove();
    }

    addGate(gateType, qubit, parameter = null) {
        console.log('Adding gate:', gateType, 'to qubit', qubit, 'parameter:', parameter);
        
        if (['RX', 'RY', 'RZ'].includes(gateType) && parameter === null) {
            this.pendingGate = { type: gateType, qubit };
            this.showModal();
            return;
        }

        if (['CNOT', 'CZ'].includes(gateType)) {
            const control = qubit;
            const target = (qubit + 1) % this.numQubits;
            this.circuit.push({
                type: gateType,
                control,
                target,
                step: this.circuit.length
            });
        } else {
            this.circuit.push({
                type: gateType,
                qubit,
                parameter,
                step: this.circuit.length
            });
        }

        console.log('Circuit after adding gate:', this.circuit);
        this.updateCircuit();
        this.updateVisualization();
    }

    showModal() {
        console.log('Showing modal');
        if (this.modal) {
            this.modal.classList.remove('hidden');
            if (this.gateAngleInput) {
                this.gateAngleInput.focus();
            }
        }
    }

    hideModal() {
        console.log('Hiding modal');
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        this.pendingGate = null;
    }

    applyGateParameter() {
        console.log('Applying gate parameter');
        if (this.pendingGate && this.gateAngleInput) {
            const parameter = parseFloat(this.gateAngleInput.value) || 0;
            this.addGate(this.pendingGate.type, this.pendingGate.qubit, parameter);
            this.hideModal();
        }
    }

    loadExample(example) {
        console.log('Loading example:', example);
        this.circuit = [];
        
        switch (example) {
            case 'bell':
                if (this.numQubits >= 2) {
                    this.circuit = [
                        { type: 'H', qubit: 0, step: 0 },
                        { type: 'CNOT', control: 0, target: 1, step: 1 }
                    ];
                }
                break;
            case 'ghz':
                if (this.numQubits >= 3) {
                    this.circuit = [
                        { type: 'H', qubit: 0, step: 0 },
                        { type: 'CNOT', control: 0, target: 1, step: 1 },
                        { type: 'CNOT', control: 1, target: 2, step: 2 }
                    ];
                }
                break;
            case 'superposition':
                this.circuit = [];
                for (let i = 0; i < this.numQubits; i++) {
                    this.circuit.push({ type: 'H', qubit: i, step: 0 });
                }
                break;
            case 'mixed':
                this.circuit = [
                    { type: 'H', qubit: 0, step: 0 },
                    { type: 'RY', qubit: 0, parameter: Math.PI/4, step: 1 },
                    { type: 'RX', qubit: 1, parameter: Math.PI/3, step: 2 }
                ];
                break;
        }
        
        console.log('Loaded circuit:', this.circuit);
        this.updateCircuit();
        this.updateVisualization();
    }

    resetCircuit() {
        this.circuit = [];
        this.updateCircuit();
        this.updateVisualization();
    }

    exportCircuit() {
        const exportData = {
            numQubits: this.numQubits,
            circuit: this.circuit,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantum_circuit_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateBlochConfig() {
        this.blochRenderers.forEach(renderer => {
            renderer.config = { ...renderer.config, ...this.renderConfig };
        });
        this.updateBlochSpheres();
    }

    switchMode(mode) {
        this.interactionMode = mode;
        
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.blochRenderers.forEach(renderer => {
            renderer.config.interactionMode = mode;
        });
    }

    updateCircuit() {
        this.circuitCanvas.innerHTML = '';
        
        for (let i = 0; i < this.numQubits; i++) {
            const qubitLine = document.createElement('div');
            qubitLine.className = 'qubit-line';
            
            const label = document.createElement('div');
            label.className = 'qubit-label';
            label.textContent = `q${i}`;
            
            const wire = document.createElement('div');
            wire.className = 'qubit-wire';
            
            qubitLine.appendChild(label);
            qubitLine.appendChild(wire);
            this.circuitCanvas.appendChild(qubitLine);
        }
        
        this.circuit.forEach((gate, index) => {
            this.renderGate(gate, index);
        });
    }

    renderGate(gate, index) {
        const wireElements = this.circuitCanvas.querySelectorAll('.qubit-wire');
        
        if (gate.control !== undefined && gate.target !== undefined) {
            const controlWire = wireElements[gate.control];
            const targetWire = wireElements[gate.target];
            
            const gateElement = document.createElement('div');
            gateElement.className = 'circuit-gate two-qubit';
            gateElement.textContent = gate.type === 'CNOT' ? '⊕' : 'CZ';
            gateElement.style.left = `${(index + 1) * 80}px`;
            
            const controlDot = document.createElement('div');
            controlDot.className = 'cnot-control';
            controlDot.style.left = `${(index + 1) * 80 + 20}px`;
            
            const line = document.createElement('div');
            line.className = 'cnot-line';
            line.style.left = `${(index + 1) * 80 + 20}px`;
            const minQubit = Math.min(gate.control, gate.target);
            const maxQubit = Math.max(gate.control, gate.target);
            line.style.top = `${minQubit * 70 + 25}px`;
            line.style.height = `${(maxQubit - minQubit) * 70}px`;
            
            targetWire.appendChild(gateElement);
            controlWire.appendChild(controlDot);
            this.circuitCanvas.appendChild(line);
        } else {
            const wire = wireElements[gate.qubit];
            const gateElement = document.createElement('div');
            gateElement.className = `circuit-gate ${gate.parameter ? 'parametric' : ''}`;
            gateElement.textContent = gate.parameter ? 
                `${gate.type}(${gate.parameter.toFixed(2)})` : gate.type;
            gateElement.style.left = `${(index + 1) * 80}px`;
            
            gateElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.circuit.splice(index, 1);
                this.updateCircuit();
                this.updateVisualization();
            });
            
            wire.appendChild(gateElement);
        }
    }

    updateVisualization() {
        console.log('Updating visualization');
        this.simulator.reset();
        
        this.circuit.forEach((gate) => {
            if (gate.control !== undefined && gate.target !== undefined) {
                this.simulator.applyTwoQubitGate(gate.type, gate.control, gate.target);
            } else {
                this.simulator.applyGate(gate.type, gate.qubit, gate.parameter);
            }
        });
        
        this.updateCurrentTab();
    }

    updateCurrentTab() {
        switch (this.currentTab) {
            case 'bloch':
                this.updateBlochSpheres();
                break;
            case 'states':
                this.updateStates();
                break;
            case 'matrices':
                this.updateMatrices();
                break;
            case 'info':
                // Static content
                break;
        }
    }

    updateBlochSpheres() {
        console.log('Updating Bloch spheres');
        
        // Dispose old renderers
        this.blochRenderers.forEach(renderer => renderer.dispose());
        this.blochRenderers = [];
        this.blochContainer.innerHTML = '';
        
        for (let i = 0; i < this.numQubits; i++) {
            const sphereContainer = document.createElement('div');
            sphereContainer.className = 'bloch-sphere';
            
            const title = document.createElement('h4');
            title.textContent = `Qubit ${i}`;
            sphereContainer.appendChild(title);
            
            const canvas = document.createElement('div');
            canvas.className = 'bloch-canvas';
            sphereContainer.appendChild(canvas);
            
            sphereContainer.addEventListener('click', () => {
                this.showStateDetails(i);
            });
            
            this.blochContainer.appendChild(sphereContainer);
            
            // Create enhanced renderer
            const config = {
                ...this.renderConfig,
                interactionMode: this.interactionMode
            };
            const renderer = new EnhancedBlochSphereRenderer(canvas, i, config);
            this.blochRenderers.push(renderer);
            
            // Update with current state
            const blochVector = this.simulator.getBlochVector(i);
            const purity = this.simulator.getPurity(i);
            const measurementProbs = this.simulator.getMeasurementProbabilities(i);
            
            console.log(`Qubit ${i} Bloch vector:`, blochVector, 'Purity:', purity);
            
            renderer.updateBlochVector(blochVector, {
                purity,
                measurementProbs
            });
            
            if (this.isQubitEntangled(i)) {
                sphereContainer.classList.add('entangled-sphere');
            }
        }
        
        this.updateStateInfo();
        this.updateBlochCoordinates();
        this.updateMeasurementProbabilities();
    }

    isQubitEntangled(qubit) {
        return this.simulator.getPurity(qubit) < 0.99;
    }

    updateStateInfo() {
        const stateInfoContainer = document.getElementById('state-info');
        if (!stateInfoContainer) return;
        
        stateInfoContainer.innerHTML = '';
        
        for (let i = 0; i < this.numQubits; i++) {
            const purity = this.simulator.getPurity(i);
            const isEntangled = this.isQubitEntangled(i);
            
            const infoItem = document.createElement('div');
            infoItem.className = 'state-info-item';
            
            const label = document.createElement('span');
            label.textContent = `Qubit ${i}`;
            
            const info = document.createElement('span');
            const purityPercent = (purity * 100).toFixed(1);
            info.innerHTML = `
                <div class="purity-indicator">
                    Purity: ${purityPercent}%
                    <div class="purity-bar">
                        <div class="purity-fill" style="width: ${purityPercent}%"></div>
                    </div>
                    ${isEntangled ? '<span style="color: var(--color-warning)">⚡ Entangled</span>' : ''}
                </div>
            `;
            
            infoItem.appendChild(label);
            infoItem.appendChild(info);
            stateInfoContainer.appendChild(infoItem);
        }
    }

    updateBlochCoordinates() {
        const coordsContainer = document.getElementById('bloch-coords');
        if (!coordsContainer) return;
        
        coordsContainer.innerHTML = '';
        
        for (let i = 0; i < this.numQubits; i++) {
            const blochVector = this.simulator.getBlochVector(i);
            
            const coordItem = document.createElement('div');
            coordItem.className = 'coord-item';
            
            const label = document.createElement('div');
            label.className = 'coord-label';
            label.textContent = `Qubit ${i}`;
            
            const values = document.createElement('div');
            values.className = 'coord-value';
            values.innerHTML = `
                X: ${blochVector.x.toFixed(3)}<br>
                Y: ${blochVector.y.toFixed(3)}<br>
                Z: ${blochVector.z.toFixed(3)}<br>
                |r|: ${Math.sqrt(blochVector.x**2 + blochVector.y**2 + blochVector.z**2).toFixed(3)}
            `;
            
            coordItem.appendChild(label);
            coordItem.appendChild(values);
            coordsContainer.appendChild(coordItem);
        }
    }

    updateMeasurementProbabilities() {
        const measurementContainer = document.getElementById('measurement-probs');
        if (!measurementContainer) return;
        
        measurementContainer.innerHTML = '';
        
        for (let i = 0; i < this.numQubits; i++) {
            const probs = this.simulator.getMeasurementProbabilities(i);
            
            const measurements = [
                { basis: 'Computational (Z)', zero: probs.computational.zero, one: probs.computational.one },
                { basis: 'Hadamard (X)', plus: probs.hadamard.plus, minus: probs.hadamard.minus },
                { basis: 'Circular (Y)', plus: probs.circular.plus, minus: probs.circular.minus }
            ];
            
            measurements.forEach(measurement => {
                const measurementItem = document.createElement('div');
                measurementItem.className = 'measurement-item';
                measurementItem.innerHTML = `
                    <div>
                        <strong>Q${i} ${measurement.basis}</strong><br>
                        ${measurement.zero !== undefined ? 
                            `|0⟩: ${(measurement.zero * 100).toFixed(1)}%, |1⟩: ${(measurement.one * 100).toFixed(1)}%` :
                            `|+⟩: ${(measurement.plus * 100).toFixed(1)}%, |-⟩: ${(measurement.minus * 100).toFixed(1)}%`
                        }
                    </div>
                `;
                measurementContainer.appendChild(measurementItem);
            });
        }
    }

    showStateDetails(qubitIndex) {
        const blochVector = this.simulator.getBlochVector(qubitIndex);
        const purity = this.simulator.getPurity(qubitIndex);
        const probs = this.simulator.getMeasurementProbabilities(qubitIndex);
        
        const modalBody = document.getElementById('state-modal-body');
        if (!modalBody) return;
        
        modalBody.innerHTML = `
            <div class="state-details">
                <h4>Qubit ${qubitIndex} Detailed Analysis</h4>
                
                <div class="detail-section">
                    <h5>Bloch Vector</h5>
                    <p>X: ${blochVector.x.toFixed(6)}<br>
                       Y: ${blochVector.y.toFixed(6)}<br>
                       Z: ${blochVector.z.toFixed(6)}<br>
                       Magnitude: ${Math.sqrt(blochVector.x**2 + blochVector.y**2 + blochVector.z**2).toFixed(6)}</p>
                </div>
                
                <div class="detail-section">
                    <h5>State Properties</h5>
                    <p>Purity: ${(purity * 100).toFixed(2)}%<br>
                       ${purity > 0.99 ? 'Pure State' : 'Mixed State'}<br>
                       ${this.isQubitEntangled(qubitIndex) ? 'Entangled with other qubits' : 'Not entangled'}</p>
                </div>
                
                <div class="detail-section">
                    <h5>Measurement Probabilities</h5>
                    <p><strong>Computational basis:</strong><br>
                       P(|0⟩) = ${(probs.computational.zero * 100).toFixed(2)}%<br>
                       P(|1⟩) = ${(probs.computational.one * 100).toFixed(2)}%</p>
                    <p><strong>Hadamard basis:</strong><br>
                       P(|+⟩) = ${(probs.hadamard.plus * 100).toFixed(2)}%<br>
                       P(|-⟩) = ${(probs.hadamard.minus * 100).toFixed(2)}%</p>
                </div>
            </div>
        `;
        
        if (this.stateModal) {
            this.stateModal.classList.remove('hidden');
        }
    }

    updateStates() {
        const stateVector = document.getElementById('state-vector');
        const stateProbs = document.getElementById('state-probs');
        
        if (!stateVector || !stateProbs) return;
        
        let stateHTML = '|ψ⟩ = ';
        const state = this.simulator.state;
        let first = true;
        
        for (let i = 0; i < state.length; i++) {
            const amplitude = state[i];
            if (amplitude.magnitude() > 1e-10) {
                if (!first) stateHTML += ' + ';
                stateHTML += `(${amplitude.toString()})|${i.toString(2).padStart(this.numQubits, '0')}⟩`;
                first = false;
            }
        }
        
        if (first) stateHTML += '0';
        stateVector.innerHTML = stateHTML;
        
        const probabilities = this.simulator.getProbabilities();
        stateProbs.innerHTML = '';
        
        probabilities.forEach(prob => {
            if (prob.probability > 1e-10) {
                const probItem = document.createElement('div');
                probItem.className = 'prob-item';
                
                const label = document.createElement('div');
                label.className = 'state-label';
                label.textContent = `|${prob.state}⟩`;
                
                const value = document.createElement('div');
                value.className = 'prob-value';
                value.textContent = `${(prob.probability * 100).toFixed(2)}%`;
                
                probItem.appendChild(label);
                probItem.appendChild(value);
                stateProbs.appendChild(probItem);
            }
        });
    }

    updateMatrices() {
        const fullDensity = document.getElementById('full-density');
        const reducedDensities = document.getElementById('reduced-densities');
        
        if (!fullDensity || !reducedDensities) return;
        
        const densityMatrix = this.simulator.getDensityMatrix();
        let matrixHTML = 'ρ = [\n';
        for (let i = 0; i < Math.min(densityMatrix.length, 8); i++) { // Limit display for large matrices
            matrixHTML += '  [';
            for (let j = 0; j < Math.min(densityMatrix[i].length, 8); j++) {
                matrixHTML += densityMatrix[i][j].toString();
                if (j < Math.min(densityMatrix[i].length, 8) - 1) matrixHTML += ', ';
            }
            if (densityMatrix[i].length > 8) matrixHTML += ', ...';
            matrixHTML += ']';
            if (i < Math.min(densityMatrix.length, 8) - 1) matrixHTML += ',';
            matrixHTML += '\n';
        }
        if (densityMatrix.length > 8) matrixHTML += '  ...\n';
        matrixHTML += ']';
        fullDensity.textContent = matrixHTML;
        
        reducedDensities.innerHTML = '';
        
        for (let i = 0; i < this.numQubits; i++) {
            const reducedMatrix = this.simulator.getReducedDensityMatrix(i);
            
            const matrixDiv = document.createElement('div');
            matrixDiv.className = 'reduced-matrix';
            
            const title = document.createElement('h5');
            title.textContent = `Qubit ${i} Reduced Density Matrix`;
            
            const content = document.createElement('div');
            let reducedHTML = `ρ₍${i}₎ = [\n`;
            for (let row = 0; row < 2; row++) {
                reducedHTML += '  [';
                for (let col = 0; col < 2; col++) {
                    reducedHTML += reducedMatrix[row][col].toString();
                    if (col < 1) reducedHTML += ', ';
                }
                reducedHTML += ']';
                if (row < 1) reducedHTML += ',';
                reducedHTML += '\n';
            }
            reducedHTML += ']';
            content.textContent = reducedHTML;
            
            matrixDiv.appendChild(title);
            matrixDiv.appendChild(content);
            reducedDensities.appendChild(matrixDiv);
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });
        
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        this.updateCurrentTab();
    }
}

// Initialize the enhanced application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Enhanced Quantum Circuit Visualizer loading...');
    
    // Wait for Three.js to be available
    if (typeof THREE !== 'undefined') {
        new QuantumCircuitApp();
        console.log('Application initialized with enhanced Bloch spheres!');
    } else {
        console.error('Three.js not loaded');
    }
});