# LoadScreen.js
A JS library to simplify ThreeJS assets coding, manage their creation process and provide different load screens.

```js
//create and insert renderer before

var ls = new LoadScreen( renderer ).onComplete( init ).start( assets );

function init () {
    
    ...//scene initiation

    ls.remove( animate );

}
```

This creates the following default :

![Default loader](https://github.com/Astrak/LoadScreen.js/blob/master/default_loader.gif)

# Usage
## Full pattern
Methods are chainable, except `remove` and `setProgress`. Values are default.
```js
var style = {
    type: 'bar',//main look. Also 'circular'. 'custom' empties the info container
    size: '150px',//width of the central info container, in px or in %
    background: '#333',
    progressBarContainer: '#444',
    progressBar: '#fb0',
    weight: '6px',//weight of the progress element, in px ('bar' type) or svg units ('circular')
    infoColor: '#666',//text color
    sizeInfo: true,
    textInfo: [ 'Loading', 'Processing', 'Compiling' ]//Can also be set to a single string or to false
};

var options = {
    forcedStart: false,//start loading even if the canvas is out of sight (usually bad practice)
    verbose: false,//logs progress, process and compile duration + total load screen duration
    tweenDuration: .5//progress and removal tweens durations
};

var ls = new LoadScreen( renderer, style );//style is optional

//Resize is available. Can be a bit overkill on smartphones for loads < 5-6 seconds.
window.addEventListener( 'resize', function () { 
    renderer.setSize( width, height ); 
    ls.setSize( width, height ); 
});

ls.setOptions( options )

.onProgress( function ( progress ) { ... } )//can be used to update a custom UI

.onComplete( init )//after processing and compiling

.start( assets );//load > process > compile assets

//or
.start();//just add the info UI

//then for big script progress or just testing
ls.setProgress( 0.5 );

//finally at the end of the onComplete callback
ls.remove( animate );//Removal is tweened so next action is a callback
```

## Assets declaration
```js
assets = {};
```

### Textures
Specify texture files if any. They will be loaded first. Supported texture loaders :
- [x] THREE.TextureLoader
- [x] THREE.PVRLoader
- [ ] THREE.KTXLoader
```js
assets.textures = {
    myTexture1: { 
        path: 'path/to/pic.jpg',
        fileSize: 2789,//in Ko
        //other threejs textures properties can be specified
        minFilter: THREE.LinearFilter,
        //optionnaly GPU compression can be used if 'pic.pvr' or 'pic.ktx' exist
        //format support will be checked internally
        tryPVR: false,//Apple devices
        tryKTX: false//Khronos spec.
    }
};

//after loading :
assets.textures.myTexture1;//THREE.Texture
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
assets.geometries = {
    myGeometry1: {
        path: 'path/to/geometry.ply',
        fileSize: 9498,//Ko
        //next two are optional
        toBufferGeometry: false,//force creation of a BufferGeometry
        onComplete: function ( geometry ) {
            //geometry.computeFlatVertexNormals / translate / center / merge / addAttribute...
        }
    }
};

//after loading :
assets.geometries.myGeometry1;//THREE.Geometry

//also simply
assets.geometries.myGeometry2 = new THREE.BoxGeometry( 3, 2, 1 );//won't be processed
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
assets.objects = {
    myObject1: {//1. load from file
        path: 'path/to/object.wrl',
        fileSize: 3846//Ko
    },
    myObject2: {//2. or create from asset
        geometry: 'myGeometry1',//use geometry asset 'myGeometry1'
        material: new THREE.MeshPhongMaterial()
    },
    myObject3: {//3. or create from scratch
        geometry: new THREE.PlaneBufferGeometry( 5, 3, 9 ),
        material: new THREE.MeshBasicMaterial()
    }
    myObject4: new THREE.Mesh(...);//won't be processed
};

//other parameters
assets.objects.myObject5 = {
    path: 'path/to/object.amf',
    type: 'mesh',//or 'points' or 'line', defaults to 'mesh'
    //specify any mesh or material property
    color: 0x33ff89,//assigned to material
    map: 'myTexture1',//asset assigned to material
    castShadow: true,//assigned to mesh
    info: 'This is my object',//unknown > assigned to mesh.userData
    //for any further change
    onComplete: function ( object ) {
        //object.geometry.computeBoundingBox or anything
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
