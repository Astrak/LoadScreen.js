/*
	author : @Astrak 
*/

function LoadScreen ( renderer, style ) {

	var that = this;

	/* Internals */
	var	infos = null,
		verbose = false, 
		forcedStart = false, 
		progress = 0,
		removed = false,
		tweenDuration = 1,
		tween = { progress : 0 }, 
		updateCBs = [];

	var progressCb, completeCb;

	var gLoaders = {},
		tLoader;

	var ouput = {};

	/* API */
	//defs
	this.domElement = null;
	this.infoContainer = null;
	this.resources = null;

	//optional methods if style !== false
	this.remove = null;
	this.resize = null;

	this.remove = remove;
	this.resize = setOverlaySize;

	style = style || {};

	style = {
		type: typeof style.type !== 'undefined' ? style.type : 'bar',
		size: style.size ? style.size : '100px',
		background: style.background ? style.background : '#ddd',
		progressContainer: style.progressContainer ? style.progressContainer : '#bbb',
		progressBar: style.progressBar ? style.progressBar : '#666',
		percentInfo: typeof style.percentInfo !== 'undefined' ? style.percentInfo : false,
		sizeInfo: typeof style.sizeInfo !== 'undefined' ? style.sizeInfo : false,
		textInfo: typeof style.textInfo !== 'undefined' ? style.textInfo : [ 'Loading', 'Processing' ]
	};

	setLoadScreen();

	setInfos();

	this.start = function ( resources ) {

		if ( style !== false ) that.domElement.appendChild( that.infoContainer );

		if ( resources ) { 

			that.resources = resources;

			loadResources();

		}

	};

	this.remove = function () {

		that.domElement.parentNode.removeChild( that.domElement ); 

		removed = true;

	};

	this.setProgress = function ( p ) {

		progress = p;

		if ( style !== false ) update();

	};

	this.setOptions = function ( o ) {

		tweenDuration = typeof o.tweenDuration !== 'undefined' ? o.tweenDuration : tweenDuration;
		forcedStart = typeof o.forcedStart !== 'undefined' ? o.forcedStart : forcedStart;
		verbose = typeof o.verbose !== 'undefined' ? o.verbose : verbose;

		return that;

	};

	this.onProgress = function ( f ) {

		if ( f && typeof f === 'function' ) progressCb = f;

		return that;
		
	};

	this.onComplete = function ( cb ) {

		if ( f && typeof f === 'function' ) completeCb = f;

		return that;

	};

	function loadResources () {

		var counter = 0, tCounter = 0;
		var nFiles = 0;
		var r = that.resources;

		var textures = {}, geometries = {}, 
			texSum = 0, geoSum = 0;

		//1. Count files to load and their total size, create the 'output' mirror of resources
		if ( r.textures ) {

			nFiles += Object.keys( r.textures ).length;

			output.textures = {};

			for ( var k in r.textures ) {

				output.textures[ k ] = {};
				textures[ k ] = { prog: 0, size: r.textures[ k ].size };
				texSum += r.textures[ k ].size;

			}

		}

		if ( r.geometries ) {

			nFiles += Object.keys( r.geometries ).length;

			output.geometries = {};

			for ( var k in r.geometries ) {

				output.geometries[ k ] = {};
				geometries[ k ] = { prog: 0, size: r.geometries[ k ].size };
				geoSum += r.geometries[ k ].size;

			}

		}

		//2. Load files
		if ( r.geometries ) 
			
			for ( var k in r.geometries ) 

				loadGeometry( k );

		if ( r.textures ) 
			
			for ( var k in r.textures ) 

				loadTexture( k );

	}

	function loadGeometry ( p ) {

		var d = that.resources.geometries[ p ];

		//determine loader (todo, JSONLoader for now)
		if ( d.path.indexOf( '.json' ) > -1 ) {

			if ( ! gLoaders.json ) gLoaders.json = new THREE.JSONLoader();

			gLoaders.json.load( d.path, function ( g ) {

				g.name = p;

				output.geometries[ p ] = g;

				geometries[ p ].prog = 1;

			});

		}

	}

	function loadTexture ( p ) {

		var d = that.resources.textures[ p ];

		if ( ! tLoader ) tLoader = new THREE.TextureLoader();

		tLoader.load( d.path, function ( t ) {

			//assign properties
			for ( var k in d )

				if ( k !== 'size' && k !== 'path' && typeof t[ k ] !== 'undefined' ) 

					t[ k ] = d[ k ];

			t.name = p;

			output.textures[ p ] = t;

			textures[ p ].prog = 1;

			update();

		});

	}

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

		updateCBs.push( function () { 

			TweenLite.to( tween, tweenDuration, { progress: progress, onUpdate: function () {
				progressBar.style.width = ( 100 * tween.progress ).toString() + '%';
			}});

		});

	}

	function makeProgressCircle () {

		//todo

	}

	function setOverlaySize ( width, height ) {

		if ( ! removed ) {

			that.domElement.style.marginTop = '-' + height + 'px';
			that.domElement.style.height = height + 'px';
			that.domElement.style.width = width + 'px';

		}

	}

	function update () {

		for ( var i = 0 ; i < updateCBs.length ; i++ ) 

			updateCBs[ i ]( progress );

		progressCb( progress );

	}

	return this;

}