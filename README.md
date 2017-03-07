# LoadScreen.js
A JS library to handle ThreeJS assets loading and improve UX with a load screen and progress indicator.
```js
//create and insert renderer before

var ls = new LoadScreen( renderer ).onComplete( init ).start( resources );

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
    type: 'bar',
    size: '100px',
    background: '#ddd', 
    progressBarContainer: '#bbb',
    progressBar: '#666',
    percentInfo: false,
    sizeInfo: false,
    textInfo: [ 'Loading', 'Processing' ]       
};

var options = {
    forcedStart: false,
    verbose: false, 
    tweenDuration: 1        
};

var ls = new LoadScreen( renderer, style );

//can be a bit overkill on smartphones but available
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

##Style parameters
The load screen is composed of an overlay available at `ls.domElement` and a central box at `ls.infoContainer`. 
* `type` *(string)* : main look. Can be set to `'bar'`, `'circle'`, `'top-line'`, `'custom'`. Defaults to `'bar'`.
* `size` *(boolean)* : width and height of the central box container. Defaults to `'100px'`.
* `background` *(boolean)* : css color of the background div. Defaults to `'#ddd'`.
* `progressBarContainer` *(boolean)* : css color of the progressBarContainer element. Defaults to `'#bbb'`.
* `progressBar` *(boolean)* : css color of the progress bar/circle/line portion element. Defaults to `'#666'`.
* `percentInfo` *(boolean)* : to display the progression in percent. Defaults to `false`.
* `sizeInfo` *(boolean)* : to display the progression in MB. Defaults to `false`.
* `textInfo` *(array or boolean)* : Two messages to display during loading. If `false`, no textual information are displayed. Defaults to `[ 'Loading', 'Creating scene' ]`.

For a 100% custom loader, `type` can be set to `'custom'`, to get an empty `infoContainer` where anything else can be appended, or simply to `ls.domElement` for a top line for example. `background` can also be set to `'none'`. The `onProgress` callback can be used to update what needs to be.

##Options parameters
* `forcedStart` *(boolean)* : defines whether the load should start if the canvas is out of sight. Because of potential page scroll freezes, setting it to `true` can disturb the user who doesn't know that big assets are being loaded elsewhere on the page. Defaults to `false`. 
* `tweenDuration` *(number)* : duration of progress bar tweening between progress events in seconds. Defaults to `1`. 
* `verbose` *(boolean)* : to log load information to the console. Defaults to `false`. 

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
* get it fully working with the JSONLoader first and every options
* circle type
* check glTF resources organization
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
