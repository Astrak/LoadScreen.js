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
		tweens = {},
		updateCBs = [],
		completeCBs = [];

	var rAFID;

	var loadComplete;

	var counter = 0, nFiles = 0;

	var textInfo, sizeInfo;

	var pmremGen, pmremcubeuvpacker;

	var tLoaders = {},
		cTLoaders = {},
		fLoaders = {},
		gLoaders = {},
		oLoaders = {};

	var output = {};

	var extensions, support = {};

	var	textures = {}, cubeTextures = {}, fonts = {}, geometries = {}, objects = {}, 
		texSum = 0, cTexSum = 0, fontSum = 0, geoSum = 0, objSum = 0;

	/* API */
	this.domElement = null;
	this.infoContainer = null;
	this.resources = null;

	this.setSize = setSize;

	style = style || {};

	style = {
		type: typeof style.type !== 'undefined' ? style.type : 'bar',
		size: style.size ? style.size : '150px',
		background: style.background ? style.background : '#333',
		progressBarContainer: style.progressBarContainer ? style.progressBarContainer : '#444',
		progressBar: style.progressBar ? style.progressBar : '#fb0',
		weight: style.weight ? style.weight : '6px',
		infoColor: style.infoColor ? style.infoColor : '#666',
		sizeInfo: typeof style.sizeInfo !== 'undefined' ? style.sizeInfo : true,
		textInfo: typeof style.textInfo !== 'undefined' ? style.textInfo : [ 'Loading', 'Processing', 'Compiling', 'Creating scene' ]
	};

	setLoadScreen();

	if ( style.type !== 'custom' ) setInfos();

	this.start = function ( resources ) {

		if ( style !== 'custom' ) {

			that.domElement.appendChild( that.infoContainer );

			var marginTop = - parseInt( getComputedStyle( that.infoContainer, null ).height ) / 2;

			that.infoContainer.style.marginTop = marginTop + 'px';

			if ( style.type === 'circular' ) {

				var mTop = - parseInt( getComputedStyle( that.infoContainer.lastElementChild, null ).height ) / 2;

				that.infoContainer.lastElementChild.style.marginTop = mTop + 'px';

			}

			animate();

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

			animate();

			tweens.disappear = { 
				key: 'opacity', 
				duration: tweenDuration, 
				targetValue: 0, 
				initialValue: 1,
				value: 1, 
				onUpdate: function () { that.infoContainer.style.opacity = tweens.disappear.value; },
				onComplete: function () { cancelAnimationFrame( rAFID ); end( cb ); }
			};

		} else {

			end( cb );

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

	function animate () {

		rAFID = requestAnimationFrame( animate );

		for ( k in tweens ) {

			var t = tweens[ k ];

			//increment for linear tweening
			var incr = ( t.targetValue - t.initialValue ) / tweenDuration / 60;

			t.value = t.targetValue >= t.initialValue ? Math.min( t.targetValue, t.value + incr ) : Math.max( t.targetValue, t.value + incr );

			if ( typeof t.onUpdate === 'function' ) t.onUpdate();

			if ( t.value === t.targetValue ) {

				if ( typeof t.onComplete === 'function' ) t.onComplete();

				if ( k === 'progress' && t.value === 1 ) {

					delete tweens.progress;

					cancelAnimationFrame( rAFID );

				}

			}

		}

	}

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

			output.textures = {};

			for ( var k in r.textures ) {

				var t = r.textures[ k ];

				if ( t.path && t.fileSize ) {//avoid ready textures

					output.textures[ k ] = {};

					if ( t.GPUCompression ) {

						if ( t.GPUCompression.PVR && getSupport( 'PVR' ) ) {

							t.path = t.GPUCompression.PVR.path;
							t.fileSize = t.GPUCompression.PVR.fileSize;

						} else if ( t.GPUCompression.KTX && getSupport( 'KTX' ) ) {

							t.path = t.GPUCompression.KTX.path;
							t.fileSize = t.GPUCompression.KTX.fileSize;

						}

					}

					textures[ k ] = { prog: 0, fileSize: t.fileSize };
					texSum += t.fileSize;
					nFiles++;

				}

			}

		}		

		if ( r.cubeTextures ) {

			output.cubeTextures = {};

			for ( var k in r.cubeTextures ) {

				var t = r.cubeTextures[ k ];

				if ( t.paths && t.filesSize ) {//avoid ready textures

					output.cubeTextures[ k ] = {};

					cubeTextures[ k ] = { prog: 0, fileSize: t.filesSize };
					cTexSum += t.filesSize;
					nFiles++;

				}

			}

		}		

		if ( r.fonts ) {

			output.fonts = {};

			for ( var k in r.fonts ) {

				var f = r.fonts[ k ];

				if ( f.path && f.fileSize ) {//avoid ready font

					output.fonts[ k ] = {};

					fonts[ k ] = { prog: 0, fileSize: f.fileSize };
					fontSum += f.filesSize;
					nFiles++;

				}

			}

		}

		if ( r.geometries ) {

			output.geometries = {};

			for ( var k in r.geometries ) {

				if ( r.geometries[ k ].path && r.geometries[ k ].fileSize ) {//avoids real geometries & force passing fileSize

					output.geometries[ k ] = {};
					geometries[ k ] = { prog: 0, fileSize: r.geometries[ k ].fileSize };
					geoSum += r.geometries[ k ].fileSize;
					nFiles++;

				}

			}

		}

		if ( r.objects ) {

			output.objects = {};

			for ( var k in r.objects ) {

				if ( r.objects[ k ].path && r.objects[ k ].fileSize ) {//avoids objects to build & force passing fileSize

					output.objects[ k ] = {};
					objects[ k ] = { prog: 0, fileSize: r.objects[ k ].fileSize };
					objSum += r.objects[ k ].fileSize;
					nFiles ++;				

				}

			}

		}

		//2. Load files

		if ( r.textures ) 
			
			for ( var k in r.textures ) 

				if ( r.textures[ k ].path && r.textures[ k ].fileSize )

					loadTexture( k );

		if ( r.cubeTextures ) 
			
			for ( var k in r.cubeTextures ) 

				if ( r.cubeTextures[ k ].paths && r.cubeTextures[ k ].filesSize )

					loadCubeTexture( k );		

		if ( r.fonts ) 
			
			for ( var k in r.fonts ) 

				if ( r.fonts[ k ].path && r.fonts[ k ].fileSize )

					loadFont( k );

		if ( r.geometries ) 
			
			for ( var k in r.geometries ) 

				if ( r.geometries[ k ].path && r.geometries[ k ].fileSize )

					loadGeometry( k );

		if ( r.objects ) 
			
			for ( var k in r.objects ) 

				if ( r.objects[ k ].path && r.objects[ k ].fileSize ) 

					loadObject( k );

	}

	function loadGeometry ( p ) {

		var d = that.resources.geometries[ p ],
			arr = d.path.split( '.' ),
			ext = arr[ arr.length - 1 ];

		getGeometryLoader( ext ).load( 
			d.path, 
			function ( g ) {

				output.geometries[ p ] = g;

				geometries[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Geometry', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var pr = e.loaded / e.total;

				geometries[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Geometry', name: p, progress: pr });

				update();

			}
		);

	}

	function loadTexture ( p ) {

		var d = that.resources.textures[ p ],
			arr = d.path.split( '.' ),
			ext = arr[ arr.length - 1 ];

		getTextureLoader( ext ).load( 
			d.path, 
			function ( t ) {

				output.textures[ p ] = t;

				textures[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Texture', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var pr = e.loaded / e.total;

				textures[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Texture', name: p, progress: pr });

				update();

			}
		);

	}

	function loadFont ( p ) {

		fLoaders.main = fLoaders.main || new THREE.TTFLoader();

		fLoaders.main.load( 
			that.resources.fonts[ p ].path, 
			function ( json ) {

				output.fonts[ p ] = json;

				fonts[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Font', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var pr = e.loaded / e.total;

				fonts[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Font', name: p, progress: pr });

				update();

			}
		);

	}

	function loadCubeTexture ( p ) {

		var d = that.resources.cubeTextures[ p ],
			arr = d.paths[ 0 ].split( '.' ),
			ext = arr[ arr.length - 1 ];

		getCubeTextureLoader( ext ).load( 
			d.paths, 
			function ( t ) {

				output.cubeTextures[ p ] = t;

				cubeTextures[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Cube texture', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var pr = e.loaded / e.total;

				cubeTextures[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Cube texture', name: p, progress: pr });

				update();

			}
		);

	}

	function loadObject ( p ) {

		var d = that.resources.objects[ p ],
			a = d.path.split( '.' ),
			l = a.length,
			ext = a[ l - 2 ] === 'assimp' ? 'assimpJSON' : a[ l - 1 ], 
			loader = getObjectLoader( ext );

		var oC = function ( o, assimp ) {

			var object = ext === 'assimp' ? assimp : o;

			output.objects[ p ] = object;

			objects[ p ].prog = 1;

			counter++;

			updateProgress({ type: 'Object', name: p, progress: 1 });

			update( true );

		};

		var oP = function ( e ) {

			var pr = e.loaded / e.total;

			objects[ p ].prog = pr;

			if ( pr !== 1 ) //otherwise onLoad will be called anyway

				updateProgress({ type: 'Object', name: p, progress: pr });

			update();

		};

		switch ( ext ) {

			case 'mmd': 
				loader.load( d.path, d.vmdPaths, oC, oP );
				break;
			case 'dae':
				if ( d.convertUpAxis ) loader.convertUpAxis = d.convertUpAxis;//continue
			default: 
				loader.load( d.path, oC, oP );

		}

	}

	function getObjectLoader ( ext ) {

		switch ( ext ) {
			case '3mf': 
				if ( ! oLoaders.threemf ) oLoaders.threemf = new THREE.ThreeMFLoader();
				return oLoaders.threemf;
			case 'amf': 
				if ( ! oLoaders.amf ) oLoaders.amf = new THREE.AMFLoader();
				return oLoaders.amf;
			case 'assimp': 
				if ( ! oLoaders.assimp ) oLoaders.assimp = new THREE.AssimpLoader();
				return oLoaders.assimp;
			case 'assimpJSON': 
				if ( ! oLoaders.assimpJSON ) oLoaders.assimpJSON = new THREE.AssimpJSONLoader();
				return oLoaders.assimpJSON;
			case 'awd': 
				if ( ! oLoaders.awd ) oLoaders.awd = new THREE.AWDLoader();
				return oLoaders.awd;
			case 'babylon': 
				if ( ! oLoaders.babylon ) oLoaders.babylon = new THREE.BabylonLoader();
				return oLoaders.babylon;
			case 'dae': 
				if ( ! oLoaders.dae ) oLoaders.dae = new THREE.ColladaLoader();
				return oLoaders.dae;
			case 'fbx': 
				if ( ! oLoaders.fbx ) oLoaders.fbx = new THREE.FBXLoader();
				return oLoaders.fbx;
			case 'obj': 
				if ( ! oLoaders.obj ) oLoaders.obj = new THREE.OBJLoader();
				return oLoaders.obj;
			case 'pcd': 
				if ( ! oLoaders.pcd ) oLoaders.pcd = new THREE.PCDLoader();
				return oLoaders.pcd;
			case 'utf8': 
				if ( ! oLoaders.utf8 ) oLoaders.utf8 = new THREE.UTF8Loader();
				return oLoaders.utf8;
			case 'wrl': 
			case 'wrz': 
			case 'vrml': 
				if ( ! oLoaders.vrml ) oLoaders.vrml = new THREE.VRMLLoader();
				return oLoaders.vrml;
		}

	}

	function getTextureLoader ( ext ) {

		switch ( ext ) {

			case 'tga':
				tLoaders.tga = tLoaders.tga || new THREE.TGALoader();
				return tLoaders.tga;
				break;
			case 'pvr':
				tLoaders.pvr = tLoaders.pvr || new THREE.PVRLoader();
				return tLoaders.pvr;
				break;
			case 'ktx':
				tLoaders.ktx = tLoaders.ktx || new THREE.KTXLoader();
				return tLoaders.ktx;
				break;
			default: 
				tLoaders.main = tLoaders.main || new THREE.TextureLoader();
				return tLoaders.main;

		}

	}

	function getCubeTextureLoader ( ext ) {

		switch ( ext ) {

			case 'hdr':
				cTLoaders.hdr = cTLoaders.hdr || new THREE.HDRCubeTextureLoader();
				return cTLoaders.hdr;
				break;
			default: 
				cTLoaders.main = cTLoaders.main || new THREE.CubeTextureLoader();
				return cTLoaders.main;

		}

	}

	function getSupport ( ext ) {

		if ( typeof support[ ext ] === 'undefined' ) {

			extensions = extensions || renderer.context.getSupportedExtensions();

			if ( ext === 'PVR' ) 

				support[ ext ] = extensions.indexOf( 'WEBGL_compressed_texture_pvrtc' ) > -1 
					|| extensions.indexOf( 'WEBKIT_WEBGL_compressed_texture_pvrtc' ) > -1;

			else //ktx

				support[ ext ] = extensions.indexOf( 'WEBGL_compressed_texture_etc1' ) > -1;

		}

		return support[ ext ];

	}

	function getGeometryLoader ( ext ) {

		switch ( ext ) {
			case 'ctm': 
				gLoaders.ctm = gLoaders.ctm || new THREE.CTMLoader();
				return gLoaders.ctm;
			case 'json': 
				gLoaders.json = gLoaders.json || new THREE.JSONLoader();
				return gLoaders.json;
			case 'ply': 
				gLoaders.ply = gLoaders.ply || new THREE.PLYLoader();
				return gLoaders.ply;
			case 'stl': 
				gLoaders.stl = gLoaders.stl || new THREE.STLLoader();
				return gLoaders.stl;
			case 'vtk': 
				gLoaders.vtk = gLoaders.vtk || new THREE.VTKLoader();
				return gLoaders.vtk;
		}

	}

	function processResources () {

		if ( verbose ) console.time( 'Processing duration' );

		//1. replace textures in resources
		var tA = that.resources.textures,
			oTA = output.textures;

		if ( tA ) {

			for ( var k in oTA ) {

				for ( var p in tA[ k ] ) 

					if ( typeof oTA[ k ][ p ] !== 'undefined' ) 

						oTA[ k ][ p ] = tA[ k ][ p ];

				tA[ k ] = oTA[ k ];

				tA[ k ].name = k;

				delete oTA[ k ];

			}

		}

		//2. replace cube textures in resources
		var cTA = that.resources.cubeTextures,
			oCTA = output.cubeTextures;

		if ( cTA ) {

			for ( var k in oCTA ) {

				if ( cTA[ k ].toPMREM ) {

					var pmremGen = new THREE.PMREMGenerator( oCTA[ k ] );
					pmremGen.update( renderer );

					var pmremcubeuvpacker = new THREE.PMREMCubeUVPacker( pmremGen.cubeLods );
					pmremcubeuvpacker.update( renderer );
					oCTA[ k ] = pmremcubeuvpacker.CubeUVRenderTarget.texture;

				}

				for ( var p in cTA[ k ] ) 

					if ( typeof oCTA[ k ][ p ] !== 'undefined' ) 

						oCTA[ k ][ p ] = cTA[ k ][ p ];

				cTA[ k ] = oCTA[ k ];

				cTA[ k ].name = k;

				delete oCTA[ k ];

			}

		}

		//3. replace fonts in resources
		var fA = that.resources.fonts,
			oFA = output.fonts;

		if ( fA ) {

			for ( var k in oFA ) {

				oFA[ k ] = new THREE.Font( oFA[ k ] );

				for ( var p in fA[ k ] ) 

					if ( typeof oFA[ k ][ p ] !== 'undefined' ) 

						oFA[ k ][ p ] = fA[ k ][ p ];

				fA[ k ] = oFA[ k ];

				fA[ k ].name = k;;

				delete oFA[ k ];

			}

		}
	
		//4. process geometries and replace in resources
		var gA = that.resources.geometries, 
			oGA = output.geometries;

		if ( gA ) {

			for ( var k in oGA ) {

				if ( gA[ k ].toBufferGeometry && oGA[ k ].type !== 'BufferGeometry' )

					oGA[ k ] = new THREE.BufferGeometry().fromGeometry( oGA[ k ] );

				if ( gA[ k ].onComplete ) 

					ga[ k ].onComplete( oGA[ k ] );

				gA[ k ] = oGA[ k ];

				gA[ k ].name = k;

				delete oGA[ k ];

			}

		}

		//5. create objects
		var oA = that.resources.objects,
			oOA = output.objects;

		if ( oA ) {

			var assignPropsToMaterial = function ( k, m ) {

				for ( var p in oA[ k ] ) {

					if ( p !== 'type' && typeof m[ p ] !== 'undefined' ) {

						if ( p.indexOf( 'map' ) > -1 || p.indexOf( 'Map' ) > -1 ) {

							m[ p ] = tA[ oA[ k ][ p ] ];

						} else {

							m[ p ] = oA[ k ][ p ];

						}

						delete oA[ k ][ p ];

					}

				}

			};

			var createObjectFromType = function ( k, g, m ) {

				var object;

				switch ( oA[ k ].type ) {

					case 'mesh': object = new THREE.Mesh( geometry, material ); break;

					case 'points': object = new THREE.Points( geometry, material ); break;

					case 'line': object = new THREE.Line( geometry, material ); break;

					default: object = new THREE.Mesh( geometry, material );

				}

				delete oA[ k ].type;

				return object;

			};

			var assignPropsToObject = function ( k, o ) {

				for ( var p in oA[ k ] ) {

					if ( typeof o[ p ] !== 'undefined' ) 

						o[ p ] = oA[ k ][ p ];

					else 

						o.userData[ p ] = oA[ k ][ p ];

					delete oA[ k ];

				}

			};

			for ( var k in oA ) {

				if ( oA[ k ].path && oA[ k ].fileSize ) {//object pending in output.objects

					var p = oA[ k ].path,
						a = p.split( '.' ),
						l = a.length;

					var object;

					if ( a[ l - 2 ] === 'assimp' ) {//AssimpJSON > .object

						object = oOA[ k ].object;

					} else if ( a[ l - 1 ] === 'dae' ) {//Collada > .scene, .kinematics..

						object = oOA[ k ].scene;

					} else {

						object = oOA[ k ];

					}

					assignPropsToMaterial( k, object.material );

					assignPropsToObject( k, object );

					if ( oA[ k ].onComplete ) oA[ k ].onComplete( object );

					oA[ k ] = object;

					oA[ k ].name = k;

					delete oOA[ k ];

				} else if ( typeof oA[ k ].geometry === 'string' ) {//object to assemble from asset

					var geometry = that.resources.geometries[ oA[ k ].geometry ], 
						material = oA[ k ].material;

					delete oA[ k ].geometry;
					delete oA[ k ].material;

					assignPropsToMaterial( k, material );

					var object = createObjectFromType( k, geometry, material );

					assignPropsToObject( k, object );

					if ( oA[ k ].onComplete ) oA[ k ].onComplete( object );

					oA[ k ] = object;

					oA[ k ].name = k;

				} else if ( ! oA[ k ] instanceof THREE.Object3D ) {//object to assemble

					var geometry = oA[ k ].geometry, 
						material = oA[ k ].material;

					delete oA[ k ].geometry;
					delete oA[ k ].material;

					assignPropsToMaterial( k, oA[ k ].material );

					var object = createObjectFromType( k, geometry, material );

					assignPropsToObject( k, object );

					if ( oA[ k ].onComplete ) oA[ k ].onComplete( object );

					oA[ k ] = object;

					oA[ k ].name = k;

				}//else : it is a mesh, do nothing

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

			progressBar.style.width = ( 100 * tweens.progress.value ).toString() + '%'; 

			if ( style.sizeInfo ) sizeInfo.textContent = ( tweens.progress.value * ( texSum + geoSum ) / 1024 ).toFixed( 2 ) + ' MB';

		};

		tweens.progress = { 
			key: 'progress', 
			duration: tweenDuration, 
			targetValue: progress, 
			initialValue: 0, 
			value: 0,
			onUpdate: updateStyle
		};

		updateCBs.push( function () { 

			tweens.progress.initialValue = tweens.progress.value;
			tweens.progress.targetValue = progress;
			tweens.progress.duration += tweenDuration;

		});

	}

	function makeCircularProgress () {

		//shorter than using the namespace elements creation API.
		var svg = ""+
			"<svg style='width: 100%; height: 100%;' width=200 height=200 viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>"+
			"	<circle fill=" + style.progressBarContainer + " cx='0' cy='0' transform='translate(100,100)'  r='" + ( 80 + parseInt( style.weight ) / 2 + 2 ).toString()+ "'/>"+
			"	<circle fill=" + style.background + " cx='0' cy='0' transform='translate(100,100)'  r='" + ( 80 - parseInt( style.weight ) / 2 - 2 ).toString()+ "'/>"+
			"	<circle fill='none' cx='0' cy='0' transform='translate(100,100) rotate(-90)' r='80' stroke-dashoffset='1503'/>"+
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
				'width: 100%; left: 50%; top: 50%;'+
				'margin-left: -50%;'+
				'position: absolute;';

			that.infoContainer.appendChild( textContainer );

			if ( style.textInfo ) textContainer.appendChild( textInfo );

			if ( style.sizeInfo ) textContainer.appendChild( sizeInfo );

			textInfo.style.display = sizeInfo.style.display = 'block';
			
		}

		var updateStyle = function () { 

			circleProgress.setAttribute( 'stroke-dashoffset', ( ( 1 - tweens.progress.value ) * 502 ).toString() );

			if ( style.sizeInfo ) sizeInfo.textContent = ( tweens.progress.value * ( texSum + geoSum ) / 1024 ).toFixed( 2 ) + ' MB';

		};

		tweens.progress = { 
			key: 'progress', 
			duration: tweenDuration, 
			targetValue: progress, 
			initialValue: 0, 
			value: 0,
			onUpdate: updateStyle
		};

		updateCBs.push( function () { 

			tweens.progress.initialValue = tweens.progress.value;
			tweens.progress.targetValue = progress;
			tweens.progress.duration += tweenDuration;

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
		if ( typeof o !== 'undefined' && verbose )

			console.info( 'Progress = ' + progress + ', ' + o.type + ' > ' + o.name + ' > ' + Math.round( 100 * o.progress ) + '%' );

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

					if ( style.type !== 'custom' && style.textInfo ) {

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

			if ( style.type !== 'custom' ) 

				tweens.progress.onComplete = function () { if ( tweens.progress.value === 1 ) finish(); };
			
			else finish();

		}

	}

	function compile () {

		//use renderer.compile( scene, camera ) in next threejs release

		var LSScene = new THREE.Scene(), 
			LSCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 2 ),
			LSRT = new THREE.WebGLRenderTarget( 10, 10, { generateMipmaps: true } );//remove

		for ( var k in that.resources.objects )

			LSScene.add( that.resources.objects[ k ] );

		if ( verbose ) console.time( 'Compiling duration' );

		renderer.render( LSScene, LSCamera, LSRT );//replace here

		for ( var k in that.resources.objects )

			LSScene.remove( that.resources.objects[ k ] );

		if ( verbose ) console.timeEnd( 'Compiling duration' );

		LSRT.dispose();//remove

		complete();

	}

	function complete () {

		if ( style.type !== 'custom' && style.textInfo ) {

			textInfo.textContent = typeof style.textInfo === 'string' ? style.textInfo : style.textInfo[ 3 ];

			setTimeout( function () { 

				if ( verbose ) console.time( 'Scene creation duration' );

				for ( var i = 0 ; i < completeCBs.length ; i++ ) 

					completeCBs[ i ]();

				if ( verbose ) console.timeEnd( 'Scene creation duration' );

			}, 20 );

		}

	}

	return this;

}