/*
	author : @Astrak 
*/

function LoadScreen ( renderer, style ) {

	/*
		@renderer = a threejs webgl renderer

		@style (optional) = object with following structure 
		{
			type: string,//'bar' or 'circle' or 'custom', defaults to 'bar'
			size: number,//size of the edges of the infoContainer div
			background: string,//'#ddd' as default, css color of background 
			progressContainer: string,//'#bbb' as default, css color of progressContainer 
			progressBar: string,//'#666' as default, css color of progressBar 
			percentInfo: bol,//display progress in %
			sizeInfo: bol,//display progress ratio in MB
			textInfo: - false//No textual information displayed.
					  - array//Defaults to [ 'Loading', 'Creating scene' ]. 
		}
		- type can be set to 'custom' to customize the loader : the background is at 
		this.domElement, the central infoBox at this.infoContainer, you can append 
		your custom loader and update it through the onProgress callback function 
		that will receive the progress as argument. If 

	*/

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
		type: style.hasOwnProperty( 'type' ) ? style.type : 'bar',
		size: style.size ? style.size : '100px',
		background: style.background ? style.background : '#ddd',
		progressContainer: style.progressContainer ? style.progressContainer : '#bbb',
		progressBar: style.progressBar ? style.progressBar : '#666',
		percentInfo: style.hasOwnProperty( 'percentInfo' ) ? style.percentInfo : false,
		sizeInfo: style.hasOwnProperty( 'sizeInfo' ) ? style.sizeInfo : false,
		textInfo: style.hasOwnProperty( 'textInfo' ) ? style.textInfo : [ 'Loading', 'Processing' ]
	};

	setLoadScreen();

	setInfos();

	this.start = function ( resources ) {

		if ( resources ) that.resources = resources;

		if ( style !== false ) that.domElement.appendChild( that.infoContainer );

	};

	this.remove = 

	this.setProgress = function ( p ) {

		progress = p;

		if ( style !== false ) update();

	};

	this.setOptions = function ( o ) {

		forcedStart = o.hasOwnProperty( 'forcedStart' ) ? o.forcedStart : forcedStart;
		verbose = o.hasOwnProperty( 'verbose' ) ? o.verbose : verbose;

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

	function remove () { 

		that.domElement.parentNode.removeChild( that.domElement ); 

		removed = true;

	}

	return this;

}