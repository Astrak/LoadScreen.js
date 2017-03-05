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
