'use strict';

// Import parts of electron to use
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
// const fontList = require('font-list');

const { registerHandlers } = require('./backend_files/ipcListeners');
const { registerMenu } = require('./backend_files/menu');
const {
	createNewProject,
	createTempProjectOnStartup,
} = require('./backend_files/fileFunctions');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Keep a reference for dev mode
let dev = false;

// Broken:
// if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
//   dev = true
// }

if (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === 'development') {
	dev = true;
}

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

// Register Handlers
registerHandlers();

// TEMPORARY
// createNewProject();

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		title: 'Jotling',
		width: 1024,
		height: 768,
		show: false,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	// Build the application Menu
	registerMenu(dev, mainWindow);

	// Prevents the title bar flicker from 'Webpack App' to 'Jotling'
	mainWindow.on('page-title-updated', function (e) {
		e.preventDefault();
	});

	// and load the index.html of the app.
	let indexPath;

	if (dev && process.argv.indexOf('--noDevServer') === -1) {
		indexPath = url.format({
			protocol: 'http:',
			host: 'localhost:8080',
			pathname: 'index.html',
			slashes: true,
		});
	} else {
		indexPath = url.format({
			protocol: 'file:',
			pathname: path.join(__dirname, 'dist', 'index.html'),
			slashes: true,
		});
	}

	mainWindow.loadURL(indexPath);

	// Don't show until we are ready and loaded
	mainWindow.once('ready-to-show', async () => {
		mainWindow.maximize();
		mainWindow.show();

		// Open the DevTools automatically if developing
		if (dev) {
			const {
				default: installExtension,
				REACT_DEVELOPER_TOOLS,
			} = require('electron-devtools-installer');

			installExtension(REACT_DEVELOPER_TOOLS).catch((err) =>
				console.log('Error loading React DevTools: ', err)
			);

			// RE-ENABLE to automatically open the devtools
			// mainWindow.webContents.openDevTools();
		}

		// Load the default project files
		createTempProjectOnStartup(mainWindow);

		// Load the project files
		// WHEN I GET BACK:
		// - Load the initial files (look at app.getPath)
		// - Display the default file
		// - List all loaded files in the left bar
		// - Switch files when I click on different ones
		// - Save changes to files
		// - Create an index of files for each project with metadata
		//    - Perhaps a json object with nested children files to establish the tree
		//    - Title, file name (projectId - 001.txt or whatever it is), add other metadata later
	});

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});
