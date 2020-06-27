// Retrieves a value along an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
export const retrieveContentAtPropertyPath = (key, obj) => {
	return key.split('/').reduce(function (a, b) {
		return a && a[b];
	}, obj);
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

// Inserts a value into an array at an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
export const insertIntoArrayAtPropertyPath = (path, value, object) => {
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

// For a folder structure, pulls the max id for each file type
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
		if (!!filePath) {
			console.log(`returned filePath: ${filePath}`);
			return filePath;
		}
	}
};
