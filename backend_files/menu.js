const { app, Menu, dialog, ipcMain } = require('electron');

const registerMenu = (dev, mainWindow) => {
	const isMac = process.platform === 'darwin';

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
						console.log('New Project!');
					},
				},
				{
					label: 'Open',
					click: async () => {
						openFolder(mainWindow);
					},
				},
				{
					label: 'Open Recent',
					submenu: [
						{
							label: 'Old Project 1',
							click: async () => {
								console.log('Opening old project 1!');
							},
						},
						{
							label: 'Old Project 2',
							click: async () => {
								console.log('Opening old project 2!');
							},
						},
						{
							label: 'Old Project 3',
							click: async () => {
								console.log('Opening old project 3!');
							},
						},
					],
				},
				{ type: 'separator' },
				{
					label: 'Save',
					accelerator: 'CommandOrControl+S',
					registerAccelerator: true,
					// acceleratorWorksWhenHidden: true,
					click: async () => {
						console.log('Saving document!');
					},
				},
				{
					label: 'Save As',
					accelerator: 'CommandOrControl+Shift+S',
					registerAccelerator: true,
					// acceleratorWorksWhenHidden: true,
					click: async () => {
						console.log('Saving document as!');
					},
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
				...(isMac
					? [
							{ role: 'pasteAndMatchStyle' },
							{ role: 'delete' },
							{ role: 'selectAll' },
							{ type: 'separator' },
							{
								label: 'Speech',
								submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
							},
					  ]
					: [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
			],
		},
		// { role: 'viewMenu' }
		{
			label: 'View',
			submenu: [
				...(dev
					? [
							{ role: 'reload' },
							{ role: 'forcereload' },
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

//hold the array of directory paths selected by user

const openFolder = async (mainWindow) => {
	let directory = await dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory'],
	});
	console.log('dir selected: ', directory);
	mainWindow.webContents.send('open-project', directory);
};

module.exports = { registerMenu };
