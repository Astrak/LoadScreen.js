function LoadScreen ( renderer, style ) {

	'use strict';

	var that = this;

	/* Internals */
	var	infos = null,
		verbose = false, 
		forcedStart = false, 
		progress = 0,
		removed = false,
		tweenDuration = .5,
		tween = { progress : 0 }, 
		updateCBs = [], 
		completeCBS = [];

	var loadComplete;

	var counter = 0, tCounter = 0, nFiles = 0;

	var gLoaders = {},
		tLoader;

	var ouput = {};

	var	textures = {}, geometries = {}, texSum = 0, geoSum = 0;

	/* API */
	this.domElement = null;
	this.infoContainer = null;
	this.resources = null;

	this.resize = resize;

	style = style || {};

	style = {
		type: typeof style.type !== 'undefined' ? style.type : 'bar',
		size: style.size ? style.size : '100px',
		background: style.background ? style.background : '#ddd',
		progressBarContainer: style.progressBarContainer ? style.progressBarContainer : '#bbb',
		progressBar: style.progressBar ? style.progressBar : '#666',
		percentInfo: typeof style.percentInfo !== 'undefined' ? style.percentInfo : false,
		sizeInfo: typeof style.sizeInfo !== 'undefined' ? style.sizeInfo : false,
		textInfo: typeof style.textInfo !== 'undefined' ? style.textInfo : [ 'Loading', 'Processing' ]
	};

	setLoadScreen();

	if ( style.type !== 'custom' ) setInfos();

	this.start = function ( resources ) {

		if ( style !== false ) that.domElement.appendChild( that.infoContainer );
		
		if ( resources ) { 

			that.resources = resources;

			loadResources();

		}

		return that;

	};

	this.remove = function () {

		that.domElement.parentNode.removeChild( that.domElement ); 

		removed = true;

	};

	this.setProgress = function ( p ) {

		progress = p;

		update();

	};

	this.setOptions = function ( o ) {

		tweenDuration = typeof o.tweenDuration !== 'undefined' ? o.tweenDuration : tweenDuration;
		forcedStart = typeof o.forcedStart !== 'undefined' ? o.forcedStart : forcedStart;
		verbose = typeof o.verbose !== 'undefined' ? o.verbose : verbose;

		return that;

	};

	this.onProgress = function () {

		for ( var i = 0 ; i < arguments.length ; i++ )

			if ( arguments[ i ] && typeof arguments[ i ] === 'function' ) 

				updateCBs.push( arguments[ i ] );

		return that;
		
	};

	this.onComplete = function () {

		for ( var i = 0 ; i < arguments.length ; i++ )

			if ( arguments[ i ] && typeof arguments[ i ] === 'function' ) 

				completeCBS.push( arguments[ i ] );

		return that;

	};

	function resize ( width, height ) {

		if ( ! removed ) {

			that.domElement.style.marginTop = '-' + height + 'px';
			that.domElement.style.height = height + 'px';
			that.domElement.style.width = width + 'px';

		}
		
	}

	function loadResources () {

		var r = that.resources;

		//1. Count files to load and their total size, create the 'output' mirror of resources
		if ( r.textures ) {

			nFiles += Object.keys( r.textures ).length;

			output.textures = {};

			for ( var k in r.textures ) {

				output.textures[ k ] = {};
				textures[ k ] = { prog: 0, fileSize: r.textures[ k ].fileSize };
				texSum += r.textures[ k ].fileSize;

			}

		}

		if ( r.geometries ) {

			nFiles += Object.keys( r.geometries ).length;

			output.geometries = {};

			for ( var k in r.geometries ) {

				output.geometries[ k ] = {};
				geometries[ k ] = { prog: 0, fileSize: r.geometries[ k ].fileSize };
				geoSum += r.geometries[ k ].fileSize;

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

			gLoaders.json.load( 
				d.path, 
				function ( g ) {

					g.name = p;

					output.geometries[ p ] = g;

					geometries[ p ].prog = 1;

					counter++;

					updateProgress({ geometry: true, name: p, progress: 1 });

					update( true );

				}, 
				function ( e ) {

					var pr = e.loaded / e.total;

					geometries[ p ].prog = pr;

					if ( pr !== 1 ) //otherwise onLoad will be called anyway

						updateProgress({ geometry: true, name: p, progress: pr });

					update();

				}
			);

		}

	}

	function loadTexture ( p ) {

		var d = that.resources.textures[ p ];

		if ( ! tLoader ) tLoader = new THREE.TextureLoader();

		tLoader.load( 
			d.path, 
			function ( t ) {

				//assign properties
				for ( var k in d )

					if ( k !== 'fileSize' && k !== 'path' && typeof t[ k ] !== 'undefined' ) 

						t[ k ] = d[ k ];

				t.name = p;

				output.textures[ p ] = t;

				textures[ p ].prog = 1;

				counter++;

				updateProgress({ texture: true, name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var pr = e.loaded / e.total;

				textures[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ texture: true, name: p, progress: pr });

				update();

			}
		);

	}

	function processResources () {

		//1. replace textures in resources
		var tA = that.resources.textures,
			oTA = output.textures;

		if ( tA ) {

			for ( var k in oTA ) {

				for ( var p in tA[ k ] ) 

					if ( p !== 'path' && p !== 'fileSize' ) 

						oTA[ k ][ p ] = tA[ k ][ p ];

				tA[ k ] = oTA[ k ];

				delete oTA[ k ];

			}

		}
	
		//2. process geometries and replace in resources
		var gA = that.resources.geometries, 
			oGA = output.geometries;

		if ( gA ) {

			for ( var k in oGA ) {

				if ( gA[ k ].toBufferGeometry && oGA[ k ].type !== 'BufferGeometry' )

					oGA[ k ] = new THREE.BufferGeometry().fromGeometry( oGA[ k ] );

				if ( gA[ k ].copyUv1ToUv2 && oGA[ k ].type === 'BufferGeometry' ) 

					oGA[ k ].addAttribute( 'uv2', oGA[ k ].attributes.uv );

				if ( gA[ k ].computeNormals ) oGA[ k ].computeVertexNormals();

				if ( gA[ k ].computeFlatNormals ) oGA[ k ].computeFlatVertexNormals();

				gA[ k ] = oGA[ k ];

				delete oGA[ k ];

			}

		}

		//3. create objects
		var oA = that.resources.objects;

		if ( oA ) {

			for ( var k in oA ) {

				var geometry = that.resources.geometries[ oA[ k ].geometry ], 
					material = oA[ k ].material;

				delete oA[ k ].geometry;
				delete oA[ k ].material;

				//1. assign properties to material
				for ( var p in oA[ k ] ) {

					if ( p !== 'type' && typeof material[ p ] !== 'undefined' ) {

						if ( p.indexOf( 'map' ) > -1 || p.indexOf( 'Map' ) > -1 ) {

							material[ p ] = tA[ oA[ k ][ p ] ];

							console.log(p, material[ p ])

						} else {

							material[ p ] = oA[ k ][ p ];

						}

						delete oA[ k ][ p ];

					}

				}

				//2. create object
				var object;

				switch ( oA[ k ].type ) {

					case 'mesh': object = new THREE.Mesh( geometry, material ); break;

					case 'points': object = new THREE.Points( geometry, material ); break;

					case 'line': object = new THREE.Line( geometry, material ); break;

					default: object = new THREE.Mesh( geometry, material );

				}

				delete oA[ k ].type;

				//3. assign remaining properties to object or its userData
				for ( var p in oA[ k ] ) {

					if ( typeof object[ p ] !== 'undefined' ) object[ p ] = oA[ k ][ p ];
					else object.userData[ p ] = oA[ k ][ p ];

					delete oA[ k ];

				}

				//4. assign object to resources
				oA[ k ] = object;

			}

		}

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

		that.domElement = overlay;
		that.infoContainer = infoContainer;

		that.resize( renderer.domElement.width, renderer.domElement.height );

		renderer.domElement.parentNode.appendChild( overlay );
		overlay.appendChild( infoContainer );

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

		var updateStyle = function () { progressBar.style.width = ( 100 * tween.progress ).toString() + '%'; };

		updateCBs.push( function () { 

			TweenLite.to( tween, tweenDuration, { progress: progress, onUpdate: updateStyle } );

		});

	}

	function makeProgressCircle () {

		//todo

	}

	function updateProgress ( o ) {

		//1. compute progress value
		var texProg = 0, geoProg = 0;

		for ( var k in textures ) 

			texProg += textures[ k ].prog * textures[ k ].fileSize;

		for ( var k in geometries ) 

			geoProg += geometries[ k ].prog * geometries[ k ].fileSize;

		progress = ( texProg + geoProg ) / ( texSum + geoSum );

		//2. Logs data
		if ( typeof o !== 'undefined' && verbose ) {

			var type = o.texture ? 'Texture' : o.geometry ? 'Geometry' : 'Unknown asset type';

			console.info( 'Progress = ' + progress + ', ' + type + ' > ' + o.name + ' > ' + Math.round( 100 * o.progress ) + '%' );

		}

		//3. call CBs and check completion
		update();

	}

	function update ( fromCompleteCb ) {

		for ( var i = 0 ; i < updateCBs.length ; i++ ) 

			updateCBs[ i ]( progress );

		if ( progress === 1 && fromCompleteCb ) {

			//todo: text message change

			var finish = function () { if ( that.resources ) processResources(); complete(); };

			if ( style.type !== 'custom' ) setTimeout( finish, tweenDuration * 1000 );
			
			else finish();

		}

	}

	function complete () {

		for ( var i = 0 ; i < completeCBS.length ; i++ ) 

			completeCBS[ i ]();

	}

	return this;

}