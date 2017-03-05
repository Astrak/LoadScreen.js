module.exports = function ( grunt ) {
	grunt.initConfig({
		pkg : grunt.file.readJSON( 'package.json' ),
		uglify: {
			options: { 
				compress: { unused: false }
			},
		    build: {
		        src: 'LoadScreen.js',
		        dest: 'LoadScreen.min.js'
		    }
		}
	});

	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	grunt.registerTask( 'default', [ 'uglify' ] );
};