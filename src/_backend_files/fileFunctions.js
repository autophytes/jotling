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
const { Underline, UnderlineType, AlignmentType, ConcreteNumbering, Indent } = require('docx');
const { NoEmitOnErrorsPlugin } = require('webpack');

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
		numbering: {
			config: [
				{
					reference: 'default-numbering',
					levels: [
						{
							level: 0,
							format: 'decimal',
							text: '%1.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 720, hanging: 360 },
								},
							},
						},
						{
							level: 1,
							format: 'lowerLetter',
							text: '%2.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 1440, hanging: 360 },
								},
							},
						},
						{
							level: 2,
							format: 'lowerRoman',
							text: '%3.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 2160, hanging: 360 },
								},
							},
						},
						{
							level: 3,
							format: 'decimal',
							text: '%4.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 2880, hanging: 360 },
								},
							},
						},
						{
							level: 4,
							format: 'lowerLetter',
							text: '%5.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 3600, hanging: 360 },
								},
							},
						},
						{
							level: 5,
							format: 'lowerRoman',
							text: '%6.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 4320, hanging: 360 },
								},
							},
						},
						{
							level: 6,
							format: 'decimal',
							text: '%7.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 5040, hanging: 360 },
								},
							},
						},
						{
							level: 7,
							format: 'lowerLetter',
							text: '%8.',
							alignment: AlignmentType.START,
							suffix: 'none',
							style: {
								paragraph: {
									indent: { left: 5760, hanging: 360 },
								},
							},
						},
					],
				},
			],
		},
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
					case 'UNDERLINE':
						newTextRunObj.underline = {
							type: UnderlineType.SINGLE,
							color: null,
						};
						break;
					default:
				}

				if (style.style.slice(0, 9) === 'TEXTCOLOR') {
					newTextRunObj.color = style.style.slice(-6);
				}
				if (style.style.slice(0, 9) === 'HIGHLIGHT') {
					newTextRunObj.highlight = findNearestHighlightColor(style.style.slice(-6));
				}
			}

			textRuns.push(new docx.TextRun(newTextRunObj));
		});
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
	// "data": { "text-align": "center" }
	// "data": { "text-align": "left" }
	// "data": { "text-align": "right" }
	// "data": { "text-align": "justified" }
	// },

	let paragraph = { children: textRuns };

	// Text Align
	if (block.data.hasOwnProperty('text-align')) {
		paragraph.alignment = AlignmentType[block.data['text-align'].toUpperCase()];
	}

	// Bullet Lists
	if (block.type === 'unordered-list-item') {
		paragraph.bullet = {
			level: block.depth,
		};
	}

	// Numbered Lists
	if (block.type === 'ordered-list-item') {
		paragraph.numbering = {
			reference: 'default-numbering',
			level: block.depth,
		};
	}

	return new docx.Paragraph(paragraph);
};

// Highlight colors availaible for Microsoft Word
const HIGHLIGHT_COLORS = {
	// black: [0, 0, 0],
	// lightGray: [192, 192, 192],
	// darkGray: [128, 128, 128],
	// white: [255, 255, 255],
	blue: [32, 0, 255],
	green: [82, 255, 0],
	darkBlue: [10, 0, 128],
	darkRed: [128, 0, 0],
	darkYellow: [128, 127, 0],
	darkGreen: [37, 128, 0],
	magenta: [245, 0, 255],
	red: [243, 1, 5],
	darkCyan: [40, 128, 128],
	cyan: [89, 255, 254],
	darkMagenta: [128, 0, 128],
	yellow: [253, 255, 0],
};

// Find the closest available Highlight color in Microsoft Word
const findNearestHighlightColor = (hexColor) => {
	// Convert the current highlight color to RGB
	const r = parseInt(hexColor.slice(0, 2), 16);
	const g = parseInt(hexColor.slice(2, 4), 16);
	const b = parseInt(hexColor.slice(-2), 16);

	// Loop through the available highlight colors in Word
	// Calculate the closest color
	let closest = { color: '', distance: Number.MAX_VALUE };
	for (let [color, array] of Object.entries(HIGHLIGHT_COLORS)) {
		// Calculate the Euclidian distance between the colors
		//   weighted: https://web.archive.org/web/20100316195057/http://www.dfanning.com/ip_tips/color2gray.html
		let newDistance = Math.sqrt(
			(r - array[0]) ** 2 + (g - array[1]) ** 2 + (b - array[2]) ** 2
			// ((r - array[0]) * 0.3) ** 2 + ((g - array[1]) * 0.59) ** 2 + ((b - array[2]) * 0.11) ** 2
		);

		// Save if the closest
		if (newDistance < closest.distance) {
			closest = {
				color: color,
				distance: newDistance,
			};
		}
	}

	return closest.color;
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
