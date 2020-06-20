const { ipcMain, app } = require('electron');
const fontList = require('font-list');
const fs = require('fs');
const path = require('path');

const registerHandlers = () => {
	loadFonts();
	saveSingleDocument();
	readSingleDocument();
};

// Loading a list of system fonts
const loadFonts = () => {
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
const saveSingleDocument = () => {
	ipcMain.handle('save-single-document', (e, projectDirectory, fileName, fileContents) => {
		// File path to the Documents folder, combined with the folders and file name
		const docPath = app.getPath('documents');
		const filePath = path.join(docPath, projectDirectory, fileName);

		// // If already exists, don't overwrite it. This is for creating new documents.
		// if (fs.existsSync(filePath)) {
		// 	return {
		// 		created: false,
		// 		alreadyExists: true,
		// 		fileName: fileName,
		// 	};
		// } else {
		// Convert to JSON, then write to file
		let dataToWrite = JSON.stringify(fileContents);
		fs.writeFileSync(filePath, dataToWrite);
		return {
			created: true,
			// alreadyExists: false,
			fileName: fileName,
		};
		// }
	});
};

const readSingleDocument = () => {
	ipcMain.handle('read-single-document', (e, projectDirectory, fileName) => {
		// File path to the Documents folder, combined with the folders and file name
		const docPath = app.getPath('documents');
		const filePath = path.join(docPath, projectDirectory, fileName);

		// If already exists, don't overwrite it. This is for creating new documents.
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

module.exports = { registerHandlers };
