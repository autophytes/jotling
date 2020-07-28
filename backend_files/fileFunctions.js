const { app, dialog, inAppPurchase } = require('electron');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// const rimraf = require('rimraf'); -- will recurisively delete files. Kinda scary though, be careful.
const ncp = require('ncp').ncp;
const tar = require('tar');

const createNewProject = async () => {
	let projectFolderName = 'jotling-' + uuidv4();
	let projectTempDirectory = path.join(app.getPath('temp'), projectFolderName);
	let defaultProjectFiles = path.resolve(__dirname, '../backend_files/defaultProjectFiles');
	console.log('projectTempDirectory: ', projectTempDirectory);
	console.log('defaultProjectFiles: ', defaultProjectFiles);

	// Copies the default files to the project's temporary folder
	ncp(defaultProjectFiles, projectTempDirectory, function (err) {
		if (err) {
			return console.error(err);
		}

		// Asks the user where to save the file, what to name it
		let projectFilePath = dialog.showSaveDialogSync({
			title: 'Create New Project',
			defaultPath: app.getPath('documents'),
			buttonLabel: 'Create',
			nameFieldLabel: 'New Project Name',
			properties: ['showOverwriteConfirmation'],
		});

		// Appends .jots to the file name if the user didn't
		if (projectFilePath.slice(-5) !== '.jots') {
			projectFilePath = projectFilePath.concat('.jots');
		}

		// Creates the bundled project from the temp files
		tar.create(
			{
				gzip: { level: 1 }, // Disabled: 4096b, 1: 540b, 3: 524b, 9: 475b
				file: projectFilePath, // output file path & name
				cwd: app.getPath('temp'), // directory paths are relative from
			},
			[projectFolderName], // Relative to the cwd path
			() => {
				console.log('Finished creating the new tarball!');
			}
		);

		console.log('Copied the new folder!');
	});

	// Next, need to open the project that I just created
	// Then migrate all of our work to the temporary folder, and mirror saves in the .jots file
};

module.exports = { createNewProject };
