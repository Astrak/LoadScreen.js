function LoadScreen ( renderer, style ) {

	'use strict';

	var that = this;

	/* Internals */
	var	infos = null,
		verbose = false, 
		forcedStart = false, 
		tweenDuration = .5,
		progress = 0,
		removed = false,
		tweens = {},
		updateCBs = [],
		completeCBs = [];

	var rAFID;

	var loadComplete;

	var counter = 0, nFiles = 0;

	var textInfo, sizeInfo;

	var pmremGen, pmremcubeuvpacker;

	var fLoader,
		foLoaders = {},
		tLoaders = {},
		mLoaders = {},
		gLoaders = {},
		aLoader,
		oLoaders = {};

	var output = {};

	var extensions, support = {};

	var	files = {}, fonts = {}, textures = {}, materials = {}, geometries = {}, animations = {}, objects = {},  
		fileSum = 0, fontSum = 0, texSum = 0, matSum = 0, geoSum = 0, animSum = 0, objSum = 0;

	var LSScene, LSCamera, LSRT;

	/* API */
	this.domElement = null;
	this.infoContainer = null;
	this.resources = null;

	this.setSize = setSize;

	style = style || {};

	style = {
		type: typeof style.type !== 'undefined' ? style.type : 'progress-bar',
		size: style.size || '170px',
		background: typeof style.background !== 'undefined' ? style.background : '#333',
		progressBarContainer: style.progressBarContainer || '#444',
		progressBar: style.progressBar || '#fb0',
		weight: style.weight || '6px',
		infoColor: style.infoColor || '#666',
		sizeInfo: typeof style.sizeInfo !== 'undefined' ? style.sizeInfo : true,
		progressInfo: typeof style.progressInfo !== 'undefined' ? style.progressInfo : true,
		textInfo: typeof style.textInfo !== 'undefined' ? style.textInfo : [ 'Loading', 'Processing', 'Compiling', 'Creating scene' ]
	};

	setLoadScreen();

	if ( style.type !== 'custom' ) setInfos();

	this.start = function ( resources ) {

		var fire = function () {

			if ( style !== 'custom' ) {

				that.domElement.appendChild( that.infoContainer );

				var marginTop = - parseInt( getComputedStyle( that.infoContainer, null ).height ) / 2;

				that.infoContainer.style.marginTop = marginTop + 'px';

				if ( style.progressInfo && style.type.indexOf( 'circular' ) > -1 ) {

					console.log( that.infoContainer )

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

		};

		if ( forcedStart ) {

			fire();

		} else {

			var checkInSight = function () {

				var pos = renderer.domElement.getBoundingClientRect(),
					top = pos.top,
					height = pos.height;

				if ( top < innerHeight && ( top + height ) > 0 ) {

					window.removeEventListener( 'scroll', checkInSight );

					fire();

				}

			};

			window.addEventListener( 'scroll', checkInSight );

			checkInSight();

		}

		return that;

	};

	this.remove = function ( cb ) {

		if ( style.type !== 'custom' ) {

			animate();

			tweens.disappear = {
				duration: tweenDuration, 
				targetValue: 0, 
				initialValue: 1,
				value: 1, 
				onUpdate: function () { that.infoContainer.style.opacity = tweens.disappear.value; },
				onComplete: function () { 

					end( cb ); 

					cancelAnimationFrame( rAFID );

					delete tweens.disappear;

				}
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

		forcedStart = typeof o.forcedStart !== 'undefined' ? o.forcedStart : forcedStart;
		tweenDuration = typeof o.tweenDuration !== 'undefined' ? o.tweenDuration : tweenDuration;
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

		for ( var k in tweens ) {

			var t = tweens[ k ];

			//increment for linear tweening
			var incr = ( t.targetValue - t.initialValue ) / t.duration / 60;

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
		
		if ( r.files ) {

			output.files = {};

			for ( var k in r.files ) {

				var f = r.files[ k ];

				if ( f.path && f.fileSize ) {//avoid ready files

					output.files[ k ] = {};

					files[ k ] = { prog: 0, fileSize: t.fileSize };
					fileSum += t.fileSize;
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

					if ( typeof t.path !== 'string' ) {//array

						textures[ k ].subFiles = {};

						for ( var i = 0 ; i < t.path.length ; i++ )

							textures[ k ].subFiles[ t.path[ i ] ] = 0;

					}

					texSum += t.fileSize;
					nFiles++;

				}

			}

		}

		if ( r.materials ) {

			output.materials = {};

			for ( var k in r.materials ) {

				var t = r.materials[ k ];

				if ( t.path && t.fileSize ) {//avoid ready materials

					output.materials[ k ] = {};

					materials[ k ] = { prog: 0, fileSize: t.fileSize };
					matSum += t.fileSize;
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

		if ( r.animations ) {

			output.animations = {};

			for ( var k in r.animations ) {

				if ( r.animations[ k ].path && r.animations[ k ].fileSize ) {//avoids real animations & force passing fileSize

					output.animations[ k ] = {};
					animations[ k ] = { prog: 0, fileSize: r.animations[ k ].fileSize };
					animSum += r.animations[ k ].fileSize;
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

		if ( r.files ) 
			
			for ( var k in r.files ) 

				if ( r.files[ k ].path && r.files[ k ].fileSize )

					loadFile( k );

		if ( r.fonts ) 
			
			for ( var k in r.fonts ) 

				if ( r.fonts[ k ].path && r.fonts[ k ].fileSize )

					loadFont( k );

		if ( r.textures ) 
			
			for ( var k in r.textures ) 

				if ( r.textures[ k ].path && r.textures[ k ].fileSize )

					loadTexture( k );

		if ( r.materials ) 
			
			for ( var k in r.materials ) 

				if ( r.materials[ k ].path && r.materials[ k ].fileSize )

					loadMaterial( k );

		if ( r.geometries ) 
			
			for ( var k in r.geometries ) 

				if ( r.geometries[ k ].path && r.geometries[ k ].fileSize )

					loadGeometry( k );

		if ( r.animations ) 
			
			for ( var k in r.animations ) 

				if ( r.animations[ k ].path && r.animations[ k ].fileSize )

					loadAnimation( k );

		if ( r.objects ) 
			
			for ( var k in r.objects ) 

				if ( r.objects[ k ].path && r.objects[ k ].fileSize ) 

					loadObject( k );

	}

	function loadFile ( p ) {

		var fLoader = fLoader || new THREE.FileLoader();

		fLoader.load( 
			that.resources.files[ p ].path, 
			function ( f ) {

				output.files[ p ] = f;

				files[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'File', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var total = e.total || files[ p ].fileSize * 1024;

				var pr = e.loaded / total;

				geometries[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'File', name: p, progress: pr });

				update();

			}
		);

	}

	function loadFont ( p ) {

		foLoaders.main = foLoaders.main || new THREE.TTFLoader();

		foLoaders.main.load( 
			that.resources.fonts[ p ].path, 
			function ( json ) {

				output.fonts[ p ] = json;

				fonts[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Font', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var total = e.total || fonts[ p ].fileSize * 1024;

				var pr = e.loaded / total;

				fonts[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Font', name: p, progress: pr });

				update();

			}
		);

	}

	function loadTexture ( p ) {

		var d = that.resources.textures[ p ], arr, ext,
			t = textures[ p ];

		if ( typeof d.path === 'string' ) {

			arr = d.path.split( '.' );
			ext = arr[ arr.length - 1 ];

		} else {

			arr = d.path[ 0 ].split( '.' );
			ext = arr[ arr.length - 1 ].toLowerCase() === 'hdr' ? 'cubehdr' : 'cube';

		}

		var oC = function ( result ) {

			output.textures[ p ] = result;

			t.prog = 1;

			counter++;

			updateProgress({ type: 'Texture', name: p, progress: 1 });

			update( true );

		};

		var oP = function ( e ) {

			var total = e.total || t.fileSize * 1024;

			var pr = e.loaded / total;

			if ( t.subFiles ) {

				t.prog = 0;

				for ( var k in t.subFiles ) {

					if ( e.target.responseURL.indexOf( k ) > -1 )

						t.subFiles[ k ] = pr;

					t.prog = t.prog + t.subFiles[ k ] / 6;

				}

			} else {

				t.prog = pr;

			}

			if ( t.prog !== 1 ) {//otherwise onLoad will be called anyway

				updateProgress({ type: 'Texture', name: p, progress: t.prog });

			}

			update();

		};

		if ( ext === 'cubehdr' ) 

			getTextureLoader( ext ).load( THREE.UnsignedByteType, d.path, oC, oP );

		else

			getTextureLoader( ext.toLowerCase() ).load( d.path, oC, oP );
 
	}

	function loadMaterial ( p ) {

		var d = that.resources.materials[ p ],
			arr = d.path.split( '.' ),
			ext = arr[ arr.length - 1 ];

		getMaterialLoader( ext.toLowerCase() ).load( 
			d.path, 
			function ( m ) {

				output.materials[ p ] = m;

				materials[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Material', name: p, progress: 1 });

				update( true );

				if ( m instanceof THREE.MTLLoader.MaterialCreator ) {

					//Check if .obj path with 'setMaterials' === p, then load
					var o = that.resources.objects;

					if ( o ) {

						for ( var k in o ) {

							var ext = o.path.split( '.' );
							ext = ext[ ext.length - 1 ];

							if ( o[ k ].setMaterials === p && ext === 'obj' )

								loadObject( k, m );

						}

					}

				}

			}, 
			function ( e ) {

				var total = e.total || materials[ p ].fileSize * 1024;

				var pr = e.loaded / total;

				materials[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Material', name: p, progress: pr });

				update();

			}
		);

	}

	function loadGeometry ( p ) {

		var d = that.resources.geometries[ p ],
			arr = d.path.split( '.' ),
			ext = arr[ arr.length - 1 ];

		getGeometryLoader( ext.toLowerCase() ).load( 
			d.path, 
			function ( g ) {

				output.geometries[ p ] = g;

				geometries[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Geometry', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var total = e.total || geometries[ p ].fileSize * 1024;

				var pr = e.loaded / total;

				geometries[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Geometry', name: p, progress: pr });

				update();

			}
		);

	}

	function loadAnimation ( p ) {

		var d = that.resources.animations[ p ];

		aLoader = aLoader || new THREE.BVHLoader();

		aLoader.load( 
			d.path, 
			function ( a ) {

				output.animations[ p ] = a;

				animations[ p ].prog = 1;

				counter++;

				updateProgress({ type: 'Animation', name: p, progress: 1 });

				update( true );

			}, 
			function ( e ) {

				var total = e.total || animations[ p ].fileSize * 1024;

				var pr = e.loaded / total;

				animations[ p ].prog = pr;

				if ( pr !== 1 ) //otherwise onLoad will be called anyway

					updateProgress({ type: 'Animation', name: p, progress: pr });

				update();

			}
		);

	}

	function loadObject ( p, materialCreator ) {

		var d = that.resources.objects[ p ],
			a = d.path.split( '.' ),
			l = a.length,
			ext = a[ l - 2 ].toLowerCase() === 'assimp' ? 'assimpJSON' : a[ l - 1 ];
			

		//If the OBJLoader's option 'setMaterials' is specified,
		//don't load here, it will happen inside the MTLLoader.
		if ( ext === 'obj' && d.setMaterials ) return;

		var oC = function ( o, assimp ) {

			var object = ext === 'assimp' ? assimp : o;

			output.objects[ p ] = object;

			objects[ p ].prog = 1;

			counter++;

			updateProgress({ type: 'Object', name: p, progress: 1 });

			update( true );

		};

		var oP = function ( e ) {

			var total = e.total || objects[ p ].fileSize * 1024;

			var pr = e.loaded / total;

			objects[ p ].prog = pr;

			if ( pr !== 1 ) //otherwise onLoad will be called anyway

				updateProgress({ type: 'Object', name: p, progress: pr });

			update();

		};

		if ( materialCreator ) {

			var loader = new THREE.OBJLoader();

			loader.setMaterials( materialCreator.preload() );

			loader.load( d.path, oC, oP );			
			
		} else {

			var loader = getObjectLoader( ext.toLowerCase() );

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
			case 'cubehdr':
				tLoaders.hdr = tLoaders.hdr || new THREE.HDRCubeTextureLoader();
				return tLoaders.hdr;
				break;
			case 'cube':
				tLoaders.cube = tLoaders.cube || new THREE.CubeTextureLoader();
				return tLoaders.cube;
				break;
			default: 
				tLoaders.main = tLoaders.main || new THREE.TextureLoader();
				return tLoaders.main;

		}

	}

	function getMaterialLoader ( ext ) {

		switch ( ext ) {

			case 'js':
			case 'json'://check if they are json and js !! no example
				mLoaders.main = mLoaders.main || new THREE.MaterialLoader();
				return mLoaders.main;
			case 'mtl': 
				mLoaders.mat = mLoaders.mat || new THREE.MTLLoader();
				return mLoaders.mat;

		}

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
			case 'bin': 
				if ( ! oLoaders.bin ) oLoaders.bin = new THREE.BinaryLoader();
				return oLoaders.bin;
			case 'dae': 
				if ( ! oLoaders.dae ) oLoaders.dae = new THREE.ColladaLoader();
				return oLoaders.dae;
			case 'fbx': 
				if ( ! oLoaders.fbx ) oLoaders.fbx = new THREE.FBXLoader();
				return oLoaders.fbx;
			case 'gltf': 
				if ( ! oLoaders.gltf ) oLoaders.gltf = new THREE.GLTFLoader();
				return oLoaders.gltf;
			case 'js': 
			case 'json': 
				if ( ! oLoaders.main ) oLoaders.main = new THREE.ObjectLoader();
				return oLoaders.main;
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

	function processResources () {

		if ( verbose ) console.time( 'Processing duration' );

		//1. files
		var fA = that.resources.files,
			oFA = output.files;

		if ( fA ) {

			for ( var k in oFA ) {

				for ( var p in fA[ k ] ) 

					if ( typeof oFA[ k ][ p ] !== 'undefined' ) 

						oFA[ k ][ p ] = fA[ k ][ p ];

				if ( fA[ k ].onComplete )

					fA[ k ].onComplete( oFA[ k ] );

				fA[ k ] = oFA[ k ];

				fA[ k ].name = k;

				delete oFA[ k ];

			}

		}

		//2. fonts
		var foA = that.resources.fonts,
			oFoA = output.fonts;

		if ( foA ) {

			for ( var k in oFoA ) {

				oFoA[ k ] = new THREE.Font( oFoA[ k ] );

				for ( var p in foA[ k ] ) 

					if ( typeof oFoA[ k ][ p ] !== 'undefined' ) 

						oFoA[ k ][ p ] = foA[ k ][ p ];

				foA[ k ] = oFoA[ k ];

				foA[ k ].name = k;;

				delete oFoA[ k ];

			}

		}

		//3. textures
		var tA = that.resources.textures,
			oTA = output.textures;

		if ( tA ) {

			for ( var k in oTA ) {

				if ( tA[ k ].toPMREM ) {

					if ( verbose ) console.time( 'Texture > ' + k + ' > PMREM creation time' );

					var pmremGen = new THREE.PMREMGenerator( oTA[ k ] );
					pmremGen.update( renderer );

					var pmremcubeuvpacker = new THREE.PMREMCubeUVPacker( pmremGen.cubeLods );
					pmremcubeuvpacker.update( renderer );
					oTA[ k ] = pmremcubeuvpacker.CubeUVRenderTarget.texture;

					if ( verbose ) console.timeEnd( 'Texture > ' + k + ' > PMREM creation time' );

				}

				for ( var p in tA[ k ] ) 

					if ( typeof oTA[ k ][ p ] !== 'undefined' ) 

						oTA[ k ][ p ] = tA[ k ][ p ];

				tA[ k ] = oTA[ k ];

				tA[ k ].name = k;

				delete oTA[ k ];

			}

		}

		//4. materials
		var mA = that.resources.materials,
			oMA = output.materials;

		if ( mA ) {

			for ( var k in oMA ) {

				for ( var p in mA[ k ] ) 

					if ( typeof oMA[ k ][ p ] !== 'undefined' ) 

						oMA[ k ][ p ] = mA[ k ][ p ];

				if ( mA[ k ].onComplete )

					mA[ k ].onComplete( oMA[ k ] );

				mA[ k ] = oMA[ k ];

				mA[ k ].name = k;

				delete oMA[ k ];

			}

		}
	
		//5. geometries
		var gA = that.resources.geometries, 
			oGA = output.geometries;

		if ( gA ) {

			for ( var k in oGA ) {

				if ( gA[ k ].flatNormals && oGA[ k ].type !== 'BufferGeometry' )

					oGA[ k ].computeFlatVertexNormals();

				if ( gA[ k ].toBufferGeometry && oGA[ k ].type !== 'BufferGeometry' )

					oGA[ k ] = new THREE.BufferGeometry().fromGeometry( oGA[ k ] );

				if ( gA[ k ].onComplete ) 

					gA[ k ].onComplete( oGA[ k ] );

				gA[ k ] = oGA[ k ];

				gA[ k ].name = k;

				delete oGA[ k ];

			}

		}

		//6. animations
		var aA = that.resources.animations, 
			oAA = output.animations;

		if ( aA ) {

			for ( var k in oAA ) {

				if ( aA[ k ].onComplete ) 

					ga[ k ].onComplete( oAA[ k ] );

				aA[ k ] = oAA[ k ];

				aA[ k ].name = k;

				delete oAA[ k ];

			}

		}

		//7. objects
		var oA = that.resources.objects,
			oOA = output.objects;

		if ( oA ) {

			var assignPropsToMaterial = function ( k, m ) {

				for ( var p in oA[ k ] ) {

					if ( p !== 'type' && typeof m[ p ] !== 'undefined' ) {

						if ( p.indexOf( 'map' ) > -1 || p.indexOf( 'Map' ) > -1 ) {

							m[ p ] = tA[ oA[ k ][ p ] ];

						} else if ( [ 'emissive', 'color' ].indexOf( p ) > -1 && ! oA[ k ][ p ] instanceof THREE.Color ) {

							m[ p ] = new THREE.Color( oA[ k ][ p ] );

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

					delete oA[ k ][ p ];

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

					} else if ( a[ l - 1 ] === 'gltf' ) {

						object = typeof oOA[ k ].scene !== 'undefined' ? oOA[ k ].scene : oOA[ k ].scenes[ 0 ];

					} else {

						object = oOA[ k ];

					}

					assignPropsToMaterial( k, object.material );

					assignPropsToObject( k, object );

					if ( oA[ k ].onComplete ) oA[ k ].onComplete( object );

					oA[ k ] = object;

					oA[ k ].name = k;

					delete oOA[ k ];

				} else if ( typeof oA[ k ].geometry === 'string' || typeof oA[ k ].material === 'string' ) {//object to assemble from asset

					var geometry = typeof oA[ k ].geometry === 'string' ? that.resources.geometries[ oA[ k ].geometry ] : oA[ k ].geometry, 
						material = typeof oA[ k ].material === 'string' ? that.resources.geometries[ oA[ k ].material ] : oA[ k ].material;

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
			case 'circular-rotate': makeCircularProgress( 'rotate' ); break;
			case 'circular-fancy': makeCircularProgress( 'fancy' ); break;
			default: makeBarProgress(); 

		}

	}

	function makeBarProgress () {

		if ( style.progressInfo ) {

			var progressBarContainer = document.createElement( 'div' ),
				progressBar = document.createElement( 'div' );

			style.weight = style.weight.toString().indexOf( 'px' ) > -1 ? style.weight : style.weight + 'px';

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

		}

		if ( style.textInfo ) that.infoContainer.appendChild( textInfo );

		if ( style.progressInfo ) that.infoContainer.appendChild( progressBarContainer );

		if ( style.sizeInfo ) that.infoContainer.appendChild( sizeInfo );

		var updateStyle = function () { 

			if ( style.progressInfo ) progressBar.style.width = ( 100 * tweens.progress.value ).toString() + '%'; 

			if ( style.sizeInfo ) sizeInfo.textContent = ( tweens.progress.value * ( texSum + geoSum ) / 1024 ).toFixed( 2 ) + 'MB';

		};

		tweens.progress = {
			duration: tweenDuration, 
			targetValue: progress, 
			initialValue: 0, 
			value: 0,
			onUpdate: updateStyle
		};

		updateCBs.push( function () { 

			tweens.progress.initialValue = tweens.progress.value;
			tweens.progress.targetValue = progress;
			tweens.progress.duration = tweenDuration;

		});

	}

	function makeCircularProgress ( type ) {

		if ( style.progressInfo ) {

			//far shorter than using the namespace elements creation API.

			var typeFancy = type === 'fancy' ? "<circle fill='none' cx='0' cy='0' transform='translate(100,100) rotate(-90)' r='" + ( 80 + parseInt( style.weight ) + 2 ).toString() + "' stroke-dashoffset='1503'/>" : "";

			var radius = parseInt( style.weight );
			radius *= type === 'fancy' ? 2.5 : 1;
			radius = 80 + radius / 2;
			radius += type === 'fancy' ? 6 : 2;

			var svg = ""+
				"<svg style='width: 100%; height: 100%;' width=200 height=200 viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>"+
				"	<circle fill=" + style.progressBarContainer + " cx='0' cy='0' transform='translate(100,100)'  r='" + radius.toString()+ "'/>"+
				"	<circle fill=" + style.background + " cx='0' cy='0' transform='translate(100,100)'  r='" + ( 80 - parseInt( style.weight ) / 2 - 2 ).toString()+ "'/>"+
				typeFancy +
				"	<circle fill='none' cx='0' cy='0' transform='translate(100,100) rotate(-90)' r='80' stroke-dashoffset='1503'/>"+
				"</svg>";

			that.infoContainer.innerHTML = svg;

			var circleProgress = that.infoContainer.firstElementChild.lastElementChild;

			circleProgress.style.cssText = ''+
				'stroke:' + style.progressBar + ';'+
				'stroke-width:' + parseInt( style.weight )+ ';'+
				'stroke-dasharray:502;';

			if ( type === 'fancy' ) {

				var circleFancy = circleProgress.previousElementSibling;

				circleFancy.style.cssText = ''+
					'stroke:' + style.progressBar + ';'+
					'stroke-width:' + parseInt( style.weight )+ ';'+
					'stroke-dasharray:' + ( parseInt( style.weight ) * 1.5 + 129.5 ) + ';'+
					'opacity: .5';

			}

		}

		if ( style.textInfo || style.sizeInfo || style.progressInfo ) {

			var container;

			if ( style.progressInfo ) {

				var textContainer = document.createElement( 'div' );

				textContainer.style.cssText = ''+
					'width: 100%; left: 50%; top: 50%;'+
					'margin-left: -50%;'+
					'position: absolute;';

				that.infoContainer.appendChild( textContainer );

				container = textContainer;

			} else {

				container = that.infoContainer;

			}

			if ( style.textInfo ) {

				container.appendChild( textInfo );

				textInfo.style.display = 'block';

			}

			if ( style.sizeInfo ) {

				container.appendChild( sizeInfo );

				sizeInfo.style.display = 'block';

			}
			
		}

		var updateStyle = function () { 

			if ( style.progressInfo ) {

				circleProgress.setAttribute( 'stroke-dashoffset', ( ( 1 - tweens.progress.value ) * 502 ).toString() );

				if ( type ) 

					circleProgress.setAttribute( 'transform', 'translate(100,100) rotate(' + ( -90 + 180 * tweens.progress.value ) + ')' );

				if ( type === 'fancy' ) {

					circleFancy.setAttribute( 'stroke-dashoffset', ( ( 1 - tweens.progress.value ) * 502 ).toString() );

					circleFancy.setAttribute( 'transform', 'translate(100,100) rotate(' + ( -90 + 135 * tweens.progress.value ) + ')' );

				}

			}

			if ( style.sizeInfo ) sizeInfo.textContent = ( tweens.progress.value * ( texSum + geoSum ) / 1024 ).toFixed( 2 ) + 'MB';

		};

		tweens.progress = {
			duration: tweenDuration, 
			targetValue: progress, 
			initialValue: 0, 
			value: 0,
			onUpdate: updateStyle
		};

		updateCBs.push( function () { 

			tweens.progress.initialValue = tweens.progress.value;
			tweens.progress.targetValue = progress;
			tweens.progress.duration = tweenDuration;

		});

	}

	function updateProgress ( o ) {

		//1. compute progress value
		var fileProg = 0, fontProg = 0, texProg = 0, matProg = 0, geoProg = 0, animProg = 0, objProg = 0;

		for ( var k in files ) 

			fileProg += files[ k ].prog * files[ k ].fileSize;

		for ( var k in fonts ) 

			fontProg += fonts[ k ].prog * fonts[ k ].fileSize;

		for ( var k in textures )

			texProg += textures[ k ].prog * textures[ k ].fileSize;

		for ( var k in materials ) 

			matProg += materials[ k ].prog * materials[ k ].fileSize;

		for ( var k in geometries ) 

			geoProg += geometries[ k ].prog * geometries[ k ].fileSize;

		for ( var k in animations ) 

			animProg += animations[ k ].prog * animations[ k ].fileSize;

		for ( var k in objects ) 

			objProg += objects[ k ].prog * objects[ k ].fileSize;

		progress = ( fileProg + fontProg + texProg + matProg + geoProg + animProg + objProg ) / ( fileSum + fontSum + texSum + matSum + geoSum + animSum + objSum );

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

		LSScene = new THREE.Scene();
		LSCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 2 );

		for ( var k in that.resources.objects )

			LSScene.add( that.resources.objects[ k ] );

		if ( verbose ) console.time( 'Compiling duration' );

		if ( typeof renderer.compile === 'undefined' ) {//pre r85

			LSRT = new THREE.WebGLRenderTarget( 1, 1, { generateMipmaps: true } );

			renderer.render( LSScene, LSCamera, LSRT );

			LSRT.dispose();

		} else {

			renderer.compile( LSScene, LSCamera );

		}

		for ( var k in that.resources.objects )

			LSScene.remove( that.resources.objects[ k ] );

		if ( verbose ) console.timeEnd( 'Compiling duration' );

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