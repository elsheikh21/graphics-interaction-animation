// GL variable
var canvas,
    gl;

var numVertices = 36,
    numChecks = 8,
    // texture size
    texSize = 64;

// Rotation variables
var xAxis = 0,
    yAxis = 1,
    zAxis = 2,
    axis = zAxis,
    rotate_flag = true,
    reverse_direction_flag = false;


// Create a checkerboard pattern using floats
var image1 = new Array();
for (var i = 0; i < texSize; i++) {
    image1[i] = new Array();
}

for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        image1[i][j] = new Float32Array(4);
    }
}

for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
        image1[i][j] = [c, c, c, 1];
    }
}

// Convert floats to ubytes for texture
var image2 = new Uint8Array(4 * texSize * texSize);
for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        for (var k = 0; k < 4; k++) {
            image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];
        }
    }
}


// variable as per our shading models
var gouraudProgram,
    phongProgram,
    // Shading model
    isGouraudProgram = true;

// controllers
let shadingButton,
    rotationButton,
    rotationX,
    rotationY,
    rotationZ,
    scaling,
    translating_x,
    translating_y,
    translating_z,
    near_slider,
    far_slider,
    fov_slider,
    radius_slider,
    theta_slider,
    phi_slider,
    resetBtn;

// arrays for colors, normals, texCoords, points
var colorsArray = [],
    normalsArray = [],
    texCoordsArray = [],
    pointsArray = [];

// Angles as per our cube
var theta = [45.0, 45.0, 45.0],
    thetaLoc;

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
],

    vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(1.0, 0.0, 0.0, 1.0),
        vec4(1.0, 1.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0),
        vec4(1.0, 0.0, 1.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0)
    ],

    texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];


function initGL(canvas) {
    try {
        gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) {
            alert("WebGL isn't available");
        }
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        gl.enable(gl.SCISSOR_TEST);
        gl.clearColor(0.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
    }
    catch (e) {
        console.log(e);
    }
    if (!gl) {
        alert("WebGL is not available.");
    }
}

function initControllers() {
    // Shading controller
    shadingButton = document.getElementById("shadingButton");
    // Rotation button
    rotationButton = document.getElementById("rotationBtn");
    rotationX = document.getElementById("rotationX");
    rotationY = document.getElementById("rotationY");
    rotationZ = document.getElementById("rotationZ");

    //sliders controllers
    scaling = document.getElementById("slide_scaling");
    translating_x = document.getElementById("slide_translating_x");
    translating_y = document.getElementById("slide_translating_y");
    translating_z = document.getElementById("slide_translating_z");

    // Slider controllers
    near_slider = document.getElementById("slide_near");
    far_slider = document.getElementById("slide_far");
    fov_slider = document.getElementById("slide_fov");

    radius_slider = document.getElementById("slide_radius");
    theta_slider = document.getElementById("slide_theta");
    phi_slider = document.getElementById("slide_phi");

    // Reset everything button
    resetBtn = document.getElementById("resetButton");
}

function setupEvents() {
    shadingButton.onclick = function () {
        isGouraudProgram = !isGouraudProgram;
        updateShadingButton();
    };
    updateShadingButton()

    resetBtn.onclick = function () {
        resetButton();
    }

    rotationButton.onclick = function () {
        rotate_flag = !rotate_flag;
    }

    rotationX.onclick = function () {
        axis = xAxis;
    };
    rotationY.onclick = function () {
        axis = yAxis;
    };
    rotationZ.onclick = function () {
        axis = zAxis;
    };
}

function updateShadingButton() {
    shadingButton.innerHTML = isGouraudProgram ? "Gouraud >> Phong" : "Phong >> Gouraud";
}

function initializeShaders() {
    // We have 2 shaders as per our 2 shading models

    // Gouraud shader
    gouraudProgram = initShaders(gl, "gouraud-vShader", "gouraud-fShader")
    // Phong shader
    phongProgram = initShaders(gl, "phong-vShader", "phong-fShader")
}

function initBuffer() {
    // Load the data into the GPU
    let cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    let vColor = gl.getAttribLocation(gouraudProgram, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    vColor = gl.getAttribLocation(phongProgram, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Load the data into the GPU
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    let vPosition = gl.getAttribLocation(gouraudProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    vPosition = gl.getAttribLocation(phongProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function initTexture() {
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(gouraudProgram, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var vTexCoord = gl.getAttribLocation(phongProgram, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.uniform4fv(gl.getUniformLocation(gouraudProgram, "vNormal"), flatten(normalsArray));
    gl.uniform4fv(gl.getUniformLocation(phongProgram, "vNormal"), flatten(normalsArray));
}

function quad(a, b, c, d) {

    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
    normal = normalize(normal);


    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[1]);
    normalsArray.push(normal);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[3]);
    normalsArray.push(normal);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function resetButton() {
    document.getElementById("slide_scaling").value = 1;
    document.getElementById("slide_translating_x").value = 0;
    document.getElementById("slide_translating_y").value = 0;
    document.getElementById("slide_translating_z").value = 0;
    document.getElementById("slide_near").value = 1.1;
    document.getElementById("slide_far").value = 15;
    document.getElementById("slide_fov").value = 60;
    document.getElementById("slide_radius").value = 3;
    document.getElementById("slide_theta").value = 0;
    document.getElementById("slide_phi").value = 0;
}

function webGLStart() {
    canvas = document.getElementById("gl-canvas");
    // initialize the GL
    initGL(canvas);
    // Initialize the controllers
    initControllers();
    // bind event listeners
    setupEvents();
    // initialize vertex & fragment shaders for Phong & Gouraud 
    initializeShaders();
    colorCube();
    // Load data into GPU, and associate vars with data buffer
    initBuffer();
    // initialize texture of our cube
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    render();
}

var render = function () {
    var width = gl.canvas.width;
    var height = gl.canvas.height;
    var displayWidth = gl.canvas.clientWidth;
    var displayHeight = gl.canvas.clientHeight;

    var fovy = fov_slider.value;
    var near = near_slider.value;
    var far = far_slider.value;

    var radius = radius_slider.value;
    var thetha = theta_slider.value;
    var phi = phi_slider.value;

    if (rotate_flag) {
        if (reverse_direction_flag) {
            theta[axis] -= 1.0;
        } else {
            theta[axis] += 1.0;
        }
    }

    var eye_x = radius * Math.sin(thetha) * Math.cos(phi);
    var eye_y = radius * Math.sin(thetha) * Math.sin(phi);
    var eye_z = radius * Math.cos(thetha);
    var eye = vec3(eye_x, eye_y, eye_z);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    //define data for light and material
    var lightPosition = vec4(2.0, 1.0, 0.0, 0.0), //vec4(1.0, 1.0, 1.0, 0.0),
        lightAmbient = vec4(0.3, 0.3, 0.3, 1.0),
        lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0),
        lightSpecular = vec4(1.0, 1.0, 1.0, 1.0),

        materialAmbient = vec4(1.0, 0.0, 1.0, 1.0),
        materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0),
        materialSpecular = vec4(1.0, 0.8, 0.0, 1.0),
        materialShininess = 100.0;


    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    var currentProgram = isGouraudProgram ? gouraudProgram : phongProgram;

    gl.useProgram(currentProgram);

    var dispWidth = displayWidth / 2;
    var dispHeight = displayHeight;
    var aspect = dispWidth / dispHeight;

    function renderScene(drawX, drawY, drawWidth, drawHeight, projectionMatrix) {
        //Let's make a scissor test to prepare the window to work
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(drawX, drawY, drawWidth, drawHeight);
        gl.viewport(drawX, drawY, drawWidth, drawHeight);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let modelViewMatrix = lookAt(eye, at, up);
        modelViewMatrix = mult(modelViewMatrix, translate(translating_x.value, translating_y.value, translating_z.value));
        modelViewMatrix = mult(modelViewMatrix, scalem(scaling.value, scaling.value, scaling.value));

        gl.uniformMatrix4fv(gl.getUniformLocation(currentProgram, "modelViewMatrix"), false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(gl.getUniformLocation(currentProgram, "projectionMatrix"), false, flatten(projectionMatrix));

        gl.uniform4fv(gl.getUniformLocation(currentProgram, "ambientProduct"), flatten(ambientProduct));
        gl.uniform4fv(gl.getUniformLocation(currentProgram, "diffuseProduct"), flatten(diffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(currentProgram, "specularProduct"), flatten(specularProduct));
        gl.uniform4fv(gl.getUniformLocation(currentProgram, "lightPosition"), flatten(lightPosition));
        gl.uniform1f(gl.getUniformLocation(currentProgram, "shininess"), materialShininess);

        configureTexture(image2);
        thetaLoc = gl.getUniformLocation(currentProgram, "theta");
        gl.uniform3fv(thetaLoc, theta);

        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    }

    function drawPrespective() {
        let projectionMatrix = perspective(fovy, aspect, near, far);
        gl.clearColor(0.0, 0.0, 0.0, 0.2);
        renderScene(0, 0, 0.5 * width, height, projectionMatrix);
    }

    function drawOrthogonal() {
        let top = 1;
        let bottom = -top;
        let right = top * aspect;
        let left = -right;
        let projectionMatrix = ortho(left, right, bottom, top, near, far);
        gl.clearColor(0.0, 0.0, 0.0, .2);
        renderScene(0.5 * width, 0, 0.5 * width, height, projectionMatrix);
    }

    drawPrespective();
    drawOrthogonal();

    requestAnimFrame(render);
};
