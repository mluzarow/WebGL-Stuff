function webGL_Start () {
    // Find the canvas element
    var canvas = document.getElementById ("canvas");
    
    // 
    initGL (canvas);
    initShaders ();
    initBuffers ();
    
    // Make viewport black
    gl.clearColor (0.0, 0.0, 0.0, 1.0);
    // Enable layering
    gl.enable (gl.DEPTH_TEST);
    
    // Swap buffers
    drawScene ();
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
// Hold colors of both objects
var triangleVertexColorBuffer;
var squareVertexColorBuffer;

function initBuffers () {
    /***************************************
    **
    ** Start building the triangle buffer
    **
    ****************************************/
    
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
        1.0,  0.0, 0.0, 1.0,
        0.0,  1.0, 0.0, 1.0,
        0.0,  0.0, 1.0, 1.0
    ];
    // Make a new Float32Array that uses vertices list to fill the buffer
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (colors), gl.STATIC_DRAW);
    
    // Define buffer information as a set of 3 items (colors) ...
    triangleVertexColorBuffer.numItems = 3;
    // ... with each color holding 4 numbers (red, green, blue, and alpha)
    triangleVertexColorBuffer.itemSize = 4;
    
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
        1.0,  1.0, 0.0,
       -1.0,  1.0, 0.0,
        1.0, -1.0, 0.0,
       -1.0, -1.0, 0.0
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
}

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
    mat4.perspective (45, gl.viewportWidth / gl.viewportHeight, 0.1, 100, pMatrix);
    // Set mvMatrix as identity matrix
    mat4.identity (mvMatrix)
    
    //
    // Draw triangle
    //
    
    // Transform the current matrix (move center of shape by [x y z] units)
    // IE multiply mvMatrix by input
    mat4.translate (mvMatrix, [-1.5, 0.0, -7.0]);
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
    
    //
    // Draw square
    //
    
    // Transform the current matrix (move center of shape by [x y z] units)
    // IE multiply mvMatrix by input
    mat4.translate (mvMatrix, [3.0, 0.0, 0.0]);
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
}
