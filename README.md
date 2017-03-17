# LoadScreen.js
A JS library to wrap Three.js assets loading.


* Short implementation :
```js
//First create and append a webgl renderer, then :
const ls = new LoadScreen( renderer ).onComplete( init ).start( ASSETS );

function init () {
    //Init scene, then :
    ls.remove( animate );
}
```

* Automatical load screens.

![Default loader](https://github.com/Astrak/LoadScreen.js/blob/master/default_loader.gif)

* Simple assets management in a declarative style :
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
            onComplete: function ( object ) {
                object.scale.set( 1, 3, 1 );
            }
        }
    }
};
```

# Usage
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

.start( assets );//Load assets > process assets > compile materials > scene creation.

//or
.start();//Just add the info UI.

//Then for big script progress or just testing.
ls.setProgress( 0.5 );

//Finally at the end of the onComplete callback
ls.remove( animate );//Removal is tweened so next action is a callback.
```

## Assets declaration
### Textures
Specify texture files if any. They will be loaded first. Supported texture loaders :
- [x] THREE.TextureLoader
- [x] THREE.TGALoader
- [x] THREE.PVRLoader
- [x] THREE.KTXLoader
```js
ASSETS.textures = {
    myTexture1: { 
        path: 'path/to/pic.jpg',
        fileSize: 2789,//in Ko
        //Other threejs textures properties can be specified.
        minFilter: THREE.LinearFilter
    }
};

//GPU compression formats can be used, script will check device support.
ASSETS.textures.myTexture1.GPUCompression: {
    PVR: { path: 'path/to/PVR/pic.pvr', fileSize: 3298 },//Apple format.
    KTX: { path: 'path/to/KTX/pic.ktx', fileSize: 2983 }//Khronos format.
};

//After loading :
ASSETS.textures.myTexture1;//THREE.Texture

//Also simply
ASSETS.textures.myTexture2 = new THREE.Texture(...);//won't be processed
```

### Geometries
Specify geometry files for geometry loaders. They will be loaded second. Supported geometry loaders :
- [x] THREE.JSONLoader (threejs blender exporter)
- [x] THREE.PLYLoader
- [x] THREE.CTMLoader (`load` method)
- [x] THREE.VTKLoader
- [x] THREE.STLLoader
- [ ] THREE.BufferGeometryLoader
```js
ASSETS.geometries = {
    myGeometry1: {
        path: 'path/to/geometry.ply',
        fileSize: 9498,//Ko
        //Next two are optional :
        toBufferGeometry: false,//Force creation of a BufferGeometry.
        onComplete: function ( geometry ) {
            //geometry.computeFlatVertexNormals / translate / center / merge / addAttribute...
        }
    }
};

//After loading :
ASSETS.geometries.myGeometry1;//THREE.Geometry

//Also simply
ASSETS.geometries.myGeometry2 = new THREE.BoxGeometry( 3, 2, 1 );//won't be processed
```

### Objects
Specify objects to load or to create from assets. Loaded in third place. Supported object loaders :
(animations not handled for now)
- [x] THREE.ThreeMFLoader
- [x] THREE.AMFLoader
- [x] THREE.AssimpLoader
- [x] THREE.AssimpJSONLoader
- [ ] THREE.CTMLoader (`loadParts` method for multiple geometries)
- [ ] THREE.MMDLoader
- [ ] THREE.ObjectLoader
- [ ] THREE.PlayCanvasLoader
- [ ] THREE.UTF8Loader
- [x] THREE.VRMLLoader
```js
ASSETS.objects = {
    myObject1: {//1. load from file
        path: 'path/to/object.wrl',
        fileSize: 3846//Ko
    },
    myObject2: {//2. or create from asset
        geometry: 'myGeometry1',//Use geometry asset 'myGeometry1'
        material: new THREE.MeshPhongMaterial()
    },
    myObject3: {//3. or create from scratch
        geometry: new THREE.PlaneBufferGeometry( 5, 3, 9 ),
        material: new THREE.MeshBasicMaterial()
    }
    myObject4: new THREE.Mesh(...);//Won't be processed
};

//other parameters
ASSETS.objects.myObject5 = {
    path: 'path/to/object.amf',
    type: 'mesh',//Or 'points' or 'line', defaults to 'mesh'.
    //Specify any mesh or material property.
    color: 0x33ff89,//Assigned to material.
    map: 'myTexture1',//Asset assigned to material.
    castShadow: true,//Assigned to mesh.
    info: 'This is my object',//Unknown key 'info' in mesh and material > assigned to mesh.userData.
    //For any further change :
    onComplete: function ( object ) {
        //object.geometry.computeBoundingBox or anything.
    }
};
```

### Scene
Todo.
Supported scene loaders :
- [ ] THREE.AWDLoader
- [ ] THREE.OBJLoader
- [ ] THREE.FBXLoader
- [ ] THREE.ColladaLoader
- [ ] THREE.ColladaLoader (2)
- [ ] THREE.BabylonLoader

### Material loaders
Todo. 
Supported material loaders :
- [ ] THREE.MaterialLoader

### Cubemap loaders
Todo. 
Supported cubemap loaders :
- [ ] THREE.CubeTextureLoader
- [ ] THREE.HDRCubeTextureLoader

### Animation loaders
Todo. 
Supported animation loaders :
- [ ] THREE.BVHLoader

# Roadmap
* handle cubemaps, scenes, material, animation loaders + pmrem creation
* support all loaders
* code the 'forcedStart' parameter
* check glTF resources organization for possible inspiration
* add fancy loader types
* handle custom message/warning/buttons before loading without setting style type to custom.. ?
* second progress bar at top of screen for assets loading after start
* add setStyle method for another style if further calls
* webgl loader instead of html ?
* extend to BabylonJS
* npm package
* react component

# License
MIT

# Dependencies : 
* Threejs
* Threejs loaders needed for your files
