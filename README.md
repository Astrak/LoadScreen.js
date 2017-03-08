# LoadScreen.js
A JS library to handle ThreeJS assets loading and improve UX with a load screen and progress indicator.
```js
//create and insert renderer before

var ls = new LoadScreen( renderer ).onComplete( init ).start( resources );

function init () {
    
    ...//regular scene initiation

    //render the scene once to compile everything on the GPU (important for mobile)
    renderer.render( scene, camera );

    //then remove the load screen
    ls.remove( animate );

}
```

#Usage
##Full pattern
Values are default :
```js
var style = {
    type: 'bar',//main look. Also 'circle'. 'custom' empties the info container and lets you fill it
    size: '100px',//width of the central info container, in px or in %
    background: '#ddd',
    progressBarContainer: '#bbb',
    progressBar: '#666',
    infoColor: '#666',
    percentInfo: true,
    sizeInfo: true,
    textInfo: [ 'Loading', 'Processing', 'Compiling' ]//Can be set to a single string or to false
};

var options = {
    forcedStart: false,//start loading even if the canvas is out of sight (usually bad practice)
    verbose: false,//logs progress, process and compile duration + total load screen duration
    tweenDuration: .5
};

var ls = new LoadScreen( renderer, style );

//can be a bit overkill on smartphones, but available
window.addEventListener( 'resize', function () { 
	renderer.setSize( width, height ); 
	ls.setSize( width, height ); 
});

ls
.setOptions( options )
.onProgress( function ( progress ) { console.log( progress ); } )
.compile( function () { renderer.render( scene, camera ); } )//GPU compilation callback in threejs
.onComplete( init );//fired after the progress bar gets tweened to 1 and after processing and compiling

//then
ls.start( resources );

//or if you want to handle the progress yourself
//for any case not handled in the library
//(custom loader, display progress of a large script, or just for testing)
ls.start();
ls.setProgress( 0.5 );
//etc.

//finally
ls.remove( animate );//the removal is tweened for better UX, animate will be fired on completion.
```

##Format your resources
```js
//input
resources = {
    textures: {
        myTexture1: { 
            path: 'path/to/pic.jpg',
            fileSize: 2789,//in Ko
            //other threejs textures properties can be specified, like :
            minFilter: THREE.LinearFilter
        }
    },
    geometries: {
        myGeometry1: {
            path: 'path/to/geometry.json',
            fileSize: 9498,//in Ko
            //next four are optional
            computeNormals: false,//call geometry.computeVertexNormals()
            computeFlatNormals: false,//call geometry.computeFlatVertexNormals() (THREE.Geometry only)
            toBufferGeometry: false//force creation of a BufferGeometry
            copyUv1toUv2: false,//for AO and lightmap use (handled for THREE.BufferGeometry only)
        }
    },
    objects: {
        myObject1: {
            geometry: 'myGeometry1',
            material: new THREE.MeshStandardMaterial({//without maps
                color: 0xff8899, 
                side: THREE.DoubleSide 
            }),
            //next is optional
            type: 'mesh',//or 'points' or 'line', defaults to 'mesh'
            //specify any other threejs meshes or materials properties 
            aoMap: 'myTexture1',//assigned to material
            castShadow: false,//assigned to the mesh
            unknownOfThreejsParam : { 
                title: 'blabla', 
                content: 'blabla' 
            }//assigned to mesh.userData
        }
    }
};

//output
resources.textures.myTexture1;//THREE.Texture
resources.geometries.myGeometry1;//THREE.Geometry (some loaders can output a THREE.BufferGeometry)
resources.objects.myObject1;//THREE.Mesh
```

#Roadmap
So much, I just began.
* code the 'forcedStart' parameter
* handle all style parameters
* circle type
* check glTF resources organization for possible inspiration
* handle other loaders
* add fancy loaders
* remove TweenLite ? depends on loaders animations.
* handle custom message/warning/buttons before loading without setting style type to custom.. ?
* second progress bar at top of screen for assets loading after start
* add setStyle method for another style if further calls
* webgl loader instead of html ?
* extend to BabylonJS

#License
MIT

#Dependencies : 
* Threejs
* Threejs loaders needed for your files
* TweenLite
