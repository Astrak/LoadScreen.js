# LoadScreen.js
A JS library to improve UX with loadscreens when 3D assets are being loaded.

#Usage
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

#Todo
* second progress bar at top of screen for assets loading after start
* circle type
* fancy loaders
* lots of things, just starting

#license
MIT

#Dependencies : 
* threejs, 
* threejs loaders needed for your files, 
* TweenLite
