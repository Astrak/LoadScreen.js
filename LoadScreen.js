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
		completeCBs = [];

	var loadComplete;

	var counter = 0, tCounter = 0, nFiles = 0;

	var textInfo, sizeInfo;

	var gLoaders = {},
		tLoader;

	var ouput = {};

	var	textures = {}, geometries = {}, texSum = 0, geoSum = 0;

	/* API */
	this.domElement = null;
	this.infoContainer = null;
	this.resources = null;

	this.setSize = setSize;

	style = style || {};

	style = {
		type: typeof style.type !== 'undefined' ? style.type : 'bar',
		size: style.size ? style.size : '30%',
		background: style.background ? style.background : '#333',
		progressBarContainer: style.progressBarContainer ? style.progressBarContainer : '#444',
		progressBar: style.progressBar ? style.progressBar : '#fb0',
		weight: style.weight ? style.weight : '6px',
		infoColor: style.infoColor ? style.infoColor : '#666',
		sizeInfo: typeof style.sizeInfo !== 'undefined' ? style.sizeInfo : true,
		textInfo: typeof style.textInfo !== 'undefined' ? style.textInfo : [ 'Loading', 'Processing', 'Compiling' ]
	};

	setLoadScreen();

	if ( style.type !== 'custom' ) setInfos();

	this.start = function ( resources ) {

		if ( style !== false ) {

			that.domElement.appendChild( that.infoContainer );

			var marginTop = - parseInt( getComputedStyle( that.infoContainer, null ).height ) / 2;

			that.infoContainer.style.marginTop = marginTop + 'px';

			if ( style.type === 'circular' ) {

				var mTop = - parseInt( getComputedStyle( that.infoContainer.lastElementChild, null ).height ) / 2;

				that.infoContainer.lastElementChild.style.marginTop = marginTop + 'px';

			}

		}

		if ( verbose ) console.time( 'Total load screen duration' );
		
		if ( resources ) { 

			if ( verbose ) console.time( 'Loading duration' );

			that.resources = resources;

			loadResources();

		}

		return that;

	};

	this.remove = function ( cb ) {

		if ( style.type !== 'custom' ) {

			var disappear = { opacity: 1, };

			TweenLite.to( 
				disappear, 
				tweenDuration, 
				{ 
					opacity: 0,
					onUpdate: function () { that.infoContainer.style.opacity = disappear.opacity; }, 
					onComplete: function () { end( cb ); }
				}
			);

		} else {

			end();

		}

	};

	this.setProgress = function ( p ) {

		progress = p;

		update( true );

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

				completeCBs.push( arguments[ i ] );

		return that;

	};

	function end ( cb ) {

		if ( verbose ) console.timeEnd( 'Total load screen duration' );

		that.domElement.parentNode.removeChild( that.domElement ); 

		removed = true;

		if ( cb && typeof cb === 'function' ) cb();

	}

	function setSize ( width, height ) {

		if ( ! removed ) {

			that.domElement.style.marginTop = '-' + height / devicePixelRatio + 'px';
			that.domElement.style.height = height / devicePixelRatio + 'px';
			that.domElement.style.width = width / devicePixelRatio + 'px';

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

		if ( verbose ) console.time( 'Processing duration' );

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

		if ( verbose ) console.timeEnd( 'Processing duration' );

	}

	function setLoadScreen () {
		
		var overlay = document.createElement( 'div' ),
			infoContainer = document.createElement( 'div' );

		overlay.style.cssText = ''+
			'background: ' + style.background + ';' +
			'position: relative;'+
			'overflow: hidden;';

		var unit = style.size.indexOf( '%' ) > - 1 ? '%' : 'px', 
			half = parseInt( style.size ) / 2 + unit;

		infoContainer.style.cssText = ''+
			'width: ' + style.size + ';'+
			'top: 50%; left: 50%;'+
			'margin-left: -' + half + ';'+
			'text-align: center;'+
			'position: relative;'+
			'display: inline-block';

		that.domElement = overlay;
		that.infoContainer = infoContainer;

		that.setSize( renderer.domElement.width, renderer.domElement.height );

		renderer.domElement.parentNode.appendChild( overlay );

	}

	function setInfos () {

		if ( style.textInfo ) {

			textInfo = document.createElement( 'p' );
			textInfo.textContent = typeof style.textInfo === 'string' ? style.textInfo : style.textInfo[ 0 ];
			textInfo.style.cssText = ''+ 
				'color: ' + style.infoColor + ';'+
				'display: inline-block;'+
				'font-family: monospace;'+
				'font-size: 12px';


		}

		if ( style.sizeInfo ) {

			sizeInfo = document.createElement( 'p' );
			sizeInfo.textContent = '0.00MB';
			sizeInfo.style.cssText = ''+ 
				'color: ' + style.infoColor + ';'+
				'font-family: monospace;'+
				'font-size: 12px;'+
				'display: inline-block;';


		}

		switch ( style.type ) {

			case 'bar': makeBarProgress(); break;
			case 'circular': makeCircularProgress(); break;
			default: makeBarProgress(); 

		}

	}

	function makeBarProgress () {

		var progressBarContainer = document.createElement( 'div' ),
			progressBar = document.createElement( 'div' );

		progressBarContainer.style.cssText = ''+
			'background: ' + style.progressBarContainer + ';'+
			'border: solid 1px ' + style.progressBarContainer + ';'+
			'width: 100%; height: ' + style.weight + ';'+
			'box-sizing: border-box;'+
			'position: relative;';

		progressBar.style.cssText = ''+
			'background: ' + style.progressBar + ';'+
			'width: 0%; height: 100%;'+
			'top: 0; left: 0;'+
			'position: absolute;';

		progressBarContainer.appendChild( progressBar );

		if ( style.textInfo ) that.infoContainer.appendChild( textInfo );

		that.infoContainer.appendChild( progressBarContainer );

		if ( style.sizeInfo ) that.infoContainer.appendChild( sizeInfo );

		var updateStyle = function () { 

			progressBar.style.width = ( 100 * tween.progress ).toString() + '%'; 

			if ( style.sizeInfo ) sizeInfo.textContent = ( tween.progress * ( texSum + geoSum ) / 1024 ).toFixed( 2 ) + ' MB';

		};

		updateCBs.push( function () { 

			TweenLite.to( tween, tweenDuration, { progress: progress, onUpdate: updateStyle } );

		});

	}

	function makeCircularProgress () {

		var svg = ""+
			"<svg style='width:" + style.width + ";' width=200 height=200 viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>"+
			"	<circle fill=" + style.progressBarContainer + " cx='0' cy='0' transform='translate(100,100)'  r='" + ( 80 + parseInt( style.weight ) / 2 + 2 ).toString()+ "'/>"+
			"	<circle fill=" + style.background + " cx='0' cy='0' transform='translate(100,100)'  r='" + ( 80 - parseInt( style.weight ) / 2 - 2 ).toString()+ "'/>"+
			"	<circle fill='none' cx='0' cy='0' transform='translate(100,100) rotate(90)' r='80' stroke-dashoffset='953'/>"+
			"</svg>";

		that.infoContainer.innerHTML = svg;

		var circleProgress = that.infoContainer.firstElementChild.lastElementChild;

		circleProgress.style.cssText = ''+
			'stroke:' + style.progressBar + ';'+
			'stroke-width:' + parseInt( style.weight )+ ';'+
			'stroke-dasharray:502;';

		if ( style.textInfo || style.sizeInfo ) {

			var textContainer = document.createElement( 'div' );

			textContainer.style.cssText = ''+
				'width: 100%; left: 50%;'+
				'margin-left: -50%;'+
				'position: absolute;';

			that.infoContainer.appendChild( textContainer );

			if ( style.textInfo ) textContainer.appendChild( textInfo );

			if ( style.sizeInfo ) textContainer.appendChild( sizeInfo );

			textInfo.style.display = sizeInfo.style.display = 'block';
			
		}

		var updateStyle = function () { 

			circleProgress.setAttribute( 'stroke-dashoffset', ( ( tween.progress + 1 ) * 502 ).toString() );

			if ( style.sizeInfo ) sizeInfo.textContent = ( tween.progress * ( texSum + geoSum ) / 1024 ).toFixed( 2 ) + ' MB';

		};

		updateCBs.push( function () { 

			TweenLite.to( tween, tweenDuration, { progress: progress, onUpdate: updateStyle } );

		});

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

			if ( verbose ) console.timeEnd( 'Loading duration' );

			var finish = function () { 

				if ( that.resources ) {

					if ( style.textInfo ) {

						textInfo.textContent = typeof style.textInfo === 'string' ? style.textInfo : style.textInfo[ 1 ];

						setTimeout( function () { 

							processResources(); 

							textInfo.textContent = typeof style.textInfo === 'string' ? style.textInfo : style.textInfo[ 2 ];

							setTimeout( compile, 20 );

						}, 20 );

					} else {

						processResources(); 

						compile(); 

					}

				} else {

					complete();

				}

			};

			if ( style.type !== 'custom' ) setTimeout( finish, tweenDuration * 1000 );
			
			else finish();

		}

	}

	function compile () {

		var LSScene = new THREE.Scene(), 
			LSCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 2 ),
			LSRT = new THREE.WebGLRenderTarget( 10, 10, { generateMipmaps: true } );

		for ( var k in that.resources.objects )

			LSScene.add( that.resources.objects[ k ] );

		if ( verbose ) console.time( 'Compiling duration' );

		renderer.render( LSScene, LSCamera, LSRT );

		for ( var k in that.resources.objects )

			LSScene.remove( that.resources.objects[ k ] );

		if ( verbose ) console.timeEnd( 'Compiling duration' );

		LSRT.dispose();

		complete();

	}

	function complete () {

		for ( var i = 0 ; i < completeCBs.length ; i++ ) 

			completeCBs[ i ]();

	}

	return this;

}