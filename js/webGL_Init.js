window.onload = function () {
    webGL_Start ();
}

function webGL_Start () {
    // Find the canvas element
    var canvas = document.getElementById ("canvas");
    
    // Initializations
    initGL (canvas);
    initShaders ();
    initBuffers ();
    
    // Make viewport black
    gl.clearColor (0.0, 0.0, 0.0, 1.0);
    // Enable layering
    gl.enable (gl.DEPTH_TEST);
    
    // Key detection setup
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    // Frame draw control
    tick ();
}

function tick () {
    // Arrange calls based on next frame render event from browser through webgl-utils.js
    // to be directed towards tick () (making this the game loop)
    requestAnimFrame (tick);
    // User input handling
    handleInputs ();
    // AI inputs
    inputAI ();
    // Draw
    drawScene ();
    // Update buffers for next draw
    animate ();
}

// Key press state dict
var currentlyPressedKeys = {};

// Event functions detailing handling of key events
function handleKeyDown (event) {
    currentlyPressedKeys[event.keyCode] = true;
}
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

// The ball
var xBall = 4;
var yBall = 0;
var vxBall = 2;
var vyBall = 1;
// Enemy Paddle
var xEnemy = 9.0;
var yEnemy = 0;
// Player controls
var xPosition = -9.0;
var yPosition = 0.0;

function handleInputs () {
    if (currentlyPressedKeys[40]) {
        // Down cursor key
        yPosition -= 0.1;
        
        if ((yPosition) <= -6) {
            yPosition = -6;
        }
    }
    if (currentlyPressedKeys[38]) {
        // Up cursor key
        yPosition += 0.1;
        
        if ((yPosition) >= 6) {
            yPosition = 6;
        }
    }
}

var playerPoints = 0;
var enemyPoints = 0;

function inputAI () {
    // Enemy Paddle AI
    if (yBall > yEnemy) {
        yEnemy += 0.1;
        
        if ((yEnemy) >= 6) {
            yEnemy = 6;
        }
    } else if (yBall < yEnemy) {
        yEnemy -= 0.1;
        
        if ((yEnemy) <= -6) {
            yEnemy = -6;
        }
    }
    
    // Ball AI
    xBall += 0.1 * vxBall;
    yBall += 0.1 * vyBall;
    
    if (yBall >= 6.8 || yBall <= -6.8) {
        vyBall = -vyBall;
    }
    if (xBall >= 9.8) {
        xBall = 0;
        yBall = 0;
        vxBall = 1 * -(vxBall / Math.abs (vxBall));
        vyBall = 0.5 * -(vyBall / Math.abs (vyBall));
        playerPoints += 1;
        document.getElementById ("points").innerHTML = "Player: " + playerPoints + " Enemy: " + enemyPoints;
    }
    if (xBall <= -9.8) {
        xBall = 0;
        yBall = 0;
        vxBall = 1 * -(vxBall / Math.abs (vxBall));
        vyBall = 0.5 * -(vyBall / Math.abs (vyBall));
        enemyPoints += 1;
        document.getElementById ("points").innerHTML = "Player: " + playerPoints + " Enemy: " + enemyPoints;
    }
    
    // Check for paddle collisions
    if (vxBall < 0) {
        if (((xBall - 0.2) <= (xPosition + 0.2)) && ((xBall - 0.2) >= (xPosition - 0.2))) {
            if (vyBall < 0) {
                if (((yBall - 0.2) <= (yPosition + 1)) && ((yBall - 0.2) >= (yPosition - 1))) {
                    vxBall -= 0.2;
                    vyBall -= 0.1;
                    vxBall = -vxBall;
                }
            }
            if (vyBall > 0) {
                if (((yBall + 0.2) <= (yPosition + 1)) && ((yBall + 0.2) >= (yPosition - 1))) {
                    vxBall -= 0.2;
                    vyBall += 0.1;
                    vxBall = -vxBall;
                }
            }
        }
    }
    if (vxBall > 0) {
        if (((xBall + 0.2) <= (xEnemy + 0.2)) && ((xBall + 0.2) >= (xEnemy - 0.2))) {
            if (vyBall < 0) {
                if (((yBall - 0.2) <= (yEnemy + 1)) && ((yBall - 0.2) >= (yEnemy - 1))) {
                    vxBall += 0.2;
                    vyBall -= 0.1;
                    vxBall = -vxBall;
                }
            }
            if (vyBall > 0) {
                if (((yBall + 0.2) <= (yEnemy + 1)) && ((yBall + 0.2) >= (yEnemy - 1))) {
                    vxBall += 0.2;
                    vyBall += 0.1;
                    vxBall = -vxBall;
                }
            }
        }
    }
    
}

function animate () {

}

// The GL thingy (WebGL context)
var gl;

function initGL (canvas) {
    try {
        gl = canvas.getContext ("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    
    if (!gl) {
        alert ("Could not initialize WebGL, sorry :<");
    }
}

// Model view matrix
var mvMatrix = mat4.create ();
// Projection matrix
var pMatrix = mat4.create ();
var mvMatrixStack = [];

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

// WebGL shader process to be used in graphics-land
var shaderProgram;

function initShaders () {
    var fragmentShader = getShader (gl, "shader-fs");
    var vertexShader = getShader (gl, "shader-vs");
    
    // Attach created shaders to WebGL process (run on video card)
    shaderProgram = gl.createProgram ();
    gl.attachShader (shaderProgram, vertexShader);
    gl.attachShader (shaderProgram, fragmentShader);
    gl.linkProgram (shaderProgram);
    
    if (!gl.getProgramParameter (shaderProgram, gl.LINK_STATUS)) {
        alert ("Could not initialize shaders");
    }
    
    gl.useProgram (shaderProgram);
    
    // Get attribute reference to pass to vertex shader for each vertex
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation (shaderProgram, "aVertexPosition");
    // Tell WebGL that we want to values for the attribute using an array
    gl.enableVertexAttribArray (shaderProgram.vertexPositionAttribute);
    
    // Same but for color
    shaderProgram.vertexColorAttribute = gl.getAttribLocation (shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray (shaderProgram.vertexColorAttribute);
    
    // Store uniform variables on program
    shaderProgram.pMatrixUniform = gl.getUniformLocation (shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation (shaderProgram, "uMVMatrix");
}

// Looks for element on page with ID id
// Creates fragment / vertex shader based on element type
// Passed context to graphics card
function getShader (gl, id) {
    // Get shader script of ID id
    var shaderScript = document.getElementById (id);
    if (!shaderScript) {
        return null;
    }
    
    // Pull out code of script
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    
    // The shader to be used
    var shader;
    // Find the shader script type and create proper shader
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader (gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader (gl.VERTEX_SHADER);
    } else {
        return null;
    }
    
    // Match script code with shader object
    gl.shaderSource (shader, str);
    // Compile shader profile
    gl.compileShader (shader);
    
    // Check for errors
    if (!gl.getShaderParameter (shader, gl.COMPILE_STATUS)) {
        alert (gl.getShaderInfoLog (shader));
        return null;
    }
    
    return shader;
}

// Send WebGL JS-land matrix info using initShaders uniform references
function setMatrixUniforms () {
    gl.uniformMatrix4fv (shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv (shaderProgram.mvMatrixUniform, false, mvMatrix);
}

// Hold positions of both objects
var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;
var enemyVertexPositionBuffer;
var ballVertexPositionBuffer;
// Hold colors of both objects
var triangleVertexColorBuffer;
var squareVertexColorBuffer;
var enemyColorPositionBuffer;
var ballColorPositionBuffer;

function initBuffers () {
    
    /***************************************
    **
    ** Start building the triangle buffer
    **
    ****************************************/
    /*
    //
    // First, define the position
    //
    
    // Create a buffer for the triangle
    triangleVertexPositionBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    
    // Define vertices
    var vertices = [
        0.0,  1.0, 0.0,
       -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (vertices), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 3 items (vertex coordinates) ...
    triangleVertexPositionBuffer.numItems = 3;
    // ... with each coordinate holding 3 numbers
    triangleVertexPositionBuffer.itemSize = 3;
    
    //
    // Second, define the color
    //
    
    // Create a buffer for the triangle's color
    triangleVertexColorBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    
    // Define colors (RGBA)
    var colors = [
        0.0,  0.0, 0.0, 1.0,
        0.0,  0.0, 0.0, 1.0,
        0.0,  0.0, 0.0, 1.0
    ];
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (colors), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 3 items (colors) ...
    triangleVertexColorBuffer.numItems = 3;
    // ... with each color holding 4 numbers (red, green, blue, and alpha)
    triangleVertexColorBuffer.itemSize = 4;
    */
    
    /***************************************
    **
    ** Start building the square buffer
    **
    ****************************************/
    
    //
    // First, define the position
    //
    
    // Create a buffer for the square
    squareVertexPositionBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    
    // Define vertices
    var vertices = [
        0.2,  1.0, 0.0,
        0.2, -1.0, 0.0,
       -0.2,  1.0, 0.0,
       -0.2, -1.0, 0.0
    ];
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (vertices), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 4 items (vertex coordinates) ...
    squareVertexPositionBuffer.numItems = 4;
    // ... with each coordinate holding 3 numbers
    squareVertexPositionBuffer.itemSize = 3;
    
    //
    // Second, define the color
    //
    
    // Create a buffer for the square
    squareVertexColorBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, squareVertexColorBuffer);
    
    // Define colors (RGBA)
    colors = [];
    for (var i = 0; i < 4; i++) {
        colors = colors.concat ([0.5, 0.5, 1.0, 1.0]);
    }
    
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (colors), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 4 items (colors) ...
    squareVertexColorBuffer.numItems = 4;
    // ... with each color holding 4 numbers (red, green, blue, and alpha)
    squareVertexColorBuffer.itemSize = 4;
    
    /***************************************
    **
    ** Start building the Enemy Paddle buffer
    **
    ****************************************/
    
    //
    // First, define the shape
    //
    
    // Create a buffer for the square
    enemyVertexPositionBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, enemyVertexPositionBuffer);
    
    // Define vertices
    var vertices = [
        0.2,  1.0, 0.0,
        0.2, -1.0, 0.0,
       -0.2,  1.0, 0.0,
       -0.2, -1.0, 0.0
    ];
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (vertices), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 4 items (vertex coordinates) ...
    enemyVertexPositionBuffer.numItems = 4;
    // ... with each coordinate holding 3 numbers
    enemyVertexPositionBuffer.itemSize = 3;
    
    //
    // Second, define the color
    //
    
    // Create a buffer for the square
    enemyVertexColorBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, enemyVertexColorBuffer);
    
    // Define colors (RGBA)
    colors = [];
    for (var i = 0; i < 4; i++) {
        colors = colors.concat ([0.5, 0.5, 1.0, 1.0]);
    }
    
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (colors), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 4 items (colors) ...
    enemyVertexColorBuffer.numItems = 4;
    // ... with each color holding 4 numbers (red, green, blue, and alpha)
    enemyVertexColorBuffer.itemSize = 4;
    
    /***************************************
    **
    ** Start building the Ball buffer
    **
    ****************************************/
    
    //
    // First, define the shape
    //
    
    // Create a buffer for the square
    ballVertexPositionBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, ballVertexPositionBuffer);
    
    // Define vertices
    var vertices = [
        0.25,  0.25, 0.0,
        0.25, -0.25, 0.0,
       -0.25,  0.25, 0.0,
       -0.25, -0.25, 0.0
    ];
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (vertices), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 4 items (vertex coordinates) ...
    ballVertexPositionBuffer.numItems = 4;
    // ... with each coordinate holding 3 numbers
    ballVertexPositionBuffer.itemSize = 3;
    
    //
    // Second, define the color
    //
    
    // Create a buffer for the square
    ballVertexColorBuffer = gl.createBuffer ();
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, ballVertexColorBuffer);
    
    // Define colors (RGBA)
    colors = [];
    for (var i = 0; i < 4; i++) {
        colors = colors.concat ([0.5, 0.5, 1.0, 1.0]);
    }
    
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (colors), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 4 items (colors) ...
    ballVertexColorBuffer.numItems = 4;
    // ... with each color holding 4 numbers (red, green, blue, and alpha)
    ballVertexColorBuffer.itemSize = 4;
    
}

// Rotation tracking
//var rTriangle = 0;
//var rSquare = 0;

function drawScene () {
    // Set up viewport size
    gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear viewport
    gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Define viewport perspective
    //   field of view: 45 degrees
    //   height : width ratio
    //   min render distance 0.1 units
    //   max render distance 100 units
    //   pMatrix is a mat4 module variable
    mat4.perspective (90, gl.viewportWidth / gl.viewportHeight, 0.1, 100, pMatrix);
  
    // Set mvMatrix as identity matrix
    mat4.identity (mvMatrix)
    
    // (This is the camera view location)
    mat4.translate (mvMatrix, [0.0, 0.0, -7.0]);
    
    /*
    //
    // Draw triangle
    //
    
    mvPushMatrix();
    // Transform the current matrix (move center of shape by [x y z] units)
    // IE multiply mvMatrix by input
    // (This is the camera view location)
    mat4.translate (mvMatrix, [0.0, 0.0, 0.0]);
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Move transformation matrix data from js space to graphics space
    setMatrixUniforms ();
    // Define what to treat vertex + matrix information
    //    Draw vertices in array as triangles
    //    Start from item 0
    //    Go until item numItems
    gl.drawArrays (gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    mvPopMatrix();
    */
    
    //
    // Draw square
    //
    
    mvPushMatrix();
    // Transform the current matrix (move center of shape by [x y z] units)
    // IE multiply mvMatrix by input
    mat4.translate (mvMatrix, [xPosition, yPosition, 0.0]);
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer (gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Move transformation matrix data from js space to graphics space
    setMatrixUniforms ();
    // Define what to treat vertex + matrix information
    //    Draw vertices in array as a triangle strip
    //    Start from item 0
    //    Go until item numItems
    gl.drawArrays (gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mvPopMatrix();
    
    //
    // Draw enemy
    //
    
    mvPushMatrix();
    // Transform the current matrix (move center of shape by [x y z] units)
    // IE multiply mvMatrix by input
    mat4.translate (mvMatrix, [xEnemy, yEnemy, 0.0]);
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, enemyVertexPositionBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, enemyVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer (gl.ARRAY_BUFFER, enemyVertexColorBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexColorAttribute, enemyVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Move transformation matrix data from js space to graphics space
    setMatrixUniforms ();
    // Define what to treat vertex + matrix information
    //    Draw vertices in array as a triangle strip
    //    Start from item 0
    //    Go until item numItems
    gl.drawArrays (gl.TRIANGLE_STRIP, 0, enemyVertexPositionBuffer.numItems);
    mvPopMatrix();
    
    //
    // Draw ball
    //
    
    mvPushMatrix();
    // Transform the current matrix (move center of shape by [x y z] units)
    // IE multiply mvMatrix by input
    mat4.translate (mvMatrix, [xBall, yBall, 0.0]);
    // Change the current target buffer for any buffer edits
    gl.bindBuffer (gl.ARRAY_BUFFER, ballVertexPositionBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, ballVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer (gl.ARRAY_BUFFER, ballVertexColorBuffer);
    gl.vertexAttribPointer (shaderProgram.vertexColorAttribute, ballVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Move transformation matrix data from js space to graphics space
    setMatrixUniforms ();
    // Define what to treat vertex + matrix information
    //    Draw vertices in array as a triangle strip
    //    Start from item 0
    //    Go until item numItems
    gl.drawArrays (gl.TRIANGLE_STRIP, 0, ballVertexPositionBuffer.numItems);
    mvPopMatrix();
}
