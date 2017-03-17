# LoadScreen.js
A JS library to wrap Three.js assets loading.
1. Declarative assets.
2. UX-wise process : load > process > compile > scene creation.
3. Load screens included.

```js
/* assets.js */
const ASSETS = {
    textures: {
        foliage: {
            path: 'path/to/pic1.png',
            fileSize: 1467,
            minFilter: THREE.LinearFilter,
            tryPVR: true
        }
    }, 
    geometries: {
        treeGeo: {
            path: 'path/to/model.json',
            fileSize: 3876,
            toBufferGeometry: true
        }
    }, 
    objects: {
        tree: {
            geometry: 'treeGeo',
            material: new THREE.MeshBasicMaterial(),
            map: 'foliage',
            castShadow: true,
            transparent: true,
            onComplete: function ( object ) {
                object.scale.set( -1, 3, 1 );
            }
        }
    }
};

/* app.js */
//Create and append renderer.
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( devicePixelRatio );
renderer.setSize( width, height );
container.appendChild( renderer.domElement );

//Start app.
const ls = new LoadScreen( renderer );
ls.onComplete( init ).start( ASSETS );

function init () {
    
    ...//Scene initiation.

    ls.remove( animate );

}

function animate () {
    
    requestAnimationFrame( animate );

    ...//Render loop.

}
```

A default load screen automatically appears. Renders only start when ready.

![Default loader](https://github.com/Astrak/LoadScreen.js/blob/master/default_loader.gif)

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
- [ ] THREE.KTXLoader
```js
ASSETS.textures = {
    myTexture1: { 
        path: 'path/to/pic.jpg',
        fileSize: 2789,//in Ko
        //Other threejs textures properties can be specified.
        minFilter: THREE.LinearFilter,
        //Optionnaly GPU compression can be used, script will check device support.
        //Needs 'path/to/pic.pvr' or 'path/to/pic.ktx'.
        tryPVR: false,//Apple devices.
        PVRSize: null,//if tryPVR is set to true, file size has to be specified.
        tryKTX: false//Khronos spec.
        KTXSize: null
    }
};

//After loading :
ASSETS.textures.myTexture1;//THREE.Texture
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
    info: 'This is my object',//Unknown > assigned to mesh.userData.
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
