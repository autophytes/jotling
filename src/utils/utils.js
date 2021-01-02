// Retrieves a value along an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
export const retrieveContentAtPropertyPath = (path, obj) => {
	const newContent = path.split('/').reduce(function (a, b) {
		return a && a[b];
	}, obj);

	const copiedValues = JSON.parse(JSON.stringify({ value: newContent }));

	return copiedValues.value;
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
export const insertIntoArrayAtPropertyPath = (path, value, object, optionalIndex) => {
	let newObject = JSON.parse(JSON.stringify(object)); // This method performs a deep copy
	let objectRef = newObject; // A moving reference to internal objects within 'object'
	let trimPath = path[0] === '/' ? path.slice(1) : path;
	let pathArray = trimPath.split('/');
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
	if (
		optionalIndex !== undefined &&
		optionalIndex >= 0 &&
		optionalIndex < objectRef[pathArray[arrayLength - 1]].length
	) {
		objectRef[pathArray[arrayLength - 1]].splice(optionalIndex, 0, value);
	} else {
		objectRef[pathArray[arrayLength - 1]].push(value);
	}

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
export const moveFileToPath = (currentFolder, moveFile, destFile, isTopBottom) => {
	let { type, id, path } = moveFile;
	let { type: destType, id: destId, path: destPath } = destFile;
	let folder = JSON.parse(JSON.stringify(currentFolder));

	// Trim leading '/' from the paths
	path = path[0] === '/' ? path.slice(1) : path;
	destPath = destPath[0] === '/' ? destPath.slice(1) : destPath;

	console.log(destPath);

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

	// If we're inserting below the element, offset the childIndex by 1,
	let destIndexOffest = isTopBottom === 'top' ? 0 : 1;
	// Insert our moved child before/after the destination child
	destChildren.splice(destChildIndex + destIndexOffest, 0, moveChild[0]);
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

// Returns the name of the topmost document and any parent folder ids,
//    or false if no documents were found
export const findFirstDocInFolder = (currentFolder, parentFolders = []) => {
	// Loop through all children in order
	for (let child of currentFolder.children) {
		// If the child is a folder, check that folder for documents
		if (child.type === 'folder') {
			let newParentFolders = [...parentFolders, child.id];
			let response = findFirstDocInFolder(currentFolder.folders[child.id], newParentFolders);
			if (response) {
				return response;
			}
			// If the child is a document, return that document
		} else if (child.type === 'doc') {
			return { docName: child.fileName, parentFolders, docId: child.id };
		}
	}
	// No documents were found
	return false;
};

// Return the "name" of the matching document in the folder structure or false if not found.
export const findTitleForGivenDocFileName = (currentFolder, fileName) => {
	// Loop through each of the cildren
	for (let child of currentFolder.children) {
		// Check if child is our matching document
		if (child.fileName === fileName) {
			return child.name;
		}

		// Check if the folder contains our matching document
		if (child.type === 'folder') {
			let potentialMatch = findTitleForGivenDocFileName(
				currentFolder.folders[child.id],
				fileName
			);
			if (potentialMatch) {
				return potentialMatch;
			}
		}
	}
	// If no match in any of the children, return false
	return false;
};

// Finds the deepest folder level along a path that has a valid children folder. Returns that path.
export const findFurthestChildrenFolderAlongPath = (currentFolder, path) => {
	let pathArray = path.split('/');

	for (let i = pathArray.length; i >= 0; i--) {
		let pathSubArray = pathArray.slice(0, i);
		pathSubArray.push('children');
		const path = pathSubArray.join('/');

		const content = retrieveContentAtPropertyPath(path, currentFolder);

		if (content) {
			return path;
		}
	}
};

// Finds the file path of a given file a docStructure folder
export const findFilePath = (currentFolder, path, fileType, fileId) => {
	// Ensure we have a docStructure folder
	if (!currentFolder || !currentFolder.children || !currentFolder.folders) {
		return;
	}

	// For this folder level's children, look for a matching type and id
	for (let child of currentFolder.children) {
		if (child.type === fileType && child.id === fileId) {
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
			return filePath;
		}
	}
};

// Find which tab in the docStructure a given file is in
export const findFileTab = (docStructure, fileType, fileId) => {
	const tabs = ['draft', 'research', 'pages'];

	for (let tab of tabs) {
		let filePath = findFilePath(docStructure[tab], '', fileType, fileId);

		if (typeof filePath === 'string') {
			return tab;
		}
	}
};

// Reorders the list as the items are being dragged
export const reorderArray = (list, startIndex, endIndex) => {
	const result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	return result;
};
