# LoadScreen.js
A JS library to improve UX with loadscreens when 3D assets are being loaded.

#Usage
##Pattern
    var style = {
        type: 'circle', 
        background: 'darkslategrey', 
        textInfo: [ 'Loading assets', 'Creating objects' ],
        percentInfo: false         
    };

    var options = {
        forcedStart: false,
        verbose: true, 
        tweenDuration: 2        
    };

    var ls = new LoadScreen( renderer, style );
    
    window.addEventListener( 'resize', function () { 
    	renderer.setSize( width, height ); 
    	ls.setSize( width, height ); 
    });
    
    ls
    .setOptions( options )
    .onProgress( function ( progress ) { console.log( progress ); } )
    .onComplete( function () { ls.remove(); animate(); } )
    .start( resources );

##Style
The load screen is composed of an overlay available at `ls.domElement` and a central box at `ls.infoContainer`. 
* `type` *(string)* : main look. Can be set to `'bar'`, `'circle'`, `'top-line'`, `'custom'`. Defaults to `'bar'`.
* `size` *(boolean)* : width and height of the central box container. Defaults to `'100px'`.
* `background` *(boolean)* : css color of the background div. Defaults to `'#ddd'`.
* `progressContainer` *(boolean)* : css color of the progressContainer element. Defaults to `'#bbb'`.
* `progressBar` *(boolean)* : css color of the progress bar/circle portion element. Defaults to `'#666'`.
* `percentInfo` *(boolean)* : to display the progression in percent. Defaults to `false`.
* `sizeInfo` *(boolean)* : to display the progression in MB. Defaults to `false`.
* `textInfo` *(array or boolean)* : Two messages to display during loading. If `false`, no textual information are displayed. Defaults to `[ 'Loading', 'Creating scene' ]`.

For a 100% custom loader, set `type` to `'custom'`, to get an empty `infoContainer`. Append your element to `ls.infoContainer` to put it in the middle, or simply to `ls.domElement` for a top line for example. Set `background` to `'none'` if you need. You can then update your loader with the `onProgress` callback.

##Options
* `forcedStart` *(boolean)* : defines whether the load should start if the canvas is out of sight. Setting it to `true` can lead to page freezes. Defaults to `false`. 
* `verbose` *(boolean)* : to log load information to the console. Defaults to `false`. 
* `tweenDuration` *(number)* : duration of progress bar tweening between progress events in seconds. Defaults to `1`. 

##Format your resources
    //input
    resources = {
        textures: {
            myTexture1: { 
                path: 'path/to/pic.jpg',
                size: 2789,//in Ko
                //other threejs textures properties can be specified, like :
                minFilter: THREE.LinearFilter
            }
        },
        geometries: {
            myGeometry1: {
                path: 'path/to/geometry.json',
                size: 9498,//in Ko
                //next three are optional and all default to false
                flatShading: true,//calls geometry.computeFlatVertexNormals()
                bufferGeometry: true//forces creation of a BufferGeometry
                uv1toUv2: true,//duplicates uv1 to uv2 for AO and/or light map(s) use.
            }
        },
        meshes: {
            myMesh1: {
                geometry: 'myGeometry1'
                material: new THREE.MeshStandardMaterial({//without maps
                    color: 0xff8899, 
                    side: THREE.DoubleSide 
                }),
                //next are optional
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
    resources.meshes.myMesh1;//THREE.Mesh

#Todo
* second progress bar at top of screen for assets loading after start
* circle type
* fancy loaders
* lots of things, just starting

#License
MIT

#Dependencies : 
* Threejs
* Threejs loaders needed for your files
* TweenLite
