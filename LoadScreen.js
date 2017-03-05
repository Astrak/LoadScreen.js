/*
	author : @Astrak 
	license : MIT
	dependencies : threejs, loaders needed for your files, TweenLite
	usage : 
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
		.onProgress( function ( progress ) { console.log( progress ); } )
		.onComplete( function () { ls.remove(); animate(); } )
		.setOptions({ forcedStart: false, verbose: true, tweenDuration: 2 })
		.start( resources );
	todo : second progress bar at top of screen for assets loading after start
*/

function LoadScreen ( renderer, style ) {

	/*
		@renderer = a threejs webgl renderer

		@style (facultative) 
		you can write 'no' to avoid inserting anything in the DOM and create a custom loader that you update through
		the loadScreen.onProgress callback, that receives the progress value (from 0 to 1) as argument.
		otherwise @style is an object with this structure 
		{
			type: string,//'bar' or 'circle', defaults to 'bar'
			background: string,//'#ddd' as default, css color of background 
			progressContainer: string,//'#baa' as default, css color of progressContainer 
			progressBar: string,//'#756' as default, css color of progressBar 
			percentInfo: bol,//display progress in %
			sizeInfo: bol,//display progress ratio in MB
			textInfo: array//array of messages. Defaults to [ 'Loading', 'Creating scene' ]. If 'no' is specified, textInfo is not displayed.
		}
	*/

	var that = this;

	var infos = null;

	var verbose = false, forcedStart = false, tweenDuration = 1;

	//defs
	this.progress = 0;
	this.tween = { progress : 0 };
	this.forcedStart = false;
	this.domElement = null;
	this.infoContainer = null;
	this.removed = false;
	this.verbose = false;
	this.resources = null;

	//methods
	this.remove = null;

	//callbacks
	this.onProgress = onProgress;
	this.onComplete = onComplete;

	if ( style !== 'no' ) {

		this.remove = remove;
		this.resize = setOverlaySize;
		this.updateCBs = [];

		style = style || {};

		style = {
			type: style.type ? style.type : 'bar',
			size: style.size ? style.size : '100px',
			background: style.background ? style.background : '#ddd',
			progressContainer: style.progressContainer ? style.progressContainer : '#baa',
			progressBar: style.progressBar ? style.progressBar : '#756',
			percentInfo: style.hasOwnProperty( 'percentInfo' ) ? style.percentInfo : false,
			sizeInfo: style.hasOwnProperty( 'sizeInfo' ) ? style.sizeInfo : false,
			textInfo: style.hasOwnProperty( 'textInfo' ) ? style.textInfo : [ 'Loading', 'Processing' ]
		};

		setLoadScreen();

		setInfos();

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

		if ( resources ) that.resources = resources;

		if ( style !== 'no' ) that.domElement.appendChild( that.infoContainer );

	};

	this.setProgress = function ( p ) {

		that.progress = p;

		if ( style !== 'no' ) update();

		if ( p === 1 ) that.completeCb();

	};

	this.setOptions = function ( o ) {

		that.forcedStart = o.hasOwnProperty( 'forcedStart' ) ? o.forcedStart : forcedStart;
		that.verbose = o.hasOwnProperty( 'verbose' ) ? o.verbose : verbose;

		return that;

	};

	function setLoadScreen () {
		
		var overlay = document.createElement( 'div' ),
			infoContainer = document.createElement( 'div' );

		overlay.style.cssText = ''+
			'background: ' + style.background + ';' +
			'position: relative;'+
			'overflow: hidden;';

		infoContainer.style.cssText = ''+
			'width: ' + style.size + '; height: ' + style.size + ';'+
			'top: 50%; left: 50%;'+
			'margin: -50px 0 0 -50px;'+
			'position: relative;';

		setOverlaySize( renderer.domElement.width, renderer.domElement.height );

		renderer.domElement.parentNode.appendChild( overlay );
		overlay.appendChild( infoContainer );

		that.domElement = overlay;
		that.infoContainer = infoContainer;

	}

	function setInfos () {

		switch ( style.type ) {

			case 'bar': makeProgressBar(); break;
			case 'circle': makeProgressCircle(); break;
			default: makeProgressBar(); 

		}

	}

	function makeProgressBar () {

		var progressBarContainer = document.createElement( 'div' ),
			progressBar = document.createElement( 'div' );

		progressBarContainer.style.cssText = ''+
			'background: ' + style.progressBarContainer + ';'+
			'border: solid 1px ' + style.progressBarContainer + ';'+
			'width: ' + style.size + '; height: 6px;'+
			'top: 50%; left: 50%;'+
			'box-sizing: border-box;'+
			'margin-left: -50px;'+
			'position: relative;';

		progressBar.style.cssText = ''+
			'background: ' + style.progressBar + ';'+
			'width: 0%; height: 100%;'+
			'top: 0; left: 0;'+
			'position: absolute;';

		progressBarContainer.appendChild( progressBar );
		that.infoContainer.appendChild( progressBarContainer );

		that.updateCBs.push( function () { 

			TweenLite.to( tween, tweenDuration, { progress: that.progress, onUpdate: function () {
				progressBar.style.width = ( 100 * tween.progress ).toString() + '%';
			}});

		});

	}

	function makeProgressCircle () {

		//todo

	}

	function setOverlaySize ( width, height ) {

		if ( ! that.removed ) {

			that.domElement.style.marginTop = '-' + height + 'px';
			that.domElement.style.height = height + 'px';
			that.domElement.style.width = width + 'px';

		}

	}

	function update () {

		for ( var i = 0 ; i < that.updateCBs.length ; i++ ) 

			updateCBs[ i ]( that.progress );

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