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

'Loading' > 'Processing' > 'Compiling' > 'Creating scene' messages

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
Loaded first if any. Supported texture loaders :
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

//Also simply :
ASSETS.textures.myTexture2 = new THREE.Texture(...);//Won't be processed.
```

### Cubemap loaders
Loaded in second place if any. Supported cube texture loaders :
- [x] THREE.CubeTextureLoader
- [x] THREE.HDRCubeTextureLoader
```js
ASSETS.cubeTextures.myCubeTexture1 = {
    paths: [ 'face1.hdr', 'face2.hdr', 'face3.hdr', 'face4.hdr', 'face5.hdr', 'face6.hdr' ],
    filesSize: 5321,
    toPMREM: true//Output a PMREM for PBR IBL (also needs PMREM generation files).
};

//After loading :
ASSETS.cubeTextures.myCubeTexture1;//THREE.Texture
```

### Material loaders
Todo. 
Supported material loaders :
- [ ] THREE.MaterialLoader

### Animation loaders
Todo. 
Supported animation loaders :
- [ ] THREE.BVHLoader

### Geometries
Loaded in third place if any. Supported geometry loaders :
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

//Also simply :
ASSETS.geometries.myGeometry2 = new THREE.BoxGeometry( 3, 2, 1 );//Won't be processed.
```

### Objects
To load or to create from assets if any. Loaded in third place. Supported object loaders :
- [x] THREE.ThreeMFLoader
- [x] THREE.AMFLoader
- [x] THREE.AssimpLoader
- [x] THREE.AssimpJSONLoader
- [x] THREE.AWDLoader
- [x] THREE.BabylonLoader
- [x] THREE.ColladaLoader
- [x] THREE.ColladaLoader (2)
- [ ] THREE.CTMLoader (`loadParts` method for multiple geometries)
- [ ] THREE.FBXLoader
- [x] THREE.FBXLoader (2)
- [ ] THREE.GLTFLoader
- [ ] THREE.GLTFLoader (2)
- [x] THREE.MMDLoader (needs the additional parameter `VMDPaths` )
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
    myObject4: {//The object may have a hierarchy :
        path: 'path/to/object.utf8',
        fileSize: 1111,
        onComplete: object => {
            object.traverse( child => { child.material.map = ASSETS.textures.myTexture1; } );
        }
    },
    myObject5: {//The object may have a hierarchy and an animation :
        path: 'path/to/object.dae',
        fileSize: 1615,
        convertUpAxis: true,//Collada loader option.
        onComplete: collada => {
            collada.scene.traverse( child => {
                if ( child instanceof THREE.SkinnedMesh ) {
                    const animation = new THREE.Animation( child, child.geometry.animation );
                    animation.play();
                }
            });
        }
    }
};

//other parameters
ASSETS.objects.myObject6 = {
    geometry: 'myGeometry1',
    material: new THREE.MeshPhongMaterial(),
    type: 'mesh',//Or 'points' or 'line', defaults to 'mesh'.
    //Specify any mesh or material property 
    //(if the object is a loaded hierarchy, they will be assigned to the root mesh).
    map: 'myTexture1',//Asset assigned to material.
    color: 0x33ff89,//Assigned to material.
    castShadow: true,//Assigned to mesh.
    info: 'This is my object',//Unknown key 'info' in mesh and material > assigned to mesh.userData.
};

//After loading : 
ASSETS.objects.myObject6;//THREE.Mesh

//Also simply :
ASSETS.objects.myObject7 = new THREE.Object3D(...);//Won't be processed.
```

# Roadmap
* complete loader loaders
* code the 'forcedStart' parameter
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
