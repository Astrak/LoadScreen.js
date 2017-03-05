/*
	author : @Astrak 
	licence : MIT
	dependencies : threejs, loaders needed for your files, TweenLite
	usage : 
		| var ls = new LoadScreen( renderer, { 
		| 	 look: 'circular', 
		| 	 background: 'darkslategrey', 
		| 	 textInfo: [ 'Loading assets', 'Creating objects' ], 
		| 	 percentInfo: true 
		| });
		| window.addEventListener( 'resize', function () { renderer.setSize( width, height ); ls.setSize( width, height ); } );
		| ls.onProgress( function ( progress ) { console.log( progress ); } )
		| .onComplete( function () { ls.remove(); animate(); } )
		| .setOptions({ forcedStart: false, verbose: false })
		| .start( resources );
*/

function LoadScreen ( renderer, style ) {

	/*
		@renderer = a threejs webgl renderer

		@style (facultative) 
		you can write 'no' to avoid inserting anything in the DOM and create a custom loader that you update through
		the loadScreen.onProgress callback, that receives the progress value (from 0 to 1) as argument.
		otherwise @style is an object with this structure 
		{
			look: string,//'linear' or 'circular', defaults to 'linear'
			background: string,//'#ddd' as default, css color of background 
			progressContainer: string,//'#baa' as default, css color of progressContainer 
			progressBar: string,//'#756' as default, css color of progressBar 
			percentInfo: bol,//display progress in %
			sizeInfo: bol,//display progress ratio in MB
			textInfo: array//array of messages. Defaults to [ 'Loading', 'Creating scene' ]. If 'no' is specified, textInfo is not displayed.
		}
	*/

	var that = this;

	var verbose = false,
		forcedStart =

	//pointers
	this.progress = 0;
	this.forcedStart = false;
	this.domElement = null;
	this.loaderContainer = null;
	this.removed = false;
	this.verbose = false;

	//methods
	this.remove = null;

	//callbacks
	this.onProgress = onProgress;
	this.onComplete = onComplete;
	this.setOptions = setOptions;

	if ( style !== 'no' ) {

		that.remove = remove;
		that.resize = setOverlaySize;

		style = style || {};

		that.style = {
			look : style.look ? style.look : 'linear',
			background : style.background ? style.background : '#ddd',
			progressContainer : style.progressContainer ? style.progressContainer : '#baa',
			progressBar : style.progressBar ? style.progressBar : '#756',
			percentInfo : style.hasOwnProperty( 'percentInfo' ) ? style.percentInfo : false,
			sizeInfo : style.hasOwnProperty( 'sizeInfo' ) ? style.sizeInfo : false,
			textInfo: style.text ? style.text : [ 'Loading', 'Processing' ]
		};

		setLoadScreen();

	}

	this.start = function ( resources ) {

		/*

		@resources (facultative) = {
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
					material: THREE.Material,//for instance, new THREE.MeshPhongMaterial({ color : 0xff8899, side : THREE.DoubleSide}). Caution : do not indicate textures in the material, they will be added by the script.
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

		*/

	};

	this.setProgress = function ( p ) {

		that.progress = p;

		if ( style !== 'no' ) {

			//update style, text, %

		}

		if ( p === 1 ) that.completeCb();

	};

	function setOptions ( o ) {

		that.forcedStart = o.hasOwnProperty( 'forcedStart' ) ? o.forcedStart : forcedStart;
		that.verbose = o.hasOwnProperty( 'verbose' ) ? o.verbose : verbose;

		return that;

	}

	function start ( resources ) {

		if ( resources ) that.resources = resources;

	}

	function setLoadScreen () {
		
		var overlay = document.createElement( 'div' );

		overlay.style.cssText = ''+
			'background: ' + that.style.background + ';' +
			'position: relative;'+
			'overflow: hidden;';

		setOverlaySize( renderer.domElement.width, renderer.domElement.height );

		renderer.domElement.parentNode.appendChild( overlay );

		that.domElement = overlay;

	}

	function setOverlaySize ( width, height ) {

		if ( ! that.removed ) {

			that.domElement.style.marginTop = '-' + height + 'px';
			that.domElement.style.height = height + 'px';
			that.domElement.style.width = width + 'px';

		}

	}

	function remove () { 

		that.domElement.parentNode.removeChild( that.domElement ); 

		that.removed = true;

	}

	function onProgress ( cb ) {

		if ( cb && typeof cb === 'function' ) that.progressCb = cb;

		return that;
		
	}

	function onComplete ( cb ) {

		if ( cb && typeof cb === 'function' ) that.completeCb = cb;

		return that;
		
	}

	return this;

}