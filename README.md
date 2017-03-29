# LoadScreen.js
[![Latest NPM release][npm-badge]][npm-badge-url]
[![License][license-badge]][license-badge-url]
[![Dependencies][dependencies-badge]][dependencies-badge-url]

A Three.js assets loading wrapper.

## Summary

1. [Installation](#installation)
1. [Overview](#overview)
    1. [Main pattern](#main-pattern)
    1. [Load screens](#load-screens)
    1. [Declarative assets style](#assets-style)
1. [Full pattern](#full-pattern)
1. [Assets declaration](#assets-declaration)
    1. [Files](#1-files)
    1. [Fonts](#2-fonts)
    1. [Textures](#3-textures)
    1. [Materials](#4-materials)
    1. [Geometries](#5-geometries)
    1. [Animations](#6-animations)
    1. [Objects](#7-objects)
1. [FAQ](#faq)

## Installation
Include in your project :
```
npm install loadscreen
```
Or in your page :
```html
<script type="text/javascript" src="LoadScreen.min.js"/>
```

## Overview

A full demo is proposed on codepen [here](http://codepen.io/Astrak/pen/OpwEZj?editors=0010).

### Main pattern
```js
//First create and append a webgl renderer, then :
const ls = new LoadScreen( renderer ).onComplete( init ).start( ASSETS );

function init () {
    //Init scene, then :
    ls.remove( animate );
}
```

### Load screens
By default LoadScreen.js automatically generates the 'linear-horizontal' load screen. It displays and follows those steps : 'Loading' > 'Processing' > 'Compiling' > 'Creating scene'.

![Loader types](https://raw.githubusercontent.com/Astrak/LoadScreen.js/master/loaders.png "Loader types")

### Assets style
Passed assets style is declarative, no callback hell. 
```js
const ASSETS = {
    textures: {
        foliageMap: {
            path: 'path/to/pic1.png', fileSize: 1467,
            minFilter: THREE.LinearFilter
        },
        foliageAO: { 
            path: 'path/to/pic2.png', fileSize: 1275 
        }
    },
    geometries: {
        shape: {
            path: 'path/to/model.json', fileSize: 3876,
            flatNormals: true,
            toBufferGeometry: true,
            onComplete ( geometry ) {
                geometry.addAttribute( 'uv2', geometry.attributes.uv )
            }
        }
    }, 
    objects: {
        tree: {
            geometry: 'shape',
            map: 'foliageMap',
            aoMap: 'foliageAO',
            material: new THREE.MeshStandardMaterial(),
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
    type: 'linear-horizontal',//Main look. 'custom' empties the info container.
    size: '170px',//Width of the central info container, in px or in %.
    background: '#333',
    progressContainerColor: '#000',
    progressColor: '#333',
    infoStyle: {//Text style : default values.
        fontFamily: 'monospace',
        color: '#666',
        fontSize: '12px',
        padding: '10px'
    },
    weight: '10',//Weight of the progress element (svg units).
    sizeInfo: true,//Display size progress in MB.
    progressInfo: true,//Display the progress element.
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
Note : the `fileSize` parameter is necessary for every files, [explication here](#faq).
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
        minFilter: THREE.LinearFilter,
        onComplete ( texture ) {
            //Do something.
        }
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
- [x] THREE.MaterialLoader
- [x] THREE.MTLLoader
```js
ASSETS.materials = {
    myMaterial1: {
        path: 'path/to/material.mtl',
        fileSize: 188,
        //Optionally :
        map: 'myTexture1'//Asset assigned after loading.
        //To use the MTLLoader with the OBJLoader and its 'setMaterials' method,
        //just add a 'setMaterials' property to the object, of value 'myMaterial1'.
        //If used alone, the output of the MTLLoader is a THREE.MTLLoader.MaterialCreator :
        onComplete ( matCreator ) {
            //matCreator.preload() or matCreator.getAsArray()
        }

    }
};

//After loading :
ASSETS.materials.myMaterial1;//THREE.MTLLoader.MaterialCreator,
//or object with materials ( matCreator.preload() )
//or array with materials ( matCreator.getAsArray() ).

//Also in most other use cases :
ASSETS.materials.myMaterial2 = new THREE.Material();//Won't be processed.
```

### 5. Geometries
- [ ] THREE.BufferGeometryLoader (format conflict with JSONLoader)
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
        flatNormals: true,//Call geometry.computeFlatVertexNormals() on THREE.Geometry instances.
        toBufferGeometry: false,//Force creation of a BufferGeometry.
        onComplete ( geometry ) {
            //geometry.translate / center / merge / addAttribute...
        }
    }
};

//After loading :
ASSETS.geometries.myGeometry1;//THREE.Geometry

//Also simply :
ASSETS.geometries.myGeometry2 = new THREE.BoxGeometry( 3, 2, 1 );//Won't be processed.
```

### 6. Animations
- [x] THREE.BVHLoader
```js
ASSETS.animations = {
    myAnimation1: {
        path: 'path/to/anim.bvh',
        fileSize: 4827,
        onComplete ( bvh ) {
            //Catch bvh.skeleton and bvh.clip.
        }
    }
};
```

### 7. Objects
- [x] THREE.ThreeMFLoader
- [x] THREE.AMFLoader
- [x] THREE.AssimpLoader
- [x] THREE.AssimpJSONLoader
- [x] THREE.AWDLoader
- [x] THREE.BabylonLoader
- [x] THREE.BinaryLoader
- [x] THREE.ColladaLoader
- [x] THREE.ColladaLoader (2)
- [ ] THREE.CTMLoader (`loadParts` method for multiple geometries)
- [x] THREE.FBXLoader
- [x] THREE.FBXLoader (2)
- [x] THREE.GLTFLoader
- [x] THREE.GLTFLoader (2)
- [x] THREE.MMDLoader (needs the additional parameter `VMDPaths` )
- [x] THREE.PCDLoader
- [x] THREE.ObjectLoader
- [x] THREE.OBJLoader
- [ ] THREE.PlayCanvasLoader (format conflict with ObjectLoader)
- [x] THREE.UTF8Loader
- [x] THREE.VRMLLoader
```js
ASSETS.objects = {
    myObject1: {//Load from file :
        path: 'path/to/object.obj',
        setMaterials: 'myMaterial1',//OBJLoader option for use with MTLLoader.
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
        onComplete ( collada ) {
            //Catch collada.scene, collada.animation etc.
            //Same with GLTF etc.
        }
    }
};

//Other parameters.
ASSETS.objects.myObject5 = {
    geometry: 'myGeometry1',
    material: new THREE.MeshPhongMaterial(),
    type: 'mesh',//Or 'points' or 'line', defaults to 'mesh'.
    //Specify any mesh or material property :
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

## FAQ
Why is it mandatory to indicate `fileSize` ?

>- XHR issue handling : sometimes the progress events can have `e.total` equaling zero, resulting in an infinite progress value when doing `e.loaded/e.total`. With `fileSize` in Ko, the library has a fallback.
>- UX quality : with this information the loader has a linear progress. Contrarily, if two files of different sizes were to be loaded without the `fileSize` information, one big and one small, and if the small one is immediately received before even having a progress event of the other one, the progress bar can jump to 50%, then take more time to reach 100%, giving a mistaken information. 

Why isn't the indicator progression perfectly smooth ?

> For one file it should be, but for more, though the progress should be linear, it relies on the three.js loaders which automatically process the received data to output a geometry, a cubemap etc, while other files are still loading. Thus the processing time inside the native loaders can still freeze the rest of the loading sometimes. The HDRCubeTextureLoader is particularly concerned. Of course for performance reasons it should be more visible on mobile than pc.

[npm-badge]: https://img.shields.io/npm/v/loadscreen.svg
[npm-badge-url]: https://www.npmjs.com/package/loadscreen
[license-badge]: https://img.shields.io/npm/l/loadscreen.svg
[license-badge-url]: ./LICENSE
[dependencies-badge]: https://img.shields.io/david/astrak/loadscreen.js.svg
[dependencies-badge-url]: https://david-dm.org/astrak/loadscreen.js