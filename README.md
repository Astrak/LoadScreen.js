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
Threejs only for now :
    resources (facultative) = {
        textures: {
            myTexture1 : { 
                path: string,
                size: number,//in Ko
                //other threejs textures properties can be added, like 
                //minFilter: THREE.LinearFilter
            }
        },
        geometries: {
            myGeometry1 : {
                path: string,
                size: number,//in Ko
                //next are facultative :
                flatShading: bol,//defaults to false. If true, geometry.computeFlatVertexNormals() will be called.
                bufferGeometry: bol//defaults to false. If true, and if the loader's output is not a BufferGeometry, BufferGeometry.fromGeometry( output ) will be called.
                //other threejs geometries properties can be added
            }
        },
        meshes: {
            myMesh1: {
                geometry: string,//'myGeometry1' for instance
                material: THREE.Material,//for instance, new THREE.MeshPhongMaterial({ color : 0xff8899, side : THREE.DoubleSide }). Do not indicate textures in the material, they will be added by the script.
                //next are facultative :
                //other threejs meshes properties and materials can be added here
                //if properties are not related to the material or mesh, they are added to mesh.userData.
                //exemple :
                map: myTexture1,//assigned to the material once loaded
                castShadow: true,//assigned to the mesh
                unknownOfThreejsParam : { title: 'blabla', content: 'blabla' }//assigned to mesh.userData
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
