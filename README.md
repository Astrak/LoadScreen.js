# LoadScreen.js
A JS library to improve UX with loadscreens when 3D assets are being loaded.

#Usage
##Pattern
    var ls = new LoadScreen( renderer, { 
    	type: 'circle', 
    	background: 'darkslategrey', 
    	textInfo: [ 'Loading assets', 'Creating objects' ],
    	percentInfo: false 
    });
    
    window.addEventListener( 'resize', function () { 
    	renderer.setSize( width, height ); 
    	ls.setSize( width, height ); 
    });
    
    ls
    .setOptions({ 
        forcedStart: false, 
        verbose: true, 
        tweenDuration: 2 
    })
    .onProgress( function ( progress ) { console.log( progress ); } )
    .onComplete( function () { ls.remove(); animate(); } )
    .start( resources );
##Format your resources
(Threejs only for now)
    resources = {
        textures: {
            myTexture1 : { 
                path: 'path/to/pic.jpg',
                size: 2789,//in Ko
                //other threejs textures properties can be specified, like :
                minFilter: THREE.LinearFilter
            }
        },
        geometries: {
            myGeometry1 : {
                path: 'path/to/geometry.json',
                size: 9498,//in Ko
                //next are both optional
                flatShading: bol,//defaults to false. 
                //If true, geometry.computeFlatVertexNormals() will be called.
                bufferGeometry: bol//defaults to false. 
                //If true, and if the loader's output is not a BufferGeometry, 
                //new BufferGeometry().fromGeometry( output ) will be called.
                //other threejs geometries properties can be added, like : 
            }
        },
        meshes: {
            myMesh1: {
                geometry: 'myGeometry1'
                material: new THREE.MeshPhongMaterial({//without maps
                    color : 0xff8899, 
                    side : THREE.DoubleSide 
                }),
                //next are optional
                //specify any other threejs meshes or materials properties 
                map: 'myTexture1',//assigned to material
                castShadow: true,//assigned to the mesh
                unknownOfThreejsParam : { 
                    title: 'blabla', 
                    content: 'blabla' 
                }//assigned to mesh.userData
            }
        }
    }

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
