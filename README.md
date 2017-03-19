# LoadScreen.js
[![Latest NPM release][npm-badge]][npm-badge-url]
[![License][license-badge]][license-badge-url]
[![Dependencies][dependencies-badge]][dependencies-badge-url]

A Three.js assets loading wrapper.

## Summary

1. [Installation](#installation)
1. [Usage](#usage)
1. [Full pattern](#full-pattern)
1. [Assets declaration](#assets-declaration)
    1. [Files](#files)
    1. [Fonts](#fonts)
    1. [Textures](#textures)
    1. [Materials](#materials)
    1. [Geometries](#geometries)
    1. [Animations](#animations)
    1. [Objects](#objects)
1. [Roadmap](#roadmap)

## Installation
Install with NPM :
```
npm install loadscreen
```
Or include in your page :
```html
<script type="text/javascript" src="LoadScreen.min.js"/>
```

## Usage
Short implementation :
```js
//First create and append a webgl renderer, then :
const ls = new LoadScreen( renderer ).onComplete( init ).start( ASSETS );

function init () {
    //Init scene, then :
    ls.remove( animate );
}
```

Automatical load screens. 'Loading' > 'Processing' > 'Compiling' > 'Creating scene' messages.

![Default loader](https://github.com/Astrak/LoadScreen.js/blob/master/default_loader.gif)

Simple assets management in a declarative style :
```js
const ASSETS = {
    textures: {
        foliage: {
            path: 'path/to/pic1.png', fileSize: 1467,
            minFilter: THREE.LinearFilter
        }
    }, 
    geometries: {
        treeGeo: {
            path: 'path/to/model.json', fileSize: 3876,
            toBufferGeometry: true
        }
    }, 
    objects: {
        tree: {
            geometry: 'treeGeo',
            map: 'foliage',
            material: new THREE.MeshBasicMaterial(),
            castShadow: true,
            transparent: true,
            onComplete ( object ) {
                object.scale.set( 1, 3, 1 );
            }
        }
    }
};
```
## Full pattern
Methods are chainable, except `remove` and `setProgress`. Values are default.
```js
const style = {
    type: 'bar',//Main look. Also 'circular'. 'custom' empties the info container.
    size: '150px',//Width of the central info container, in px or in %.
    background: '#333',
    progressBarContainer: '#444',
    progressBar: '#fb0',
    infoColor: '#666',//Text color.
    weight: '6px',//Weight of the progress element, in px ('bar' type) or svg units ('circular').
    sizeInfo: true,
    textInfo: [ 'Loading', 'Processing', 'Compiling', 'Creating scene' ]//Or false to remove.
};

const options = {
    forcedStart: false,//Start loading even if the canvas is out of sight (usually bad practice).
    verbose: false,//Logs progress, process and compile duration + total load screen duration.
    tweenDuration: .5//Progress and removal tweens durations.
};

const ls = new LoadScreen( renderer, style );//Style is optional.

window.addEventListener( 'resize', () => { 
    renderer.setSize( width, height ); 
    ls.setSize( width, height ); 
});

ls.setOptions( options )

.onProgress( progress => { ... } )//Can be used to update a custom UI.

.onComplete( init )//After processing and compiling.

.start( ASSETS );//Load assets > process assets > compile materials > scene creation.

//or
.start();//Just add the info UI.

//Then for big script progress or just testing.
ls.setProgress( 0.5 );

//Finally at the end of the onComplete callback
ls.remove( animate );//Removal is tweened so next action is a callback.
```

## Assets declaration
By order of processing :

### 1. Files
- [x] THREE.FileLoader
```js
ASSETS.files = {
    myFile1: { 
        path: 'path/to/file.txt',
        fileSize: 2789,//in Ko
        onComplete ( file ) {
            //do something
        }
    }
};
```

### 2. Fonts
- [x] THREE.TTFLoader
```js
ASSETS.fonts.myFont1 = {
    path: 'path/to/font.ttf',
    fileSize: 321
};

//After loading :
ASSETS.fonts.myFont1;//THREE.Font
```

### 3. Textures
- [x] THREE.CubeTextureLoader
- [x] THREE.HDRCubeTextureLoader
- [x] THREE.KTXLoader
- [x] THREE.PVRLoader
- [x] THREE.TextureLoader
- [x] THREE.TGALoader
```js
ASSETS.textures = {
    myTexture1: {//Regular textures.
        path: 'path/to/pic.jpg',
        fileSize: 2789,//in Ko
        //Other threejs textures properties can be specified.
        minFilter: THREE.LinearFilter
    },
    myTexture2: {//Cubemaps.
        path: [ '1.hdr', '2.hdr', '3.hdr', '4.hdr', '5.hdr', '6.hdr' ],
        fileSize: 5321,
        //Optional : if files are HDR, a PMREM can get output.
        toPMREM: true
    }
};

//GPU compression formats can be used, script will check device support.
ASSETS.textures.myTexture1.GPUCompression: {
    PVR: { path: 'path/to/PVR/pic.pvr', fileSize: 3298 },//Apple format.
    KTX: { path: 'path/to/KTX/pic.ktx', fileSize: 2983 }//Khronos format.
};

//After loading :
ASSETS.textures.myTexture1;//THREE.Texture

//Also simply :
ASSETS.textures.myTexture3 = new THREE.Texture(...);//Won't be processed.
```

### 4. Materials
- [ ] THREE.MaterialLoader
- [ ] THREE.MTLLoader
```js
ASSETS.materials = {
    myMaterial1
};

//After loading :
ASSETS.materials.myMaterial1;//THREE.Material

//Also simply :
ASSETS.materials.myMaterial2 = new THREE.Material();//Won't be processed.
```

### 5. Geometries
- [ ] THREE.BufferGeometryLoader
- [x] THREE.CTMLoader (`load` method)
- [x] THREE.JSONLoader (threejs blender exporter)
- [x] THREE.PLYLoader
- [x] THREE.STLLoader
- [x] THREE.VTKLoader
```js
ASSETS.geometries = {
    myGeometry1: {
        path: 'path/to/geometry.ply',
        fileSize: 9498,//Ko
        //Next two are optional :
        toBufferGeometry: false,//Force creation of a BufferGeometry.
        onComplete ( geometry ) {
            //geometry.computeFlatVertexNormals / translate / center / merge / addAttribute...
        }
    }
};

//After loading :
ASSETS.geometries.myGeometry1;//THREE.Geometry

//Also simply :
ASSETS.geometries.myGeometry2 = new THREE.BoxGeometry( 3, 2, 1 );//Won't be processed.
```

### 6. Animations
- [ ] THREE.BVHLoader
```js
ASSETS.materials = {
    myMaterial1
};

//After loading :
ASSETS.materials.myMaterial1;//THREE.Material

//Also simply :
ASSETS.materials.myMaterial2 = new THREE.Material();//Won't be processed.
```

### 7. Objects
- [ ] THREE.3DSLoader
- [x] THREE.ThreeMFLoader
- [x] THREE.AMFLoader
- [x] THREE.AssimpLoader
- [x] THREE.AssimpJSONLoader
- [x] THREE.AWDLoader
- [x] THREE.BabylonLoader
- [ ] THREE.BinaryLoader
- [x] THREE.ColladaLoader
- [x] THREE.ColladaLoader (2)
- [ ] THREE.CTMLoader (`loadParts` method for multiple geometries)
- [ ] THREE.FBXLoader
- [x] THREE.FBXLoader (2)
- [x] THREE.GLTFLoader
- [ ] THREE.GLTFLoader (2)
- [x] THREE.MMDLoader (needs the additional parameter `VMDPaths` )
- [x] THREE.PCDLoader
- [ ] THREE.ObjectLoader
- [x] THREE.OBJLoader
- [ ] THREE.PlayCanvasLoader
- [x] THREE.UTF8Loader
- [x] THREE.VRMLLoader
```js
ASSETS.objects = {
    myObject1: {//Load from file :
        path: 'path/to/object.obj',
        fileSize: 3846//Ko
    },
    myObject2: {//Or create from asset :
        geometry: 'myGeometry1',//Use geometry asset 'myGeometry1'
        material: new THREE.MeshPhongMaterial()
    },
    myObject3: {//Or create from scratch :
        geometry: new THREE.PlaneBufferGeometry( 5, 3, 9 ),
        material: new THREE.MeshBasicMaterial()
    },
    myObject4: {//The object may have a hierarchy and / or animation(s):
        path: 'path/to/object.dae',
        fileSize: 1111,
        convertUpAxis: true,//Collada loader option.
        onComplete ( object ) {
            //Catch object.scene, object.animation etc.
            //Same with GLTF.
        }
    }
};

//Other parameters.
ASSETS.objects.myObject5 = {
    geometry: 'myGeometry1',
    material: new THREE.MeshPhongMaterial(),
    type: 'mesh',//Or 'points' or 'line', defaults to 'mesh'.
    //Specify any mesh or material property 
    //(if the object is a hierarchy, they will only get assigned to the root mesh).
    map: 'myTexture1',//Asset assigned to material.
    color: 0x33ff89,//Converted to a THREE.Color and assigned to material.
    castShadow: true,//Assigned to mesh.
    info: 'This is my object',//Unknown key 'info' in mesh and material > assigned to mesh.userData.
};

//After loading : 
ASSETS.objects.myObject5;//THREE.Mesh

//Also simply :
ASSETS.objects.myObject6 = new THREE.Mesh(...);//Won't be processed.
```

## Roadmap
* add material and support THREE.MaterialLoader
* add animations and support THREE.BVHLoader
* auto-tween exposure after removal ?
* code the 'forcedStart' parameter
* add fancy loader types
* webgl loader instead of html ?
* handle custom message/warning/buttons before loading without setting style type to custom.. ?
* second progress bar at top of screen for assets loading after start
* add setStyle method for another style if further calls
* add 'gui' parameter that creates a dat.GUI UI for specified parameters, like gui: [ 'metalness', 'side', 'castShadow' ].. ?

[npm-badge]: https://img.shields.io/npm/v/loadscreen.svg
[npm-badge-url]: https://www.npmjs.com/package/loadscreen
[license-badge]: https://img.shields.io/npm/l/loadscreen.svg
[license-badge-url]: ./LICENSE
[dependencies-badge]: https://img.shields.io/david/astrak/loadscreen.js.svg
[dependencies-badge-url]: https://david-dm.org/astrak/loadscreen.js