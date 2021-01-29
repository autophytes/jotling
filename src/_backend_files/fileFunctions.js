const { app, dialog, remote, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
// const ncp = require('ncp').ncp;
const tar = require('tar');
const Store = require('electron-store');
const store = new Store();
const docx = require('docx');

const {
	docStructureTemplate,
	linkStructureTemplate,
	mediaStructureTemplate,
} = require('./structureTemplates');
const { Underline, UnderlineType } = require('docx');

// Create a new blank project
const createNewProjectStructure = (projectTempDirectory) => {
	if (!fs.existsSync(projectTempDirectory)) {
		fs.mkdirSync(projectTempDirectory);
	}

	fs.mkdirSync(path.join(projectTempDirectory, 'docs'));
	fs.mkdirSync(path.join(projectTempDirectory, 'media'));

	let newDocStructure = JSON.stringify(docStructureTemplate);
	fs.writeFileSync(path.join(projectTempDirectory, 'documentStructure.json'), newDocStructure);

	let newLinkStructure = JSON.stringify(linkStructureTemplate);
	fs.writeFileSync(path.join(projectTempDirectory, 'linkStructure.json'), newLinkStructure);

	let newMediaStructure = JSON.stringify(mediaStructureTemplate);
	fs.writeFileSync(path.join(projectTempDirectory, 'mediaStructure.json'), newMediaStructure);
};

// Creates a temp folder and extracts a project to that folder
const extractProjToTempFolder = async (projectPath) => {
	// Create the temp folder path
	let projectFolderName = 'jotling-' + uuidv4();
	let projectTempFolderDirectory = path.join(
		app.getPath('temp'),
		'JotlingProjectFiles',
		projectFolderName
	);

	// Ensures the JotlingProjectFiles folder exists
	if (!fs.existsSync(path.join(app.getPath('temp'), 'JotlingProjectFiles'))) {
		fs.mkdirSync(path.join(app.getPath('temp'), 'JotlingProjectFiles'));
	}

	// Create the temp folder we'll be working out of
	fs.mkdirSync(projectTempFolderDirectory);

	// Extracts the bundled project to a temp folder
	tar.extract(
		{
			file: projectPath, // The file to extract
			cwd: projectTempFolderDirectory, // Where to extract to
			sync: true,
		},
		[] // Files to extract from the tar. Blank extracts all.
	);

	// Return the temp folder that contains the project files
	return { projectFolderName, projectTempFolderDirectory };
};

const getMainWindow = () => {
	let allBrowserWindows = BrowserWindow.getAllWindows();
	return allBrowserWindows.length ? allBrowserWindows[0] : null;
};

// Removes old temp folders that aren't our current project.
// REQUIRES the name of the current project temporary folder.
// Currently using removeOldTempFilesSync on close/quit in saveProjectListener
const removeOldTempFiles = async (projectFolderName) => {
	// If no other Jotling instances open, clean out the temporary folder
	const isOnlyJotlingInstance = app.requestSingleInstanceLock();
	app.releaseSingleInstanceLock();
	if (isOnlyJotlingInstance && projectFolderName) {
		let jotlingTempFolderPath = path.join(app.getPath('temp'), 'JotlingProjectFiles');

		let allFilesInTempFolder = fs.readdirSync(jotlingTempFolderPath);
		// Loop through all files in the temp folder
		for (let fileName of allFilesInTempFolder) {
			// If they're a jotling- folder and not our current folder, delete them.
			if (fileName !== projectFolderName && fileName.slice(0, 8) === 'jotling-') {
				try {
					fs.rmdir(path.join(jotlingTempFolderPath, fileName), { recursive: true }, (err) => {
						if (err) {
							console.warn(err);
						} else {
							console.log(`Deleted ${fileName} from JotlingProjectFiles in temp folder.`);
						}
					});
				} catch (err) {
					console.log(err);
					console.log(`Error deleting ${fileName}.`);
				}
			}
		}
	}
};

// Removes old temp folders that aren't our current project.
const removeOldTempFilesSync = (projectFolderName) => {
	// If no other Jotling instances open, clean out the temporary folder
	const isOnlyJotlingInstance = app.requestSingleInstanceLock();
	app.releaseSingleInstanceLock();
	if (isOnlyJotlingInstance) {
		let jotlingTempFolderPath = path.join(app.getPath('temp'), 'JotlingProjectFiles');

		let allFilesInTempFolder = fs.readdirSync(jotlingTempFolderPath);
		// Loop through all files in the temp folder
		for (let fileName of allFilesInTempFolder) {
			// If they're a jotling- folder and not our current folder, delete them.
			if (fileName !== projectFolderName && fileName.slice(0, 8) === 'jotling-') {
				try {
					fs.rmdirSync(
						path.join(jotlingTempFolderPath, fileName),
						{ recursive: true },
						(err) => {
							if (err) {
								console.warn(err);
							} else {
								console.log(`Deleted ${fileName} from JotlingProjectFiles in temp folder.`);
							}
						}
					);
				} catch (err) {
					console.log(err);
					console.log(`Error deleting ${fileName}.`);
				}
			}
		}
	}
};

// Adds the new project to the recent projects list in the persistent config store
const updateRecentProjects = async (projectJotsPath) => {
	// Retrieve the current recent projects
	let recentProjects = store.get('recent-projects');
	if (!recentProjects) {
		recentProjects = [];
	}

	// Find and delete the projects current location in the array
	let newProjectIndex = recentProjects.indexOf(projectJotsPath);
	if (newProjectIndex !== -1) {
		recentProjects.splice(newProjectIndex, 1);
	}

	// Push the project to the front
	recentProjects.unshift(projectJotsPath);

	// Update the permanent configuration
	store.set('recent-projects', recentProjects);

	// Update the menu after the recent projects list has been refreshed
	const { registerMenu } = require('./menu');
	registerMenu();
};

// Removes the projects from the recent projects list and refreshes the menu
const removeFromRecentProjects = (projectJotsPath) => {
	// Retrieve the current recent projects
	let recentProjects = store.get('recent-projects');
	if (!recentProjects) {
		recentProjects = [];
	}

	// Find and delete the projects current location in the array
	let newProjectIndex = recentProjects.indexOf(projectJotsPath);
	if (newProjectIndex !== -1) {
		recentProjects.splice(newProjectIndex, 1);
	}

	// Update the permanent configuration
	store.set('recent-projects', recentProjects);

	// Update the menu after the recent projects list has been refreshed
	const { registerMenu } = require('./menu');
	registerMenu();

	// Return the name of the .jots file that was removed
	let lastSlash = projectJotsPath.lastIndexOf('/');
	return projectJotsPath.slice(lastSlash + 1);
};

const openProject = async (projectPath) => {
	let mainWindow = getMainWindow();

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

	let projectExists = fs.existsSync(projectPath);
	let projectFolderName, projectTempFolderDirectory;
	if (projectExists) {
		// Extract the project to the temp working directory
		({ projectFolderName, projectTempFolderDirectory } = await extractProjToTempFolder(
			projectPath
		));

		console.log(projectTempFolderDirectory);

		// Send the new directories to React
		mainWindow.webContents.send('open-project', {
			tempPath: projectTempFolderDirectory,
			jotsPath: projectPath,
		});

		// Updates the recent project list and refreshes the file menu
		updateRecentProjects(projectPath);

		// Removes old temp folders that aren't for the current project
		console.log('projectFolderName in openProject: ', projectFolderName);
		if (projectFolderName) {
			// removeOldTempFiles(projectFolderName);
			// ^^^ Currently removing temp files on quit instead
		}
	} else {
		// Remove the project from the recent projects in the menu
		let projectRemoved = removeFromRecentProjects(projectPath);
		dialog.showMessageBox({
			title: 'Project Not Found',
			type: 'warning',
			message: `The project ${projectRemoved} could not be found.`,
		});
	}
};

const createNewProject = async () => {
	let mainWindow = getMainWindow();

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

	// // Copies the default files to the project's temporary folder
	// ncp(defaultProjectFiles, projectTempDirectory, function (err) {
	// 	if (err) {
	// 		return console.error(err);
	// 	}
	createNewProjectStructure(projectTempDirectory);

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

	// Removes old temp folders that aren't for the current project
	// removeOldTempFiles(projectFolderName);
	// ^^^ Currently removing temp files on quit instead

	// openProject(projectFilePath);

	mainWindow.webContents.send('open-project', {
		tempPath: projectTempDirectory,
		jotsPath: projectFilePath,
	});
	// });

	// Next, need to open the project that I just created
	// Then migrate all of our work to the temporary folder, and mirror saves in the .jots file

	// To do this, I think we just call the openProject function

	// Then need to clean up the temporary folder we created, because we're about to
	//   create a new one. For  new projects, should be almost instant. No reason to
	//   complicate it.
};

// On startup, create a temporary project that we can start working in immediately.
//     Also cleans out the temp folder if other files are still in there.
const createTempProjectOnStartup = () => {
	let mainWindow = getMainWindow();
	let projectFolderName = 'jotling-' + uuidv4();
	let projectTempDirectory = path.join(
		app.getPath('temp'),
		'JotlingProjectFiles',
		projectFolderName
	);
	let defaultProjectFiles = path.resolve(__dirname, '../backend_files/defaultProjectFiles');

	// Ensures the JotlingProjectFiles folder exists
	let jotlingTempFolderPath = path.join(app.getPath('temp'), 'JotlingProjectFiles');
	console.log(jotlingTempFolderPath);
	if (!fs.existsSync(jotlingTempFolderPath)) {
		fs.mkdirSync(jotlingTempFolderPath);
	}

	// // Copies the default files to the project's temporary folder
	// ncp(defaultProjectFiles, projectTempDirectory, function (err) {
	// 	if (err) {
	// 		return console.error(err);
	// 	}
	createNewProjectStructure(projectTempDirectory);

	mainWindow.webContents.send('open-project', {
		tempPath: projectTempDirectory,
		jotsPath: '',
	});

	// Removes old temp folders that aren't for the current project
	// removeOldTempFiles(projectFolderName);
	// ^^^ Currently removing temp files on quit instead
	// });
};

// Requests the React app initiates a file save
const requestSaveProject = async () => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('request-save-project', true);
};

// Requests the React app initiates a file save with a blank projectJotsPath
const requestSaveAsProject = async () => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('request-save-as-project', true);
};

// Requests the react app initiates a save and quit, sending projectJotsPath and projectTempPath
const requestSaveAndQuit = async () => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('request-save-and-quit', true);
};

// Requests the react app initiates a save and close window, sending projectJotsPath and projectTempPath
const requestSaveAndClose = async () => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('request-save-and-close', true);
};

const requestSaveAndCreateNew = async () => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('request-save-and-create-new', true);
};

const requestSaveAndOpen = async (openJotsPath) => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('request-save-and-open', true, openJotsPath);
};

const requestShowFindReplace = async ({ replace, wholeProject }) => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('show-find-replace', { replace, wholeProject });
};

const requestInsertLink = async () => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('insert-link');
};

const requestExport = async (extension) => {
	let mainWindow = getMainWindow();
	mainWindow.webContents.send('request-export-project', { extension });
};

// Generate a docx with the
const exportDocument = ({ pathName, docName, docObj }) => {
	let childArray = [];

	for (let block of docObj.blocks) {
		childArray.push(genDocxParagraph(block));
	}

	const doc = new docx.Document({
		styles: {
			paragraphStyles: [
				{
					// Only `name` prop required, `id` not necessary
					name: 'Normal',
					run: {
						font: 'Calibri',
						size: 24,
					},
					paragraph: {
						spacing: {
							after: 120,
						},
					},
				},
			],
		},
	});

	doc.addSection({
		properties: {},
		children: childArray,
	});

	docx.Packer.toBuffer(doc).then((buffer) => {
		fs.writeFileSync(path.join(pathName, docName), buffer);
	});
};

const genDocxParagraph = (block) => {
	// Add IDs to the style ranges
	const inlineStyleRanges = block.inlineStyleRanges.map((item, i) => ({
		...item,
		id: i,
	}));

	let textRuns = [];
	if (inlineStyleRanges.length) {
		let breakpoints = [0, block.text.length];

		inlineStyleRanges.forEach((item) => {
			breakpoints.push(item.offset);
			breakpoints.push(item.offset + item.length);
		});

		breakpoints = [...new Set(breakpoints)];
		breakpoints.sort((a, b) => a - b);

		breakpoints.forEach((index, i) => {
			// No textRun for the last breapoint
			if (i === breakpoints.length - 1) {
				return;
			}

			let newStyles = inlineStyleRanges.filter(
				(item) => item.offset <= index && item.offset + item.length > index
			);

			let newTextRunObj = {
				text: block.text.slice(index, breakpoints[i + 1]),
			};
			for (let style of newStyles) {
				switch (style.style) {
					case 'BOLD':
						newTextRunObj.bold = true;
						break;
					case 'ITALIC':
						newTextRunObj.italics = true;
						break;
					case 'STRIKETHROUGH':
						newTextRunObj.strike = true;
						break;
					case 'SUBSCRIPT':
						newTextRunObj.subScript = true;
						break;
					case 'SUPERSCRIPT':
						newTextRunObj.superScript = true;
						break;
					// case 'UNDERLINE':
					// 	newTextRunObj.underline = {
					// 		type: UnderlineType.SINGLE,
					// 		color: null,
					// 	};
					// 	break;
					default:
				}

				if (style.style.slice(0, 9) === 'TEXTCOLOR') {
					newTextRunObj.color = style.style.slice(-6);
				}
				if (style.style.slice(0, 9) === 'HIGHLIGHT') {
					newTextRunObj.highlight = style.style.slice(-6);
				}
			}

			textRuns.push(new docx.TextRun(newTextRunObj));
		});

		console.log('breakpoints:', breakpoints);

		// }
	} else {
		textRuns.push(new docx.TextRun(block.text));
	}

	// {
	//   "key": "7rgf7",
	//   "text": "Kripper hobbled alongside the mammoth obelisk as he watched his workers shimmy a new log in front of the stone, inching it closer to it’s final resting place. The other stones had been a challenge, but this one – this one had almost done them in. They had been forced to widen two separate tunnels just to roll the stone through, and he was relieved it was now in the cavern.",
	//   "type": "unstyled",
	//   "depth": 0,
	//   "inlineStyleRanges": [
	//     { "offset": 0, "length": 18, "style": "FUN"},
	//     { "offset": 16, "length": 16, "style": "BOLD" },
	//     { "offset": 23, "length": 13, "style": "HIGHLIGHT-#fdffb6" },
	//     { "offset": 45, "length": 28, "style": "BOLD" },
	//     { "offset": 102, "length": 104, "style": "STRIKETHROUGH" },
	//     { "offset": 218, "length": 3, "style": "TEXTCOLOR-#660200" },
	//     { "offset": 234, "length": 12, "style": "SUPERSCRIPT" }
	//   ],
	//   "entityRanges": [],
	//   "data": {}
	// },

	return new docx.Paragraph({ children: textRuns });
};

module.exports = {
	createNewProject,
	openProject,
	createTempProjectOnStartup,
	requestSaveProject,
	requestSaveAsProject,
	requestSaveAndQuit,
	requestSaveAndClose,
	requestSaveAndCreateNew,
	requestSaveAndOpen,
	removeOldTempFilesSync,
	requestShowFindReplace,
	requestInsertLink,
	updateRecentProjects,
	requestExport,
	exportDocument,
};
