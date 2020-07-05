// Retrieves a value along an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
export const retrieveContentAtPropertyPath = (key, obj) => {
	let newContent = key.split('/').reduce(function (a, b) {
		return a && a[b];
	}, obj);
	return JSON.parse(JSON.stringify(newContent));
};

// Inserts a value at an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
export const setObjPropertyAtPropertyPath = (path, value, object) => {
	let newObject = JSON.parse(JSON.stringify(object)); // This method performs a deep copy
	let objectRef = newObject; // A moving reference to internal objects within 'object'
	let pathArray = path.split('/');
	var arrayLength = pathArray.length;

	// Move our reference down the file path inside the object
	for (let i = 0; i < arrayLength - 1; i++) {
		let pathSegment = pathArray[i];
		// If the object at the path doesn't exist, we'll create it.
		if (!objectRef[pathSegment]) {
			objectRef[pathSegment] = {};
		}
		// Move the object reference to the next location down.
		objectRef = objectRef[pathSegment];
	}

	// Set the final property in our path to our value
	objectRef[pathArray[arrayLength - 1]] = value;
	// Object was mutated by our change at the reference location above.
	return newObject;
};

// Deletes a property at an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
export const deleteObjPropertyAtPropertyPath = (path, object) => {
	let newObject = JSON.parse(JSON.stringify(object)); // This method performs a deep copy
	let objectRef = newObject; // A moving reference to internal objects within 'object'
	let pathArray = path.split('/');
	var arrayLength = pathArray.length;

	// Move our reference down the file path inside the object
	for (let i = 0; i < arrayLength - 1; i++) {
		let pathSegment = pathArray[i];
		// If the object at the path doesn't exist, we'll create it.
		if (!objectRef[pathSegment]) {
			objectRef[pathSegment] = {};
		}
		// Move the object reference to the next location down.
		objectRef = objectRef[pathSegment];
	}

	// Set the final property in our path to our value
	delete objectRef[pathArray[arrayLength - 1]];
	// Object was mutated by our change at the reference location above.
	return newObject;
};

// Inserts a value into an array at an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
export const insertIntoArrayAtPropertyPath = (path, value, object) => {
	let newObject = JSON.parse(JSON.stringify(object)); // This method performs a deep copy
	let objectRef = newObject; // A moving reference to internal objects within 'object'
	let trimPath = path[0] === '/' ? path.slice(1) : path;
	let pathArray = trimPath.split('/');
	var arrayLength = pathArray.length;

	console.log(pathArray);

	// Move our reference down the file path inside the object
	for (let i = 0; i < arrayLength - 1; i++) {
		let pathSegment = pathArray[i];
		// If the object at the path doesn't exist, we'll create it.
		if (!objectRef[pathSegment]) {
			objectRef[pathSegment] = {};
		}
		// Move the object reference to the next location down.
		objectRef = objectRef[pathSegment];
	}

	// Set the final property in our path to our value
	objectRef[pathArray[arrayLength - 1]].push(value);
	// Object was mutated by our change at the reference location above.
	return newObject;
};

// For a folder structure, pulls the max id for each file type
export const findMaxFileTypeIds = (currentFolder) => {
	let childIds = {};
	// For this folder level's children, find the max ID num for each file type
	for (let child of currentFolder.children) {
		if (!childIds.hasOwnProperty(child.type) || childIds[child.type] < child.id) {
			childIds[child.type] = child.id;
		}
	}

	// Get a list of max IDs for each file type for each child folder
	let folderChildIdsList = [];
	for (let folderName in currentFolder.folders) {
		folderChildIdsList.push(findMaxFileTypeIds(currentFolder.folders[folderName]));
	}

	// Consolidates the children maxIds into the parent childIds object
	for (let maxIds of folderChildIdsList) {
		for (let type in maxIds) {
			if (!childIds.hasOwnProperty(type) || childIds[type] < maxIds[type]) {
				childIds[type] = maxIds[type];
			}
		}
	}

	return childIds;
};

// Finds the file path of a given file a docStructure folder
export const findFilePath = (currentFolder, path, fileType, fileId) => {
	// For this folder level's children, look for a matching type and id
	for (let child of currentFolder.children) {
		if (child.type === fileType && child.id === fileId) {
			console.log(`found ${fileType} ${fileId} at ${path}`);
			return path;
		}
	}

	// Look for a matching type and id in the children folders
	for (let folderName in currentFolder.folders) {
		let filePath = findFilePath(
			currentFolder.folders[folderName],
			path + (path === '' ? '' : '/') + 'folders/' + folderName,
			fileType,
			fileId
		);
		// console.log(filePath);
		if (filePath) {
			console.log(`returned filePath: ${filePath}`);
			return filePath;
		}
	}
};

// Updates the name of a file/folder in a given 'children' array in the docStructure
export const updateChildName = (
	childType,
	childId,
	newName,
	path,
	docStructure,
	setDocStructure,
	currentTab
) => {
	// Removes a preceding / from the path if it exists
	let trimmedPath = path[0] === '/' ? path.slice(1) : path;

	// Gets the children array at that path
	let currentChildren = retrieveContentAtPropertyPath(trimmedPath, docStructure[currentTab]);

	// Finds the matching child and updates the name
	for (let i in currentChildren) {
		if (currentChildren[i].id === childId && currentChildren[i].type === childType) {
			currentChildren[i].name = newName;
		}
	}

	// Inserts the children array back into the docStructure for our copy of the current tab
	let newStructure = setObjPropertyAtPropertyPath(
		trimmedPath,
		currentChildren,
		docStructure[currentTab]
	);

	// Updates the docStructure
	setDocStructure({ ...docStructure, [currentTab]: newStructure });
};

// Move a document/folder to a new destination, including the folder tree
export const moveFileToPath = (currentFolder, moveFile, destFile) => {
	let { type, id, path } = moveFile;
	let { type: destType, id: destId, path: destPath } = destFile;
	let folder = JSON.parse(JSON.stringify(currentFolder));

	// Trim leading '/' from the paths
	path = path[0] === '/' ? path.slice(1) : path;
	destPath = destPath[0] === '/' ? destPath.slice(1) : destPath;

	// Remove our file from it's original children path
	let moveChildren = retrieveContentAtPropertyPath(path, folder);
	let moveChild;
	for (let i in moveChildren) {
		if (moveChildren[i].type === type && moveChildren[i].id === id) {
			moveChild = moveChildren.splice(i, 1);
			break;
		}
	}

	// Update folder with the mutated children
	folder = setObjPropertyAtPropertyPath(path, moveChildren, folder);

	// Find the index of the destination child
	let destChildren = retrieveContentAtPropertyPath(destPath, folder);
	let destChildIndex = destChildren.findIndex(
		(child) => child.type === destType && child.id === destId
	);

	// Insert our moved child after the destination child
	destChildren.splice(destChildIndex + 1, 0, moveChild[0]);
	// Update folder with our mutated destChildren
	folder = setObjPropertyAtPropertyPath(destPath, destChildren, folder);

	// If we're moving a folder, also need to move it's file tree
	if (type === 'folder') {
		// Pull the moving folder path (using the folder ID, not 'children')
		let moveFolderPath =
			path.slice(-8) === 'children'
				? path.slice(0, -8).concat('folders/', id)
				: path.concat('folders/', id);
		// Pull the destination folder path (using the folder ID, not 'children')
		let destFolderPath =
			destPath.slice(-8) === 'children'
				? destPath.slice(0, -8).concat('folders/', id)
				: destPath.concat('folders/', id);

		// Extract the folder we're moving out
		let moveFolder = retrieveContentAtPropertyPath(moveFolderPath.toString(), folder);
		// Delete the folder we're moving
		folder = deleteObjPropertyAtPropertyPath(moveFolderPath, folder);
		// Insert the folder we're moving into the new location
		folder = setObjPropertyAtPropertyPath(destFolderPath, moveFolder, folder);
	}

	return folder;
};
