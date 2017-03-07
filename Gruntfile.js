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
		},
		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: [],
				commit: true,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['package.json'],
				createTag: true,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',
				push: false,
				pushTo: 'origin',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
				globalReplace: false,
				prereleaseName: false,
				metadata: '',
				regExp: false
			}
		}
	});

	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-bump' );

	grunt.registerTask( 'default', [ 'uglify' ] );
};