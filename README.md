# LoadScreen.js
A JS library to handle ThreeJS assets loading and improve UX with a load screen and progress indicator.
```js
//create and insert renderer before

var ls = new LoadScreen( renderer ).onComplete( init, animate ).start( resources );

function init () {
    
    ...//regular scene initiation

    //remove the load screen when ready to animate
    ls.remove();

}
```

#Usage
##Full pattern
Values are default :
```js
var style = {
    type: 'bar',//main look. Also 'circle'. 'custom' empties the info container and lets you fill it
    size: '100px',//width and height of the central info container
    background: '#ddd',
    progressBarContainer: '#bbb',
    progressBar: '#666',
    percentInfo: false,
    sizeInfo: false,
    textInfo: [ 'Loading', 'Processing' ]//messages to display during loading. Can be set to false.      
};

var options = {
    forcedStart: false,//start loading even if the canvas is out of sight (usually bad practice)
    verbose: false,
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
.onComplete( init, animate );//fired after the progress bar gets tweened to 1

//then
ls.start( resources );

//or if you want to handle the progress yourself
//for any case not handled in the library
//(custom loader, display progress of a large script, or just for testing)
ls.start();
ls.setProgress( 0.5 );
//etc.
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
            computeNormals: true,//call geometry.computeVertexNormals()
            computeFlatNormals: true,//call geometry.computeFlatVertexNormals()
            toBufferGeometry: true//force creation of a BufferGeometry
            copyUv1toUv2: true,//for BufferGeometry only, for AO and lightmap use
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
            castShadow: true,//assigned to the mesh
            unknownOfThreejsParam : { 
                title: 'blabla', 
                content: 'blabla' 
            }//assigned to mesh.userData
        }
    }
};

//output
resources.textures.myTexture1;//THREE.Texture
resources.geometries.myGeometry1;//THREE.BufferGeometry
resources.objects.myObject1;//THREE.Mesh
```

#Roadmap
So much, I just began.
* code the 'forcedStart' related script
* handle all style parameters
* circle type
* check glTF resources organization for possible inspiration
* handle other loaders
* add fancy loaders
* remove TweenLite ? depends on loaders animations.
* handle custom message/warning/buttons before loading without setting style type to custom.. ?
* second progress bar at top of screen for assets loading after start
* extend to BabylonJS

#License
MIT

#Dependencies : 
* Threejs
* Threejs loaders needed for your files
* TweenLite
