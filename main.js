'use strict';

// Import parts of electron to use
require('v8-compile-cache'); // Speeds up boot time
const { app, BrowserWindow, protocol } = require('electron');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const {
	registerHandlers,
	checkShouldQuitApp,
	setIsQuitting,
} = require('./backend_files/ipcListeners');
const { requestSaveAndQuit, openProject } = require('./backend_files/fileFunctions');
const { createWindow } = require('./backend_files/createWindow');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let afterOpenCallback = () => {
	// dialog.showMessageBoxSync({ type: 'info', message: `${process.argv}` });
	// On windows, opens a .jots file if the user opened the app with one.
	for (let arg of process.argv) {
		if (arg.slice(-4) === '.jots') {
			openProject(arg);
			return true;
			// break;
		}
	}
	return false;
};

// Keep a reference for dev mode
let dev = false;

// Broken:
// if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
//   dev = true
// }

if (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === 'development') {
	dev = true;
}

const getMainWindow = () => {
	let allBrowserWindows = BrowserWindow.getAllWindows();
	return allBrowserWindows.length ? allBrowserWindows[0] : null;
};

// Adds a content security policy. To load external web content, this will need to be updated.
// https://www.electronjs.org/docs/tutorial/security#:~:text=A%20Content%20Security%20Policy%20(CSP,website%20you%20load%20inside%20Electron.
//   Tried it, no success. Investigate later. Note, import session from electron.
// session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
// 	callback({
// 		responseHeaders: {
// 			...details.responseHeaders,
// 			'Content-Security-Policy': ["default-src 'none'"],
// 		},
// 	});
// });

// Temporary fix broken high-dpi scale factor on Windows (125% scaling)
// info: https://github.com/electron/electron/issues/9691
if (process.platform === 'win32') {
	app.commandLine.appendSwitch('high-dpi-support', 'true');
	app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

// TEMPORARY
// createNewProject();

// Register after createWindow is defined so it can be imported in registerMenu
const { registerMenu } = require('./backend_files/menu');

// Open a file with Jotling (opening a .jots file)
app.on('open-file', (e, jotsPath) => {
	console.log(`Opening a file with jotling: ${jotsPath}`);

	if (jotsPath) {
		// If the app is already running, open the file
		if (app.isReady()) {
			// Ensures we have a window created and opened to show the project in
			let allBrowserWindows = BrowserWindow.getAllWindows();
			let currentMainWindow = allBrowserWindows.length ? allBrowserWindows[0] : null;

			if (currentMainWindow) {
				// Open the project we were given
				currentMainWindow.show();
				openProject(jotsPath);
			} else {
				mainWindow = createWindow(dev, () => {
					openProject(jotsPath);
					return true;
				});
			}
		} else {
			// If it's not running yet, queue the file to be opened
			afterOpenCallback = () => {
				openProject(jotsPath);
				return true;
			};
		}
	}

	// The user is opening a file with Jotling.
	// See https://www.electronjs.org/docs/api/app#event-open-file-macos
	// Know I also need to handle if it's not a .jots file
	//    Say it's not a supported file type
	//      Maybe check if it is and just has the wrong extension / no extension?
	//    Open Jotling with a default project
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	// Set up local file handling
	protocol.registerFileProtocol('file', (request, callback) => {
		console.log('request:', request);
		console.log('request.url:', request.url);
		let pathname = request.url.replace('file:///', '');
		callback(pathname);
	});

	// TEMPORARY - Generates and opens a Between Worlds project
	if (dev && process.platform === 'darwin') {
		let docsPath = app.getPath('documents');
		let origFilePath = path.join(docsPath, 'Between Worlds - Template.jots');
		let destFilePath = path.join(docsPath, `Between Worlds - Development.jots`);

		if (fs.existsSync(origFilePath)) {
			fs.copyFile(origFilePath, destFilePath, (err) => {
				if (err) throw err;
				console.log('Created a new Between Worlds test project.');
			});

			afterOpenCallback = () => {
				openProject(destFilePath);
				return true;
			};
		}
	}

	mainWindow = createWindow(dev, afterOpenCallback);

	// Register Handlers
	registerHandlers();

	// Build the application Menu
	registerMenu();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}

	// Reregister the menu now that the mainWindow is closed. Bump to end of stack.
	setTimeout(() => {
		registerMenu();
	}, 0);
});

// When a new window is created, refreshes the menu
app.on('browser-window-created', () => {
	// Reregister the menu now that a new window is open
	registerMenu();
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (getMainWindow() === null) {
		mainWindow = createWindow(dev);
		// No need to re-register handlers
	}
});

app.on('before-quit', (e) => {
	console.log('Is quitting!');
	// If we haven't done our pre-quit routine
	if (checkShouldQuitApp() === false) {
		// Prevent the app from quitting
		e.preventDefault();
		// Flag we're quitting (so the window close isn't prevented)
		setIsQuitting(true);
		// Request a project save
		requestSaveAndQuit();
	}
});
