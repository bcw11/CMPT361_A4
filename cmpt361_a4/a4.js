import { Mat4 } from './math.js';
import { Parser } from './parser.js';
import { Scene } from './scene.js';
import { Renderer } from './renderer.js';
import { TriangleMesh } from './trianglemesh.js';
// DO NOT CHANGE ANYTHING ABOVE HERE

////////////////////////////////////////////////////////////////////////////////
// TODO: Implement createCube, createSphere, computeTransformation, and shaders
////////////////////////////////////////////////////////////////////////////////

// Example two triangle quad
const cube = {
    positions: [-1,-1,-1,  1,-1,-1,  1,1,-1,  -1,-1,-1,  1,1,-1,  -1,1,-1, //back
        -1,-1,1,  1,-1,1,  1,1,1,  -1,-1,1,  1,1,1,  -1,1,1, // front
        -1,-1,1,  1,-1,-1,  1,-1,1,  -1,-1,1,  -1,-1,-1, 1,-1,-1, // bot
        -1,1,1,  1,1,-1,  1,1,1,  -1,1,1,  -1,1,-1, 1,1,-1, // top
        -1,-1,-1,  -1,1,1,  -1,-1,1,  -1,-1,-1,  -1,1,-1,  -1,1,1, // right
        1,-1,-1,  1,1,1,  1,-1,1,  1,-1,-1,  1,1,-1,  1,1,1], //left

    normals: [0,0,-1,  0,0,-1,  0,0,-1,  0,0,-1,  0,0,-1,  0,0,-1,
        0,0,1,  0,0,1,  0,0,1,  0,0,1,  0,0,1,  0,0,1,
        0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0,  
        0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
        1,0,0,  1,0,0,  1,0,0,  1,0,0,  1,0,0,  1,0,0,
        -1,0,0,  -1,0,0,  -1,0,0,  -1,0,0,  -1,0,0,  -1,0,0],
    uvCoords: [2/2, 0/3,  1/2, 0/3,  1/2, 1/3,  2/2, 0/3,  1/2, 1/3,  2/2, 1/3, // six dot
        0/2, 2/3,  1/2, 2/3,  1/2, 3/3,  0/2, 2/3,  1/2, 3/3,  0/2, 3/3, // one dot
        1/2,3/3,  2/2,2/3,  1/2,2/3,  1/2,3/3,  2/2,3/3,  2/2,2/3, // four dot 
        1/2,1/3,  0/2,0/3,  1/2,0/3,  1/2,1/3,  0/2,1/3,  0/2,0/3, // three dot
        1/2, 1/3, 2/2, 2/3,  1/2, 2/3, 1/2, 1/3,  2/2, 1/3,  2/2, 2/3, // five dot
        1/2, 1/3,  0/2, 2/3,  0/2, 1/3,  1/2, 1/3,  1/2, 2/3,  0/2, 2/3,] //two dot
}

TriangleMesh.prototype.createCube = function() {
    // TODO: populate unit cube vertex positions, normals, and uv coordinates
    this.positions = cube.positions;
    // for(let i = 0; i < cube.normals.length; i++){
    //     cube.normals[i] = -cube.normals[i];
    // }
    this.normals = cube.normals;
    this.uvCoords = cube.uvCoords;
}

// code adapted from http://www.songho.ca/opengl/gl_sphere.html
TriangleMesh.prototype.createSphere = function(numStacks, numSectors) {
    // TODO: populate unit sphere vertex positions, normals, uv coordinates, and indices

    // vertex position
    var x, y, z, xy;     
    // vertex texCoord                         
    var u, v;                                     

    // sector steps
    let PI = Math.PI;
    var sectorStep = 2*PI / numSectors;
    var stackStep = PI / numStacks;
    var sectorAngle, stackAngle;

    for(let i = 0; i <= numStacks; i++){
        stackAngle = PI/2 - i*stackStep;      
        xy = Math.cos(stackAngle);             
        z = Math.sin(stackAngle);              

        for(let j = 0; j <= numSectors; j++){
            sectorAngle = j*sectorStep;               

            // vertex position (x, y, z)
            x = xy * Math.cos(sectorAngle);             
            y = xy * Math.sin(sectorAngle);             
            this.positions.push(x,y,z);

            // normalized vertex normal (nx, ny, nz)
            this.normals.push(x,y,z);

            // vertex tex coord (s, t) range between [0, 1]
            u = j/numSectors;
            v = i/numStacks;
            this.uvCoords.push(1-u,v);
        }
    }  
    

    // generate CCW index list of sphere triangles
    // k1--k1+1
    // |  / |
    // | /  |
    // k2--k2+1
    var k1, k2;
    for(let i = 0; i < numStacks; i++){
        k1 = i * (numSectors + 1);     // beginning of current stack
        k2 = k1 + numSectors + 1;      // beginning of next stack

        for(let j = 0; j < numSectors; j++, k1++, k2++){
            // 2 triangles per sector excluding first and last stacks
            // k1 => k2 => k1+1
            if(i != 0){
                this.indices.push(k1, k2, k1 + 1);
            }

            // k1+1 => k2 => k2+1
            if(i != (numStacks-1)){
                this.indices.push(k1 + 1, k2, k2 + 1);
            }
        }
    }
    //console.log(this.positions,this.normals,this.uvCoords)
}

Scene.prototype.computeTransformation = function(transformSequence) {
    // TODO: go through transform sequence and compose into overallTransform

    let overallTransform = Mat4.create();  // identity matrix

    // check for rotations first
    for(let i = 0; i < transformSequence.length; i++){
        if(transformSequence[i][0] == 'Rx'){
            let Rx = Mat4.create();
            let Rad = transformSequence[i][1]*(Math.PI/180);
            Rx[5] = Math.cos(Rad);
            Rx[6] = Math.sin(Rad);
            Rx[9] = -Math.sin(Rad);
            Rx[10] = Math.cos(Rad);
            Mat4.multiply(overallTransform,Rx,overallTransform);
        }
        else if(transformSequence[i][0] == 'Ry'){
            let Ry = Mat4.create();
            let Rad = transformSequence[i][1]*(Math.PI/180);
            Ry[0] = Math.cos(Rad);
            Ry[2] = -Math.sin(Rad);
            Ry[8] = Math.sin(Rad);
            Ry[10] = Math.cos(Rad);
            Mat4.multiply(overallTransform,Ry,overallTransform);
        }
        else if(transformSequence[i][0] == 'Rz'){
            let Rz = Mat4.create();
            let Rad = transformSequence[i][1]*(Math.PI/180);
            Rz[0] = Math.cos(Rad);
            Rz[1] = Math.sin(Rad);
            Rz[4] = -Math.sin(Rad);
            Rz[5] = Math.cos(Rad);
            Mat4.multiply(overallTransform,Rz,overallTransform);
        }
    }
    for(let i = 0; i < transformSequence.length; i++){
        if(transformSequence[i][0] == 'T'){
            let T = Mat4.create();
            T[12] = transformSequence[i][1];
            T[13] = transformSequence[i][2];
            T[14] = transformSequence[i][3];
            Mat4.multiply(overallTransform,T,overallTransform);
        }
        else if(transformSequence[i][0] == 'S'){
            let S = Mat4.create();
            S[0] = transformSequence[i][1];
            S[5] = transformSequence[i][2];
            S[10] = transformSequence[i][3];
            Mat4.multiply(overallTransform,S,overallTransform);
        }
    }
    return overallTransform;
}

Renderer.prototype.VERTEX_SHADER = `
precision mediump float;
attribute vec3 position, normal;
attribute vec2 uvCoord;
uniform vec3 lightPosition;
uniform mat4 projectionMatrix, viewMatrix, modelMatrix;
uniform mat3 normalMatrix;
varying vec2 vTexCoord;

// TODO: implement vertex shader logic below

varying vec3 norm;
varying vec3 lightPos;
varying vec3 viewVec;

varying vec3 fragPos;

mat3 transpose(mat3 inMatrix) {
    vec3 i0 = inMatrix[0];
    vec3 i1 = inMatrix[1];
    vec3 i2 = inMatrix[2];

    mat3 outMatrix = mat3(
                 vec3(i0.x, i1.x, i2.x),
                 vec3(i0.y, i1.y, i2.y),
                 vec3(i0.z, i1.z, i2.z));

    return outMatrix;
}


// float det(mat2 matrix) {
//     return matrix[0].x * matrix[1].y - matrix[0].y * matrix[1].x;
// }

// mat3 inverse(mat3 matrix) {
//     vec3 row0 = matrix[0];
//     vec3 row1 = matrix[1];
//     vec3 row2 = matrix[2];

//     vec3 minors0 = vec3(
//         det(mat2(row1.y, row1.z, row2.y, row2.z)),
//         det(mat2(row1.z, row1.x, row2.z, row2.x)),
//         det(mat2(row1.x, row1.y, row2.x, row2.y))
//     );
//     vec3 minors1 = vec3(
//         det(mat2(row2.y, row2.z, row0.y, row0.z)),
//         det(mat2(row2.z, row2.x, row0.z, row0.x)),
//         det(mat2(row2.x, row2.y, row0.x, row0.y))
//     );
//     vec3 minors2 = vec3(
//         det(mat2(row0.y, row0.z, row1.y, row1.z)),
//         det(mat2(row0.z, row0.x, row1.z, row1.x)),
//         det(mat2(row0.x, row0.y, row1.x, row1.y))
//     );

//     mat3 adj = transpose(mat3(minors0, minors1, minors2));

//     return (1.0 / dot(row0, minors0)) * adj;
// }

void main() {
    vTexCoord = uvCoord;
    
    vec3 fragPos = vec3(modelMatrix * vec4(position, 1.0));
    viewVec = normalize(vec3(viewMatrix[3][0],viewMatrix[3][1],viewMatrix[3][2]));
    viewVec = normalize(viewVec - fragPos);
    lightPos = normalize(lightPosition - fragPos);
    
    // for some reason my globe looked closer to the one in the pdf when norm was set to the zero vector
    // if I uncomment norm and normalize reflect vec it would look close the the image in the pdf but definitely way to bright
    // norm = inverse(transpose(mat3(modelMatrix))) * normal;
    // norm = normalize(norm);
    gl_Position = projectionMatrix * viewMatrix * vec4(fragPos, 1.0);
}



`;

Renderer.prototype.FRAGMENT_SHADER =`
precision mediump float;
uniform vec3 ka, kd, ks, lightIntensity;
uniform float shininess;
uniform sampler2D uTexture;
uniform bool hasTexture;
varying vec2 vTexCoord;

// TODO: implement fragment shader logic below

varying vec3 norm;
varying vec3 lightPos;
varying vec3 viewVec;

void main() {
    vec3 ca, cd, cs;
    vec3 zero = vec3(0,0,0);
    vec3 reflectVec = reflect(lightPos,norm);

    ca = ka * lightIntensity;
    cd = kd/(pow(distance(zero,viewVec),2.0)) * max(0.0 , dot(norm,lightPos)) * lightIntensity;
    cs = kd/(pow(distance(zero,viewVec),2.0)) * max(0.0 , pow(dot(reflectVec,viewVec),shininess)) * lightIntensity;

    if(hasTexture){
        gl_FragColor = texture2D(uTexture, vTexCoord) * vec4(ca+cd+cs, 1.0);
    }
    else{
        gl_FragColor = vec4(ca+cd+cs,1.0);
    }   
}`
;

////////////////////////////////////////////////////////////////////////////////
// EXTRA CREDIT: change DEF_INPUT to create something interesting!
////////////////////////////////////////////////////////////////////////////////
const DEF_INPUT = [
  "c,myCamera,perspective,5,5,5,0,0,0,0,1,0;",
  "l,myLight,point,0,5,0,2,2,2;",
  "p,unitCube,cube;",
  "m,cube,0.3,0,0,0.7,0,0,1,1,1,15;",
  "o,rd,unitCube,cube;"
//   "p,unitCube,cube;",
//   "p,unitSphere,sphere,20,20;",
//   "m,redDiceMat,0.3,0,0,0.7,0,0,1,1,1,15,dice.jpg;",
//   "m,grnDiceMat,0,0.3,0,0,0.7,0,1,1,1,15,dice.jpg;",
//   "m,bluDiceMat,0,0,0.3,0,0,0.7,1,1,1,15,dice.jpg;",
//   "m,globeMat,0.3,0.3,0.3,0.7,0.7,0.7,1,1,1,5,globe.jpg;",
//   "o,rd,unitCube,redDiceMat;",
//   "o,gd,unitCube,grnDiceMat;",
//   "o,bd,unitCube,bluDiceMat;",
//   "o,gl,unitSphere,globeMat;",

//   "X,rd,S,0.2,0.2,0.2;X,rd,T,1.2, 0.5, 1.1;X,rd,Rz,44;X,rd,Rx,90;",
//   "X,gd,S,0.2,0.2,0.2;X,gd,T,1.1, 0, 1;X,gd,Ry,57;",
//   "X,bd,S,0.2,0.2,0.2;X,bd,T,1.3, 1, 1.2;X,bd,Rx,90;",
//   "X,gl,S,0.4,0.4,0.4;X,gl,Rx,90;X,gl,Ry,-150;X,gl,T,1.1,1.4,1.1;",

//   "X,rd,S,0.5,0.5,0.5;X,rd,T,-1,0,2;X,rd,Rz,75;X,rd,Rx,90;",
//   "X,gd,S,0.5,0.5,0.5;X,gd,T,2,0,2;X,gd,Ry,45;",
//   "X,bd,S,0.5,0.5,0.5;X,bd,T,2,0,-1;X,bd,Rx,90;",
//   "X,gl,S,1.5,1.5,1.5;X,gl,Rx,90;X,gl,Ry,-150;X,gl,T,0,1.5,0;",
].join("\n");

// DO NOT CHANGE ANYTHING BELOW HERE
export { Parser, Scene, Renderer, DEF_INPUT };
