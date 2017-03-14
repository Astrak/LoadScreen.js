# LoadScreen.js
A JS library to handle ThreeJS assets loading.
Changes the callback hell to a declarative style, and improves UX with a load screen and progress indicator.

```js
//create and insert renderer before

var ls = new LoadScreen( renderer ).onComplete( init ).start( assets );

function init () {
    
    ...//regular scene initiation

    ls.remove( animate );

}
```

This creates the following default :

![Default loader](https://github.com/Astrak/LoadScreen.js/blob/master/default_loader.gif)

# Usage

##Full pattern
Methods are chainable, except `remove` and `setProgress`. Values are default.
```js
//Load screen creation
//style optional argument, values are default.
var style = {
    type: 'bar',//main look. Also 'circular'. 'custom' empties the info container and lets you fill it
    size: '150px',//width of the central info container, in px or in %
    background: '#333',
    progressBarContainer: '#444',
    progressBar: '#fb0',
    weight: '6px',//weight of the progress element, in px ('bar' type) or svg units ('circular')
    infoColor: '#666',
    sizeInfo: true,
    textInfo: [ 'Loading', 'Processing', 'Compiling' ]//Can also be set to a single string or to false
};
var ls = new LoadScreen( renderer, style );

//Resize is available. Can be a bit overkill on smartphones for loads < 5-6 seconds.
window.addEventListener( 'resize', function () { 
	renderer.setSize( width, height ); 
	ls.setSize( width, height ); 
});

//Options can be passed.
var options = {
    forcedStart: false,//start loading even if the canvas is out of sight (usually bad practice)
    verbose: false,//logs progress, process and compile duration + total load screen duration
    tweenDuration: .5//progress and remove tweens durations
};
ls.setOptions( options );

//Do things on progress events.
ls.onProgress( function ( progress ) { ... } );

//Define callbacks to fire after loading, processing and compiling.
ls.onComplete( init );

//Ready ! Usually needs a assets object (see next for formatting). Appends infos to overlay.
ls.start( assets );

//or if you want to handle the progress yourself, for any case not handled in the library
//(custom loader, display progress of a large script, or just for testing).
ls.start();
ls.setProgress( 0.5 );//etc.

//Remove the load screen ! Removal is tweened so we define a callback
ls.remove( animate );
```

##Assets declaration

```js
//input
assets = {};
```

###Textures
Specify texture files if any. They will be loaded first and be accessible at their place, like `assets.textures.myTexture1`.
```js
assets.textures = {
    myTexture1: { 
        path: 'path/to/pic.jpg',
        fileSize: 2789,//in Ko
        //other threejs textures properties can be specified
        minFilter: THREE.LinearFilter,
        //optionnaly GPU compression can be used if 'pic.pvr' or 'pic.ktx' exist
        //format support will be checked internally
        tryPVR: false,//Apple
        tryKTX: false//Khronos spec.
    }
};
```

###Geometries
Specify geometry files for geometry loaders. They will be loaded second and be accessible at their place, like `assets.textures.myGeometry1`. You can also specify a geometry directly.
```js
assets.geometries = {
    myGeometry1: {
        path: 'path/to/geometry.ply',
        fileSize: 9498,
        //next two are optional
        toBufferGeometry: false,//force creation of a BufferGeometry
        onComplete: function ( geometry ) {
            //geometry.computeFlatVertexNormals / translate / center / merge / addAttribute...
        }
    }
};
```

###Objects
Specify meshes to create if any. Two possibilities.
```js
assets.objects = {};
```

* Object from file
Load files with object loaders, as for geometries and textures
```js
assets.objects.myObject1 = {
    path: 'path/to/object.wrl',
    fileSize: 3846
};
```

* Object from assets
Or build it from an existing geometry
```js
assets.objects.myObject2 = {
    geometry: 'myGeometry1',//asset will be used. You can also just pass a geometry instance.
    material: new THREE.MeshPhongMaterial()
};
```

* Options
You can specify a rendering mode :
```js
type: 'mesh',//or 'points' or 'line', defaults to 'mesh'
```

You can also add any other material or mesh parameter (they will be assigned automatically)
```js
aoMap: 'myTexture1',//material.aoMap = asset 'myTexture1'
castShadow: false,//mesh.castShadow = false
unknownParam : { 
    title: 'blabla', 
    content: 'blabla' 
}//assigned to mesh.userData.unknownParam
```

###Scene
todo

##Support
Todo : gltf

###Texture loaders
- [x] THREE.TextureLoader
- [x] THREE.PVRLoader
- [x] THREE.KTXLoader

###Material loaders
- [ ] THREE.MaterialLoader

###Geometry loaders
- [x] THREE.JSONLoader (threejs blender exporter)
- [x] THREE.PLYLoader
- [x] THREE.CTMLoader (`load` method)
- [x] THREE.VTKLoader
- [x] THREE.STLLoader
- [ ] THREE.BufferGeometryLoader

###Object loaders
Animations not handled for now.
- [x] THREE.ThreeMFLoader
- [x] THREE.AMFLoader
- [x] THREE.AssimpLoader
- [x] THREE.AssimpJSONLoader
- [ ] THREE.MMDLoader
- [ ] THREE.CTMLoader (`loadParts` method for multiple geometries)
- [x] THREE.PlayCanvasLoader
- [x] THREE.VRMLLoader
- [x] THREE.UTF8Loader
- [x] THREE.ObjectLoader

###Scene loaders
- [ ] THREE.AWDLoader
- [ ] THREE.OBJLoader
- [ ] THREE.FBXLoader
- [ ] THREE.ColladaLoader
- [ ] THREE.ColladaLoader (2)
- [ ] THREE.BabylonLoader

###Cubemap loaders
- [ ] THREE.CubeTextureLoader
- [ ] THREE.HDRCubeTextureLoader

###Animation loaders
- [ ] THREE.BVHLoader

#Roadmap
* Support more formats
* Support cubemaps and pmrem
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

#License
MIT

#Dependencies : 
* Threejs
* Threejs loaders needed for your files
