const { ipcMain, app, dialog, BrowserWindow } = require('electron');
const fontList = require('font-list');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const { createNewProject, openProject } = require('./fileFunctions');
// const { getCurrentMainWindow } = require('../main');
// const { setShouldCloseMainWindow, setShouldQuitApp } = require('../main');

var lastSaveTimeout = { timeout: null, projectTempPath: '', projectJotsPath: '' };

// Global variables for confirming we've done our close/quit routines
var shouldCloseMainWindow = false;
var shouldQuitApp = false;
var isQuitting = false;

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

// Utility function
const getMainWindow = () => {
	let allBrowserWindows = BrowserWindow.getAllWindows();
	return allBrowserWindows.length ? allBrowserWindows[0] : null;
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
	// console.log('load-font-list handler registered.');
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
					console.time(`Updating ${fileName} in ${projectJotsPath}`);
					// An array of all project files to add to the tar

					// Makes sure the temp folder hasn't been cleaned up before saving.
					// We always save the project before folder cleanup.
					let folderExists = fs.existsSync(projectTempPath);
					if (folderExists) {
						try {
							let projectFilesToAdd = fs.readdirSync(projectTempPath);

							// Creates the bundled project from the temp files
							tar.create(
								{
									gzip: { level: 1 },
									// Decided on gzip level 1. Saves 80% of text size.
									// Saving 88kb of text took ~20ms
									// Saving 70mb of songs took ~2,000ms
									// Saving 1.6gb photos took ~43,000ms
									file: projectJotsPath, // output file path & name
									cwd: projectTempPath, // Directory paths are relative from: inside our temp folder
									// sync: true, // ASYNC so that it doesn't block the main process
								},
								[...projectFilesToAdd], // Relative to the cwd path
								() => {
									// sync, so no callback
									console.timeEnd(`Updating ${fileName} in ${projectJotsPath}`);
								}
							);
						} catch (err) {
							console.log(
								'Error updating the .jots from the temp folder in the timeout save.'
							);
							console.log(err);
						}
					}

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

// Update the project .jots file. Quit the app after if requested.
const saveProjectListener = () => {
	ipcMain.handle('save-project', (e, projectTempPath, projectJotsPath, options = {}) => {
		let {
			shouldQuit,
			shouldClose,
			shouldCreateNew,
			shouldOpen,
			openJotsPath,
			saveAs,
		} = options;
		let mainWindow = getMainWindow();

		if (projectTempPath) {
			console.log('projectJotsPath: ', projectJotsPath);

			let saveBefore = 1; // 0 means save, 1 means don't save
			if (!projectJotsPath && !saveAs) {
				// Tweak the dialog text based on the action we're performing
				let saveBeforeText = 'quitting';
				shouldCreateNew && (saveBeforeText = 'creating a new project');
				shouldOpen && (saveBeforeText = 'opening a new project');

				saveBefore = dialog.showMessageBoxSync({
					type: 'warning',
					message: `Your current project isn't saved. Would you like to save before ${saveBeforeText}?`,
					title: `Save before ${saveBeforeText}?`,
					buttons: [`Don't Save`, `Save`],
					defaultId: 1,
				});
			}

			// If we weren't given a jotsPath, prompt the user for a file name
			while (!projectJotsPath && saveBefore === 1) {
				// Asks the user what project to open
				projectJotsPath = dialog.showSaveDialogSync(mainWindow, {
					// projectJotsPath = dialog.showSaveDialogSync({
					title: 'Save As',
					defaultPath: app.getPath('documents'),
					buttonLabel: 'Save',
					nameFieldLabel: 'Project Name',
					properties: ['showOverwriteConfirmation'],
					filters: [{ name: 'Jotling', extensions: ['jots'] }],
				});
				console.log(projectJotsPath);

				// No save directory was chosen
				if (
					projectJotsPath === undefined &&
					(shouldQuit || shouldClose || shouldCreateNew || shouldOpen)
				) {
					// Tweak the dialog text based on the action we're performing
					let dialogText = 'Quit';
					shouldCreateNew && (dialogText = 'Create');
					shouldOpen && (dialogText = 'Open');

					// Confirm quit without saving
					let confirmQuit = dialog.showMessageBoxSync({
						type: 'warning',
						message: `Are you sure you want to ${dialogText} without saving?`,
						title: `${dialogText} without saving?`,
						buttons: ['Save', `${dialogText} Without Saving`, `Don't ${dialogText}`],
						defaultId: 0,
					});
					console.log('confirmQuit: ', confirmQuit);
					// Aborting the quit/close
					if (confirmQuit === 2) {
						isQuitting = false;
						return;
					}
					// If 'Quit Without Saving', quit the app,
					if (confirmQuit === 1 && shouldQuit) {
						console.log('Quitting without saving.');
						shouldQuitApp = true;
						app.quit();
						return;
					}
					if (confirmQuit === 1 && shouldClose) {
						console.log('Closing without saving.');
						shouldCloseMainWindow = true;
						// Prevent the timeout save
						if (lastSaveTimeout.timeout) {
							clearTimeout(lastSaveTimeout.timeout);
						}
						mainWindow.close();
						return;
					}
					if (confirmQuit === 1 && (shouldCreateNew || shouldOpen)) {
						return;
					}
					// Cancel the save
				} else if (projectJotsPath === undefined) {
					console.log('Save was cancelled.');
					return;
				}
			}

			// If saving:
			if (saveBefore === 1) {
				// Appends .jots to the file name if the user didn't
				if (projectJotsPath.slice(-5) !== '.jots') {
					projectJotsPath = projectJotsPath.concat('.jots');
				}
				// console.log('Saving project...');
				// console.log('jotsPath: ', projectJotsPath);
				console.time(`Updating ${projectJotsPath}`);

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

				console.timeEnd(`Updating ${projectJotsPath}`);
			}

			// If this was a save and quit, quit the app
			if (shouldQuit) {
				console.log('Quitting after saving.');
				shouldQuitApp = true;
				app.quit();
			}

			// If this was save and close, close the mainWindow
			if (shouldClose) {
				console.log('Closing window after saving.');
				shouldCloseMainWindow = true;
				// Prevent the timeout save
				if (lastSaveTimeout.timeout) {
					clearTimeout(lastSaveTimeout.timeout);
				}
				mainWindow.close();
			}

			if (shouldCreateNew) {
				createNewProject();
			}

			if (shouldOpen) {
				openProject(openJotsPath);
			}

			return {
				tempPath: projectTempPath,
				jotsPath: projectJotsPath,
			};
		}
	});
};

const checkShouldCloseMainWindow = () => {
	return shouldCloseMainWindow;
};

const setShouldCloseMainWindow = (shouldClose) => {
	shouldCloseMainWindow = shouldClose;
};

const checkShouldQuitApp = () => {
	return shouldQuitApp;
};

const setIsQuitting = (shouldQuit) => {
	isQuitting = shouldQuit;
};

const checkIsQuitting = () => {
	return isQuitting;
};

module.exports = {
	registerHandlers,
	checkShouldCloseMainWindow,
	setShouldCloseMainWindow,
	checkShouldQuitApp,
	setIsQuitting,
	checkIsQuitting,
};
