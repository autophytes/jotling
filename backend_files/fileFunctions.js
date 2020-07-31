const { app, dialog, remote } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ncp = require('ncp').ncp;
const tar = require('tar');

// Creates a temp folder and extracts a project to that folder
const extractProjToTempFolder = async (projectPath) => {
	// Create the temp folder path
	let projectFolderName = 'jotling-' + uuidv4();
	let projectTempDirectory = path.join(
		app.getPath('temp'),
		'JotlingProjectFiles',
		projectFolderName
	);

	// Ensures the JotlingProjectFiles folder exists
	if (!fs.existsSync(path.join(app.getPath('temp'), 'JotlingProjectFiles'))) {
		fs.mkdirSync(path.join(app.getPath('temp'), 'JotlingProjectFiles'));
	}

	// Create the temp folder we'll be working out of
	fs.mkdirSync(projectTempDirectory);

	// Extracts the bundled project to a temp folder
	tar.extract(
		{
			file: projectPath, // The file to extract
			cwd: projectTempDirectory, // Where to extract to
			sync: true,
		},
		[] // Files to extract from the tar. Blank extracts all.
	);

	// Return the temp folder that contains the project files
	return projectTempDirectory;
};

const openProject = async (mainWindow, projectPath) => {
	if (!projectPath) {
		// Asks the user what project to open
		projectPath = dialog.showOpenDialogSync(mainWindow, {
			title: 'Open Project',
			defaultPath: app.getPath('documents'),
			buttonLabel: 'Open',
			nameFieldLabel: 'Project Name',
			filters: [{ name: 'Jotling', extensions: ['jots'] }],
		});

		// Exit if no project was selected
		if (projectPath === undefined || !projectPath[0]) {
			return;
		}

		// The open dialog returns an array with a single string, and we just want the string
		projectPath = projectPath[0];
	}

	// Exit if either the function argument or open dialog didn't give us a string path
	if (typeof projectPath !== 'string') {
		return;
	}

	// Extract the project to the temp working directory
	let projectTempPath = await extractProjToTempFolder(projectPath);
	console.log('Project extracted to: ', projectTempPath);

	mainWindow.webContents.send('open-project', {
		tempPath: projectTempPath,
		jotsPath: projectPath,
	});
};

const createNewProject = async (mainWindow) => {
	let projectFolderName = 'jotling-' + uuidv4();
	let projectTempDirectory = path.join(
		app.getPath('temp'),
		'JotlingProjectFiles',
		projectFolderName
	);
	let defaultProjectFiles = path.resolve(__dirname, '../backend_files/defaultProjectFiles');

	// Ensures the JotlingProjectFiles folder exists
	if (!fs.existsSync(path.join(app.getPath('temp'), 'JotlingProjectFiles'))) {
		fs.mkdirSync(path.join(app.getPath('temp'), 'JotlingProjectFiles'));
	}

	// console.log(app.getPath('temp'));

	// Copies the default files to the project's temporary folder
	ncp(defaultProjectFiles, projectTempDirectory, function (err) {
		if (err) {
			return console.error(err);
		}

		// Asks the user where to save the file, what to name it
		let projectFilePath = dialog.showSaveDialogSync(mainWindow, {
			title: 'Create New Project',
			defaultPath: app.getPath('documents'),
			buttonLabel: 'Create',
			nameFieldLabel: 'New Project Name',
			properties: ['showOverwriteConfirmation'],
			filters: [{ name: 'Jotling', extensions: ['jots'] }],
		});

		// If the user cancelled the dialog, exit
		if (projectFilePath === undefined) {
			return;
		}

		// Appends .jots to the file name if the user didn't
		if (projectFilePath.slice(-5) !== '.jots') {
			projectFilePath = projectFilePath.concat('.jots');
		}

		// An array of all project files to add to the tar
		let projectFilesToAdd = fs.readdirSync(projectTempDirectory);

		// Creates the bundled project from the temp files
		tar.create(
			{
				gzip: { level: 1 }, // Disabled: 4096b, 1: 540b, 3: 524b, 9: 475b
				file: projectFilePath, // output file path & name
				cwd: projectTempDirectory, // Directory paths are relative from: inside our temp folder
				sync: true,
			},
			[...projectFilesToAdd] // Relative to the cwd path
			// () => { // sync, so no callback
			// 	console.log('Finished creating the new tarball!');
			// }
		);

		console.log('Copied the new folder!');
		openProject(mainWindow, projectFilePath);
	});

	// Next, need to open the project that I just created
	// Then migrate all of our work to the temporary folder, and mirror saves in the .jots file

	// To do this, I think we just call the openProject function

	// Then need to clean up the temporary folder we created, because we're about to
	//   create a new one. For  new projects, should be almost instant. No reason to
	//   complicate it.
};

// On startup, create a temporary project that we can start working in immediately.
//     Also cleans out the temp folder if other files are still in there.
const createTempProjectOnStartup = async (mainWindow) => {
	let projectFolderName = 'jotling-' + uuidv4();
	let projectTempDirectory = path.join(
		app.getPath('temp'),
		'JotlingProjectFiles',
		projectFolderName
	);
	let defaultProjectFiles = path.resolve(__dirname, '../backend_files/defaultProjectFiles');

	// Ensures the JotlingProjectFiles folder exists
	let jotlingTempFolderPath = path.join(app.getPath('temp'), 'JotlingProjectFiles');
	if (!fs.existsSync(jotlingTempFolderPath)) {
		fs.mkdirSync(jotlingTempFolderPath);
	}

	// Copies the default files to the project's temporary folder
	ncp(defaultProjectFiles, projectTempDirectory, function (err) {
		if (err) {
			return console.error(err);
		}

		mainWindow.webContents.send('open-project', {
			tempPath: projectTempDirectory,
			jotsPath: '',
		});

		// If no other Jotling instances open, clean out the temporary folder
		const isOnlyJotlingInstance = app.requestSingleInstanceLock();
		app.releaseSingleInstanceLock();
		if (isOnlyJotlingInstance) {
			let allFilesInTempFolder = fs.readdirSync(jotlingTempFolderPath);
			// Loop through all files in the temp folder
			for (let fileName of allFilesInTempFolder) {
				// If they're a jotling- folder and not our current folder, delete them.
				if (fileName !== projectFolderName && fileName.slice(0, 8) === 'jotling-') {
					fs.rmdir(path.join(jotlingTempFolderPath, fileName), { recursive: true }, (err) => {
						if (err) {
							console.warn(err);
						} else {
							console.log(`Deleted ${fileName} from JotlingProjectFiles in temp folder.`);
						}
					});
				}
			}
		}
	});
};

// Requests the React app initiates a file save
const requestSaveProject = async (mainWindow) => {
	mainWindow.webContents.send('request-save-project', true);
};

// Requests the React app initiates a file save with a blank projectJotsPath
const requestSaveAsProject = async (mainWindow) => {
	mainWindow.webContents.send('request-save-as-project', true);
};

// When implementing the main Save function (in the menu), if no jotsPath, it's a saveas

// const openFolder = async (mainWindow) => {
// 	let directory = await dialog.showOpenDialog(mainWindow, {
// 		properties: ['openDirectory'],
// 	});
// 	console.log('dir selected: ', directory);
// 	mainWindow.webContents.send('open-project', directory);
// };

module.exports = {
	createNewProject,
	openProject,
	createTempProjectOnStartup,
	requestSaveProject,
	requestSaveAsProject,
};
