const { ipcMain, app } = require('electron');
const fontList = require('font-list');
const fs = require('fs');
const path = require('path');

// NOTE: Use node-tar to bundle and then compress files.
//  - When opening folder, extract the tar.gz (.jots) into a temporary folder to work from.
//  - All changes happen in the temporary folder, and mirror the changes in the tar.gz.
//  - This way it maintains the performance of working on uncompressed files.
//  - Probably no need to use high compression. Maybe just 3 or 4? Need it to stay quick.

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

// Read a single file
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
