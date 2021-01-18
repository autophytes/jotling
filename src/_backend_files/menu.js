const { app, Menu, BrowserWindow } = require('electron');
const Store = require('electron-store');
const store = new Store();

const {
	requestSaveProject,
	requestSaveAsProject,
	requestSaveAndCreateNew,
	requestSaveAndOpen,
	requestShowFindReplace,
	requestInsertLink,
} = require('./fileFunctions');
const { createWindow } = require('./createWindow');

// Checks if we're in dev mode
let dev = false;
if (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === 'development') {
	dev = true;
}

// Constructs the recent projects menu subsection
const buildRecentProjects = (isWindowOpen) => {
	let recentProjects = store.get('recent-projects');
	if (!recentProjects) {
		recentProjects = [];
	}

	let displayRecentProjects = [];
	if (requestSaveAndOpen) {
		for (let projectPath of recentProjects.slice(0, 10)) {
			let lastSlash = projectPath.lastIndexOf('/');
			let projectName = projectPath.slice(lastSlash + 1);

			displayRecentProjects.push({
				label: projectName,
				click: async () => {
					isWindowOpen
						? requestSaveAndOpen(projectPath)
						: createWindow(dev, () => requestSaveAndOpen(projectPath));
				},
			});
		}
	}

	return displayRecentProjects;
};

const registerMenu = () => {
	let allBrowserWindows = BrowserWindow.getAllWindows();
	let isWindowOpen = !!(allBrowserWindows.length ? allBrowserWindows[0] : null);

	const isMac = process.platform === 'darwin';

	let recentProjects = buildRecentProjects(isWindowOpen);

	const template = [
		// { role: 'appMenu' }
		...(isMac
			? [
					{
						label: app.name,
						submenu: [
							{ role: 'about' },
							{ type: 'separator' },
							{ role: 'services' },
							{ type: 'separator' },
							{ role: 'hide' },
							{ role: 'hideothers' },
							{ role: 'unhide' },
							{ type: 'separator' },
							{ role: 'quit' },
						],
					},
			  ]
			: []),
		// { role: 'fileMenu' }
		{
			label: 'File',
			submenu: [
				{
					label: 'New Project',
					click: async () => {
						isWindowOpen
							? requestSaveAndCreateNew()
							: createWindow(dev, () => requestSaveAndCreateNew());
					},
				},
				{
					label: 'Open',
					click: async () => {
						isWindowOpen
							? requestSaveAndOpen()
							: createWindow(dev, () => requestSaveAndOpen());
					},
				},
				{
					label: 'Open Recent',
					submenu: recentProjects.length ? recentProjects : [{ label: 'No recent projects.' }],
				},
				{ type: 'separator' },
				{
					label: 'Save',
					accelerator: 'CmdOrCtrl+S',
					registerAccelerator: true,
					acceleratorWorksWhenHidden: true,
					click: async () => {
						requestSaveProject();
					},
					enabled: isWindowOpen,
				},
				{
					label: 'Save As',
					accelerator: 'CmdOrCtrl+Shift+S',
					registerAccelerator: true,
					acceleratorWorksWhenHidden: true,
					click: async () => {
						requestSaveAsProject();
					},
					enabled: isWindowOpen,
				},
				{ type: 'separator' },
				...(isMac ? [{ role: 'close' }] : [{ role: 'quit' }]),
			],
		},
		// { role: 'editMenu' }
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'pasteAndMatchStyle' },
				{ type: 'separator' },
				{ role: 'selectAll' },
				{
					label: 'Find',
					accelerator: 'CmdOrCtrl+F',
					registerAccelerator: true,
					acceleratorWorksWhenHidden: true,
					click: async () => {
						requestShowFindReplace({ replace: false, wholeProject: false });
					},
					enabled: isWindowOpen,
				},
				{
					label: 'Find All',
					accelerator: 'CmdOrCtrl+Shift+F',
					registerAccelerator: true,
					acceleratorWorksWhenHidden: true,
					click: async () => {
						requestShowFindReplace({ replace: false, wholeProject: true });
					},
					enabled: isWindowOpen,
				},
				{
					label: 'Replace',
					accelerator: 'CmdOrCtrl+R',
					registerAccelerator: true,
					acceleratorWorksWhenHidden: true,
					click: async (item, window, e) => {
						requestShowFindReplace({ replace: true, wholeProject: false });
					},
					enabled: isWindowOpen,
				},
				{
					label: 'Replace All',
					accelerator: 'CmdOrCtrl+Shift+R',
					registerAccelerator: true,
					acceleratorWorksWhenHidden: true,
					click: async () => {
						requestShowFindReplace({ replace: true, wholeProject: true });
					},
					enabled: isWindowOpen,
				},
				{
					label: 'Add to Wiki',
					accelerator: 'CmdOrCtrl+L',
					registerAccelerator: true,
					acceleratorWorksWhenHidden: true,
					click: requestInsertLink,
					enabled: isWindowOpen,
				},
				// FIND
				// REPLACE
				...(isMac
					? [
							{ type: 'separator' },
							{
								label: 'Speech',
								submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
							},
					  ]
					: []),
			],
		},
		// { role: 'viewMenu' }
		{
			label: 'View',
			submenu: [
				...(dev
					? [
							// { role: 'reload' },
							// { role: 'forcereload' },
							{ role: 'toggledevtools' },
							{ type: 'separator' },
					  ]
					: []),
				{ role: 'resetzoom' },
				{ role: 'zoomin' },
				{ role: 'zoomout' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' },
			],
		},
		// { role: 'windowMenu' }
		{
			label: 'Window',
			submenu: [
				{ role: 'minimize' },
				{ role: 'zoom' },
				...(isMac
					? [
							{ type: 'separator' },
							{ role: 'front' },
							{ type: 'separator' },
							{ role: 'window' },
					  ]
					: [{ role: 'close' }]),
			],
		},
		{
			role: 'help',
			submenu: [
				{
					label: 'Learn More',
					click: async () => {
						const { shell } = require('electron');
						await shell.openExternal('https://jotling.com');
					},
				},
			],
		},
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
};

module.exports = { registerMenu };
