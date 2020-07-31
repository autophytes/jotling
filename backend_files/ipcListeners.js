const { ipcMain, app, dialog } = require('electron');
const fontList = require('font-list');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

var lastSaveTimeout = { timeout: null, projectTempPath: '', projectJotsPath: '' };

// NOTE: Use node-tar to bundle and then compress files.
//  - When opening folder, extract the tar.gz (.jots) into a temporary folder to work from.
//  - All changes happen in the temporary folder, and mirror the changes in the tar.gz.
//  - This way it maintains the performance of working on uncompressed files.
//  - Probably no need to use high compression. Maybe just 3 or 4? Need it to stay quick.

const registerHandlers = () => {
	loadFontsListener();
	saveSingleDocumentListener();
	readSingleDocumentListener();
	saveProjectListener();
};

// Loading a list of system fonts
const loadFontsListener = () => {
	ipcMain.handle('load-font-list', async (e) => {
		try {
			const fonts = await fontList.getFonts();
			return fonts;
		} catch (err) {
			console.log('Error fetching updated font list:');
			console.log(err);
			return [];
		}
	});
	console.log('load-font-list handler registered.');
};

// Save a document, creating a new one if necessary
const saveSingleDocumentListener = () => {
	ipcMain.handle(
		'save-single-document',
		(e, projectTempPath, projectJotsPath, fileName, fileContents) => {
			// File path to the Documents folder, combined with the folders and file name
			const filePath = path.join(projectTempPath, fileName);

			// Convert to JSON, then write to file
			let dataToWrite = JSON.stringify(fileContents);
			fs.writeFileSync(filePath, dataToWrite);

			// If we already have a .jots file, update it (after a delay)
			if (projectJotsPath) {
				// If we already have a timeout for saving the same file, reset.
				if (
					lastSaveTimeout.timeout &&
					lastSaveTimeout.projectJotsPath === projectJotsPath &&
					lastSaveTimeout.projectTempPath === projectTempPath
				) {
					clearTimeout(lastSaveTimeout.timeout);
				}

				// Update the .jots file after a delay.
				let newTimeout = setTimeout(() => {
					console.time('Updating .jots');
					// An array of all project files to add to the tar
					let projectFilesToAdd = fs.readdirSync(projectTempPath);

					// Creates the bundled project from the temp files
					tar.create(
						{
							gzip: { level: 1 }, // Disabled: 4096b, 1: 540b, 3: 524b, 9: 475b
							file: projectJotsPath, // output file path & name
							cwd: projectTempPath, // Directory paths are relative from: inside our temp folder
							// sync: true, // ASYNC so that it doesn't block the main process
						},
						[...projectFilesToAdd], // Relative to the cwd path
						() => {
							// sync, so no callback
							console.timeEnd('Updating .jots');
						}
					);

					// Reset the timeout tracker if another project hasn't been called
					if (
						lastSaveTimeout.timeout &&
						lastSaveTimeout.projectJotsPath === projectJotsPath &&
						lastSaveTimeout.projectTempPath === projectTempPath
					) {
						lastSaveTimeout = { timeout: null, projectTempPath: '', projectJotsPath: '' };
					}

					// Waits 10 seconds to prevent constant resaves when switching files
				}, 10 * 1000);

				// Update the last timeout so we can cancel it if we need to
				lastSaveTimeout = { timeout: newTimeout, projectTempPath, projectJotsPath };
			}

			// We'll asyncronously save to the .jots file too if we have a jotsPath
			// If jotsPath is blank, we won't. Assume working on default project.

			return {
				created: true,
				// alreadyExists: false,
				fileName: fileName,
			};
			// }
		}
	);
};

// Read a single file
const readSingleDocumentListener = () => {
	ipcMain.handle('read-single-document', (e, projectTempPath, fileName) => {
		// File path to the Documents folder, combined with the folders and file name
		const filePath = path.join(projectTempPath, fileName);

		console.log('reading from: ', filePath);

		// If it exists, read the file
		if (fs.existsSync(filePath)) {
			// Convert to JSON, then write to file
			let rawData = fs.readFileSync(filePath);
			let fileContents = JSON.parse(rawData);
			return {
				alreadyExists: true,
				fileName: fileName,
				fileContents: fileContents,
			};
		} else {
			// File doesn't exist!
			return {
				alreadyExists: false,
				fileName: fileName,
				fileContents: {},
			};
		}
	});
};

// Update the project .jots file
const saveProjectListener = () => {
	ipcMain.handle('save-project', (e, projectTempPath, projectJotsPath) => {
		if (projectTempPath) {
			console.log('projectJotsPath: ', projectJotsPath);
			let isSaveAs = !projectJotsPath;
			// If we weren't given a jotsPath, prompt the user for a file name
			if (isSaveAs) {
				// Asks the user what project to open
				// projectJotsPath = dialog.showSaveDialogSync(mainWindow, {
				projectJotsPath = dialog.showSaveDialogSync({
					title: 'Save As',
					defaultPath: app.getPath('documents'),
					buttonLabel: 'Save',
					nameFieldLabel: 'Project Name',
					properties: ['showOverwriteConfirmation'],
					filters: [{ name: 'Jotling', extensions: ['jots'] }],
				});
				console.log(projectJotsPath);

				// Exit if no project was selected
				if (projectJotsPath === undefined) {
					console.log('Save was cancelled.');
					return;
				}
			}

			// Appends .jots to the file name if the user didn't
			if (projectJotsPath.slice(-5) !== '.jots') {
				projectJotsPath = projectJotsPath.concat('.jots');
			}
			console.log('Saving project...');
			console.log('jotsPath: ', projectJotsPath);
			console.time('Updating .jots');

			// An array of all project files to add to the tar
			let projectFilesToAdd = fs.readdirSync(projectTempPath);

			// Creates the bundled project from the temp files
			tar.create(
				{
					gzip: { level: 1 }, // Disabled: 4096b, 1: 540b, 3: 524b, 9: 475b
					file: projectJotsPath, // output file path & name
					cwd: projectTempPath, // Directory paths are relative from: inside our temp folder
					sync: true, // ASYNC so that it doesn't block the main process
				},
				[...projectFilesToAdd] // Relative to the cwd path
			);

			console.timeEnd('Updating .jots');
			return {
				tempPath: projectTempPath,
				jotsPath: projectJotsPath,
			};
		}
	});
};

module.exports = { registerHandlers };
