const { BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

const {
	checkShouldCloseMainWindow,
	setShouldCloseMainWindow,
	checkIsQuitting,
} = require('../backend_files/ipcListeners');
const { requestSaveAndClose } = require('../backend_files/fileFunctions');

function createWindow(dev, callbackFunction) {
	// Create the browser window.
	let mainWindow = new BrowserWindow({
		title: 'Jotling',
		width: 1024,
		height: 768,
		show: false,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	// Prevents the title bar flicker from 'Webpack App' to 'Jotling'
	//   Update: also prevents me from updating the title bar with the document name
	// mainWindow.on('page-title-updated', function (e) {
	// 	e.preventDefault();
	// });

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
			pathname: path.join(__dirname, '../build', 'index.html'),
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
			// THERE IS AN ISSUE WITH THIS FOR NOW, and opening/closing doesn't fix it for me
			//   https://github.com/electron/electron/issues/23662
			//
			// const {
			// 	default: installExtension,
			// 	REACT_DEVELOPER_TOOLS,
			// } = require('electron-devtools-installer');

			// installExtension(REACT_DEVELOPER_TOOLS).catch((err) =>
			// 	console.log('Error loading React DevTools: ', err)
			// );

			// RE-ENABLE to automatically open the devtools
			mainWindow.webContents.openDevTools();
		}

		let projectAlreadyCreated = false;
		if (callbackFunction) {
			// Allows the menu to run functions (open, new project) after the new window has been created
			projectAlreadyCreated = callbackFunction();
		}
		// If the callback returned true, it created a project and we don't need to here
		if (!projectAlreadyCreated) {
			// Load the default project files
			const { createTempProjectOnStartup } = require('../backend_files/fileFunctions');
			createTempProjectOnStartup();
		}
	});

	mainWindow.on('close', (e) => {
		// If we haven't done our close routine and we're not "quitting" rather than closing
		if (checkShouldCloseMainWindow() === false && checkIsQuitting() === false) {
			console.log('Preventing main window close.');
			// Prevent the window from closing and request a save
			e.preventDefault();
			requestSaveAndClose();
		}
		// Reset for if we open another window
		setShouldCloseMainWindow(false);
	});

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	return mainWindow;
}

module.exports = { createWindow };
