import React from 'react';
import { ipcRenderer } from 'electron';
import { List, Repeat } from 'immutable';

import NavFolder from './left-nav/NavFolder';
import NavFolderEmpty from './left-nav/NavFolderEmpty';
import NavDocument from './left-nav/NavDocument';
import NavDocumentTrash from './left-nav/NavDocumentTrash';
import NavFolderTrash from './left-nav/NavFolderTrash';

import {
	findFilePath,
	setObjPropertyAtPropertyPath,
	insertIntoArrayAtPropertyPath,
	retrieveContentAtPropertyPath,
	deleteObjPropertyAtPropertyPath,
	findFirstDocInFolder,
	findFurthestChildrenFolderAlongPath,
	findFirstFileAlongPathWithProp,
} from '../../utils/utils';

import FolderOpenSVG from '../../assets/svg/FolderOpenSVG';
import DocumentSingleSVG from '../../assets/svg/DocumentSingleSVG';

import Collapse from 'react-css-collapse';
import { CharacterMetadata, ContentBlock, ContentState, EditorState, genKey } from 'draft-js';

// If we have sections in the document, initialize the editorState with those sections
export const initializeDocWithSections = (docStructure, currentDoc, filePath, saveFileRef) => {
	// Find the first parent folder with templateSections
	const folderObj = findFirstFileAlongPathWithProp(
		docStructure.pages,
		filePath,
		'folder',
		'templateSections'
	);

	// If no templateSections found, don't initialize the document
	if (!folderObj) {
		return { sections: null };
	}

	const templateSections = folderObj.templateSections;

	// Build an array of content blocks with the new sections
	let blockArray = [];
	let sectionArray = [];
	for (let sectionName of templateSections) {
		// Build the array of sections
		const newBlockKey = genKey();
		sectionArray.push({
			key: newBlockKey,
			text: sectionName,
		});

		// Add the wiki-section block
		blockArray.push(
			new ContentBlock({
				key: newBlockKey,
				type: 'wiki-section',
				text: sectionName,
				characterList: List(Repeat(CharacterMetadata.create(), sectionName.length)),
			})
		);

		// Generate two empty blocks
		blockArray.push(new ContentBlock({ key: genKey(), type: 'unstyled' }));
		blockArray.push(new ContentBlock({ key: genKey(), type: 'unstyled' }));
	}

	// Push the new content block into the editorState
	const newEditorState = EditorState.createWithContent(
		ContentState.createFromBlockArray(blockArray)
	);

	// Save the file in case we don't open it before closing the project
	saveFileRef.current(currentDoc, newEditorState);

	return { sections: sectionArray, editorState: newEditorState };
};

// Update an editorState && docStructure with a new wiki-section inserted in a specific location
// Returns the new editorState && blockKey
export const insertNewSectionInClosedDoc = (
	editorState,
	newSectionOptions,
	setDocStructure,
	currentTab,
	docId,
	saveFileRef
) => {
	const currentContent = editorState.getCurrentContent();
	let newBlockArray = currentContent.getBlocksAsArray();

	// Create the new section block
	const insertBeforeKey = newSectionOptions.insertBeforeKey;
	const newSectionBlockKey = genKey();
	const newSectionBlock = new ContentBlock({
		key: newSectionBlockKey,
		type: 'wiki-section',
		text: newSectionOptions.newName,
		characterList: List(Repeat(CharacterMetadata.create(), newSectionOptions.newName.length)),
	});
	const newEmptyBlock = new ContentBlock({ key: genKey(), type: 'unstyled' });

	// Position the new section block
	if (insertBeforeKey === '##topOfPage') {
		newBlockArray.unshift(newEmptyBlock);
		newBlockArray.unshift(newSectionBlock);
	} else {
		const sectionIndex = newBlockArray.findIndex((item) => item.getKey() === insertBeforeKey);
		if (sectionIndex !== -1) {
			// If we found a matching section block key, insert afterwards
			newBlockArray.splice(sectionIndex, 0, newEmptyBlock);
			newBlockArray.splice(sectionIndex, 0, newSectionBlock);
		} else {
			// Otherwise, push to the end of the page
			newBlockArray.push(newSectionBlock);
			newBlockArray.push(newEmptyBlock);
		}
	}

	let newEditorState = EditorState.push(
		editorState,
		ContentState.createFromBlockArray(newBlockArray),
		'split-block'
	);

	// Update the docStructure with the new section
	setDocStructure((docStructure) => {
		let folderStructure = JSON.parse(JSON.stringify(docStructure[currentTab]));

		// Retrieve the array of sections
		const filePath = findFilePath(folderStructure, '', 'doc', docId);
		const childrenPath = filePath + (filePath === '' ? '' : '/') + 'children';
		const childrenArray = retrieveContentAtPropertyPath(childrenPath, folderStructure);
		const docIndex = childrenArray.findIndex(
			(item) => item.id === docId && item.type === 'doc'
		);
		let docObj = { ...childrenArray[docIndex] };

		// Update the section array with the new section
		let sectionArray = [...(docObj.sections ? docObj.sections : [])];
		const childObj = { key: newSectionBlockKey, text: newSectionOptions.newName };
		if (insertBeforeKey === '##topOfPage') {
			sectionArray.unshift(childObj);
		} else {
			const sectionIndex = sectionArray.findIndex((item) => item.key === insertBeforeKey);
			if (sectionIndex !== -1) {
				sectionArray.splice(sectionIndex, 0, childObj);
			} else {
				sectionArray.push(childObj);
			}
		}

		// Update the doc in the children array
		docObj.sections = sectionArray;
		let newChildrenArray = [...childrenArray];
		newChildrenArray[docIndex] = docObj;

		// Update the children property
		const newFolderStructure = setObjPropertyAtPropertyPath(
			childrenPath,
			newChildrenArray,
			folderStructure
		);

		// Return a new docStructure
		return {
			...docStructure,
			[currentTab]: newFolderStructure,
		};
	});

	// Save the updated editorState (which also updates the editorArchives)
	const docName = `doc${docId}.json`;
	saveFileRef.current(docName, newEditorState);

	return { blockKey: newSectionBlockKey, editorState: newEditorState };
};

// Inserts a new file/folder into the docStructure
export const addFile = (
	fileType,
	docStructure,
	setDocStructure,
	currentTab,
	lastClickedType,
	lastClickedId,
	navData,
	setNavData,
	saveFileRef,
	fileName = undefined, // Optional
	dontOpenFile = false
) => {
	// Create a docStructure object for our current tab.
	// We'll insert our file and overwrite this section of docStructure.
	let folderStructure = JSON.parse(JSON.stringify(docStructure[currentTab]));
	let maxIds = JSON.parse(JSON.stringify(docStructure.maxIds));
	// Note the spread operator only performs a shallow copy (nested objects are still refs).
	//   The JSON method performs a deep copy.

	// Find out where we need to insert the new file
	let filePath = '';
	if (lastClickedType !== '') {
		let tempPath = findFilePath(folderStructure, '', lastClickedType, lastClickedId);

		if (tempPath !== undefined) {
			filePath =
				tempPath +
				(lastClickedType === 'folder'
					? (tempPath === '' ? '' : '/') + `folders/${lastClickedId}`
					: '');
		} else {
			lastClickedType = '';
		}
	}

	// Choose a unique file name
	const allDocs = findAllDocsInFolder(docStructure[currentTab]);
	const usedDocNames = allDocs.map((item) => item.name.toLowerCase());
	const origFileName = fileName
		? fileName
		: fileType === 'doc'
		? 'New Document'
		: `New ${fileType}`;
	let newFileName = origFileName;
	let fileNameCounter = 1;
	while (usedDocNames.includes(newFileName.toLowerCase())) {
		newFileName = `${origFileName} ${fileNameCounter}`;
		fileNameCounter++;
	}

	// Build the object that will go in 'children' at the path
	let childObject = {
		type: fileType,
		id: maxIds[fileType] + 1,
		name: newFileName,
	};
	if (fileType === 'doc') {
		childObject.fileName = 'doc' + childObject.id + '.json';
	}

	// Initialize sections if needed
	let newEditorState;
	if (fileType === 'doc' && currentTab === 'pages') {
		// This was expecting us to open the document right away
		// Instead, we need to save the file in addition to setting the archives && update the docStructure
		// We need the editorArchives set for when we do full project searching
		// Return updated child object and update that here before setting docStructure at the bottom
		const { sections, editorState } = initializeDocWithSections(
			docStructure,
			childObject.fileName,
			filePath,
			saveFileRef
		);

		if (sections && sections.length) {
			childObject.sections = sections;
		}

		newEditorState = editorState;
	}

	// Build the object that will go in 'folders' at the path.
	if (fileType === 'folder') {
		let folderObject = { folders: {}, children: [] };
		// Insert the folder into the folder structure
		console.log('filepath: ', filePath);
		folderStructure = setObjPropertyAtPropertyPath(
			filePath + (filePath === '' ? '' : '/') + 'folders/' + childObject.id,
			folderObject,
			folderStructure
		);
		console.log(folderStructure);
	}

	let insertIndex;
	// If we're inserting on a doc, insert the file directly below it
	if (lastClickedType === 'doc') {
		const childrenArray = retrieveContentAtPropertyPath(
			filePath + (filePath === '' ? '' : '/') + 'children',
			folderStructure
		);
		let prevIndex = childrenArray.findIndex(
			(item) => item.id === lastClickedId && item.type === lastClickedType
		);
		if (prevIndex > -1) {
			insertIndex = prevIndex + 1;
		}
	}

	// Inserts the new child into our folderStructure at the destination path
	folderStructure = insertIntoArrayAtPropertyPath(
		filePath + (filePath === '' ? '' : '/') + 'children',
		childObject,
		folderStructure,
		insertIndex
	);
	console.log(folderStructure);

	// Will put the file name into edit mode
	let newEditFileId = fileType + '-' + (maxIds[fileType] + 1);
	if (fileType === 'doc' && !dontOpenFile) {
		setNavData({
			...navData,
			editFile: fileName ? '' : newEditFileId,
			currentDoc: childObject.fileName,
			lastClicked: { type: 'doc', id: childObject.id },
		});
	} else {
		setNavData({
			...navData,
			editFile: fileName ? '' : newEditFileId,
		});
	}

	// console.log(folderStructure);

	// Increment the max ID for a file type
	maxIds[fileType] = maxIds[fileType] + 1;

	setDocStructure({ ...docStructure, [currentTab]: folderStructure, maxIds });

	return { id: childObject.id, sections: childObject.sections, editorState: newEditorState };
};

// Permanently delete a single document from the trash bin
export const deleteDocument = (origDocStructure, origLinkStructure, docId, origNavData) => {
	let docStructure = JSON.parse(JSON.stringify(origDocStructure));

	// Find the item we're restoring from the trash
	const trashFilePath = findFilePath(docStructure.trash, '', 'doc', Number(docId));
	const trashChildPath = trashFilePath + (trashFilePath ? '/' : '') + 'children';
	let trashChildrenArray = retrieveContentAtPropertyPath(trashChildPath, docStructure.trash);
	const trashIndex = trashChildrenArray.findIndex(
		(item) => item.type === 'doc' && item.id === Number(docId)
	);

	// Copy the item to delete and then remove from trash
	const deleteItem = { ...trashChildrenArray[trashIndex] };
	trashChildrenArray.splice(trashIndex, 1);
	const newDocStructureTrash = setObjPropertyAtPropertyPath(
		trashChildPath,
		trashChildrenArray,
		docStructure.trash
	);
	docStructure.trash = newDocStructureTrash;

	// Remove all references in the linkStructure
	const linkStructure = removeAllLinksRelatedToFile(origLinkStructure, deleteItem.fileName);

	// Updates what file we're viewing if the deleted document was open
	let navData;
	if (origNavData.currentDoc === deleteItem.fileName) {
		let currentDoc = '';
		let lastClicked = { type: '', id: '' };

		navData = {
			...origNavData,
			currentDoc,
			lastClicked,
		};
	}

	// Tell electron to delete the file
	ipcRenderer.invoke('delete-file', origNavData.currentTempPath, 'docs', deleteItem.fileName);

	return {
		docStructure,
		linkStructure,
		navData,
	};
};

// Permanently delete a folder and all of its contents from the trash bin
export const deleteFolder = (origDocStructure, origLinkStructure, folderId, origNavData) => {
	// Check if folder is empty
	// Find file path of the folder
	// Run findFirstDocInFolder. If false, folder has no document children (but could have empty folders)
	// Then remove from doc structure

	let docStructure = JSON.parse(JSON.stringify(origDocStructure));
	let linkStructure = JSON.parse(JSON.stringify(origLinkStructure));
	let navData = JSON.parse(JSON.stringify(origNavData));

	// Check if folder is empty.
	const filePath = findFilePath(docStructure.trash, '', 'folder', Number(folderId));
	const folderPath = filePath + (filePath ? '/' : '') + `folders/${folderId}`;
	let folder = retrieveContentAtPropertyPath(folderPath, docStructure.trash);
	let firstDoc = findFirstDocInFolder(folder);

	// Folder not empty. Show user warning.
	while (firstDoc !== false) {
		const results = deleteDocument(docStructure, linkStructure, firstDoc.docId, navData);

		results.docStructure && (docStructure = results.docStructure);
		results.linkStructure && (linkStructure = results.linkStructure);
		results.navData && (navData = results.navData);

		folder = retrieveContentAtPropertyPath(folderPath, docStructure.trash);
		firstDoc = findFirstDocInFolder(folder);
	}

	// Delete the folder from the section of the docStructure
	let parentFolder = filePath
		? retrieveContentAtPropertyPath(filePath, docStructure.trash)
		: docStructure.trash;
	console.log('parentFolder:', parentFolder);
	delete parentFolder.folders[folderId];
	const childIndex = parentFolder.children.findIndex(
		(item) => item.type === 'folder' && item.id === Number(folderId)
	);
	parentFolder.children.splice(childIndex, 1);

	// Update the copied docStructure with the changes
	if (filePath) {
		const newFolder = setObjPropertyAtPropertyPath(filePath, parentFolder, docStructure.trash);
		docStructure.trash = newFolder;
	} else {
		docStructure.trash = parentFolder;
	}

	// Reset last clicked
	if (
		origNavData.lastClicked.id === Number(folderId) &&
		origNavData.lastClicked.type === 'folder'
	) {
		console.log('resetting origNavData');
		navData = {
			...navData,
			lastClicked: {
				id: '',
				type: '',
			},
		};
	}

	return {
		docStructure,
		linkStructure,
		navData,
	};

	console.log('We would now delete the folder!!');
};

// Moves a specific document from the docStructure into the trash
export const moveDocToTrash = (
	origDocStructure,
	setDocStructure,
	currentTab,
	docId,
	navData,
	setNavData
) => {
	let newDocStructure = JSON.parse(JSON.stringify(origDocStructure));

	const folderStructure = origDocStructure[currentTab];

	// Finding our variables to use
	const filePath = findFilePath(folderStructure, '', 'doc', Number(docId));
	const childrenPath = filePath + (filePath === '' ? '' : '/') + 'children';
	let childrenArray = retrieveContentAtPropertyPath(childrenPath, folderStructure);
	const docIndex = childrenArray.findIndex(
		(item) => item.id === Number(docId) && item.type === 'doc'
	);
	const fileName = childrenArray[docIndex].fileName;

	// Remove our doc from our old children array
	const docToMove = {
		...childrenArray[docIndex],
		origPath: childrenPath,
		origIndex: docIndex,
		origTab: currentTab,
	};
	childrenArray.splice(docIndex, 1);
	const newFolderStructure = setObjPropertyAtPropertyPath(
		childrenPath,
		childrenArray,
		folderStructure
	);

	// Insert the doc into the trash
	newDocStructure[currentTab] = newFolderStructure;
	if (!newDocStructure.trash.children) {
		newDocStructure.trash.children = [];
	}
	newDocStructure.trash.children.unshift(docToMove);

	// If our deleted file was selected, select the first available file around it
	if (navData.currentDoc === fileName) {
		// let currentDoc = '';
		// let lastClicked = { type: '', id: '' }

		// const response = findFirstDocInFolder(newDocStructure[currentTab]);
		// console.log('response:', response)
		// if (response) {
		//   currentDoc = response.docName;
		//   lastClicked = {
		//     type: 'doc',
		//     id: response.docId
		//   }
		// }

		setNavData({
			...navData,
			currentDoc: '',
			lastClicked: { type: '', id: '' },
		});
	}

	setDocStructure(newDocStructure);
};

// Moves a folder and its contents from the docStructure into the trash
export const moveFolderToTrash = (
	origDocStructure,
	setDocStructure,
	currentTab,
	folderId,
	navData,
	setNavData
) => {
	let newDocStructure = JSON.parse(JSON.stringify(origDocStructure));

	// Finding our variables to use
	const filePath = findFilePath(newDocStructure[currentTab], '', 'folder', Number(folderId));
	const childrenPath = filePath + (filePath === '' ? '' : '/') + 'children';
	let childrenArray = retrieveContentAtPropertyPath(childrenPath, newDocStructure[currentTab]);
	const folderIndex = childrenArray.findIndex(
		(item) => item.id === Number(folderId) && item.type === 'folder'
	);

	// Remove our doc from our old children array
	const folderChildToMove = {
		...childrenArray[folderIndex],
		origPath: childrenPath,
		origIndex: folderIndex,
		origTab: currentTab,
	};
	childrenArray.splice(folderIndex, 1);

	const folderPath = filePath + (filePath === '' ? '' : '/') + 'folders/' + folderId;
	console.log('folderId:', folderId);

	// Update the metadata on the folderObjToMove
	const folderObjToMove = retrieveContentAtPropertyPath(
		folderPath,
		newDocStructure[currentTab]
	);
	console.log('folderObjToMove: ', folderObjToMove);
	let updatedFolderObjToMove = addRemoveRestoreDataToAllChildren(
		folderObjToMove,
		folderPath,
		'ADD',
		currentTab
	);

	// Update the original doc structure to remove the folder
	const currentTabWithChildren = setObjPropertyAtPropertyPath(
		childrenPath,
		childrenArray,
		newDocStructure[currentTab]
	);
	const currentTabRemovedFolder = deleteObjPropertyAtPropertyPath(
		folderPath,
		currentTabWithChildren
	);
	newDocStructure[currentTab] = currentTabRemovedFolder;

	// Code to insert the folder into the trash
	newDocStructure.trash.children.unshift(folderChildToMove);
	newDocStructure.trash.folders[folderId] = updatedFolderObjToMove;

	// If our folder we're moving to trash contains our open document, reset the currentDoc
	const currentDocId = navData.currentDoc.slice(3, -5);
	if (
		currentDocId &&
		findFilePath(updatedFolderObjToMove, '', 'doc', Number(currentDocId)) !== undefined
	) {
		setNavData({
			...navData,
			currentDoc: '',
			lastClicked: { type: '', id: '' },
		});
	}

	setDocStructure(newDocStructure);
};

// Finds the file path of a given file a docStructure folder. Only need currentTab if ADD.
const addRemoveRestoreDataToAllChildren = (
	currentFolder,
	path,
	addRemove = 'ADD',
	currentTab
) => {
	// For this folder level's children, look for a matching type and id
	let newCurrentFolder = JSON.parse(JSON.stringify(currentFolder));

	if (!['ADD', 'REMOVE'].includes(addRemove)) {
		console.log('addRemove:', addRemove);
		console.error(
			'addRemoveRestoreDataToAllChildren expects either ADD or REMOVE as an argument.'
		);
	}

	// Add the meta to the children
	let newChildrenArray = [];
	const childrenPath = path + (path === '' ? '' : '/') + 'children';
	newCurrentFolder.children.forEach((child, i) => {
		let newChild = { ...child };

		if (addRemove === 'ADD') {
			newChild.origPath = childrenPath;
			newChild.origIndex = i;
			newChild.origTab = currentTab;
		}

		if (addRemove === 'REMOVE') {
			delete newChild.origPath;
			delete newChild.origIndex;
			delete newChild.origTab;
		}

		newChildrenArray.push(newChild);
	});
	newCurrentFolder.children = newChildrenArray;

	// Update all the children inside the folder (recursive, digs to all levels)
	for (let folderName in newCurrentFolder.folders) {
		let folderObject = addRemoveRestoreDataToAllChildren(
			currentFolder.folders[folderName],
			path + (path === '' ? '' : '/') + 'folders/' + folderName,
			addRemove,
			currentTab
		);

		newCurrentFolder.folders[folderName] = folderObject;
	}

	return newCurrentFolder;
};

// Restore a single document from the trash to its original location
export const restoreDocument = (
	origDocStructure,
	setDocStructure,
	navData,
	setNavData,
	docId
) => {
	let docStructure = JSON.parse(JSON.stringify(origDocStructure));

	// Find the item we're restoring from the trash
	const trashFilePath = findFilePath(docStructure.trash, '', 'doc', Number(docId));
	const trashChildPath = trashFilePath + (trashFilePath ? '/' : '') + 'children';
	let trashChildrenArray = retrieveContentAtPropertyPath(trashChildPath, docStructure.trash);
	const trashIndex = trashChildrenArray.findIndex(
		(item) => item.type === 'doc' && item.id === Number(docId)
	);

	// Copy the item to restore and delete from trash
	let docToRestore = { ...trashChildrenArray[trashIndex] };
	trashChildrenArray.splice(trashIndex, 1);
	const newDocStructureTrash = setObjPropertyAtPropertyPath(
		trashChildPath,
		trashChildrenArray,
		docStructure.trash
	);
	docStructure.trash = newDocStructureTrash;

	const childrenPath = findFurthestChildrenFolderAlongPath(
		docStructure[docToRestore.origTab],
		docToRestore.origPath
	);

	let insertIndex =
		docToRestore.origPath === childrenPath ? docToRestore.origIndex : undefined;
	let currentTab = docToRestore.origTab;
	delete docToRestore.origPath;
	delete docToRestore.origIndex;
	delete docToRestore.origTab;

	const folderStructure = insertIntoArrayAtPropertyPath(
		childrenPath,
		docToRestore,
		docStructure[currentTab],
		insertIndex
	);
	docStructure[currentTab] = folderStructure;

	setNavData({
		...navData,
		currentTab,
		currentDoc: docToRestore.fileName,
		lastClicked: {
			type: docToRestore.type,
			id: docToRestore.id,
		},
	});

	setDocStructure(docStructure);
};

// Restore a foldre and its contents from the trash to its original location
export const restoreFolder = (
	origDocStructure,
	setDocStructure,
	navData,
	setNavData,
	folderId
) => {
	let docStructure = JSON.parse(JSON.stringify(origDocStructure));

	// Find the item we're restoring from the trash
	const trashFilePath = findFilePath(docStructure.trash, '', 'folder', Number(folderId));
	const trashChildPath = trashFilePath + (trashFilePath ? '/' : '') + 'children';
	let trashChildrenArray = retrieveContentAtPropertyPath(trashChildPath, docStructure.trash);
	const trashIndex = trashChildrenArray.findIndex(
		(item) => item.type === 'folder' && item.id === Number(folderId)
	);

	// Copy the item to restore and delete from trash
	let childToRestore = { ...trashChildrenArray[trashIndex] };
	trashChildrenArray.splice(trashIndex, 1);
	const newDocStructureTrash = setObjPropertyAtPropertyPath(
		trashChildPath,
		trashChildrenArray,
		docStructure.trash
	);
	docStructure.trash = newDocStructureTrash;

	// // TO DO _ NOTE: need to be able to restore from any level
	// const trashIndex = docStructure.trash.children.findIndex(
	// 	(item) => item.type === 'folder' && item.id === Number(folderId)
	// );

	// // Copy the item to restore and delete from trash
	// let childToRestore = { ...docStructure.trash.children[trashIndex] };
	// console.log('childToRestore:', childToRestore);

	// docStructure.trash.children.splice(trashIndex, 1);

	// Pull data from childToRestore, then clean up the properties
	const childrenPath = findFurthestChildrenFolderAlongPath(
		docStructure[childToRestore.origTab],
		childToRestore.origPath
	);
	const origIndex = childToRestore.origIndex;
	const currentTab = childToRestore.origTab;
	delete childToRestore.origPath;
	delete childToRestore.origIndex;
	delete childToRestore.origTab;

	// Copy the folder object we're restoring and delete from trash
	const trashFolderPath = trashFilePath + (trashFilePath ? '/' : '') + 'folders/' + folderId;
	const origFolderToRestore = retrieveContentAtPropertyPath(
		trashFolderPath,
		docStructure.trash
	);
	let folderToRestore = addRemoveRestoreDataToAllChildren(origFolderToRestore, '', 'REMOVE');
	const docStructureTrash = deleteObjPropertyAtPropertyPath(
		trashFolderPath,
		docStructure.trash
	);
	docStructure.trash = docStructureTrash;
	// delete docStructure.trash.folders[childToRestore.id];

	console.log('childrenPath:', childrenPath);
	console.log('folderPath: ', childrenPath.slice(0, -8) + 'folders/' + childToRestore.id);
	const newFolderPath = childrenPath.slice(0, -8) + 'folders/' + childToRestore.id;
	const currentTabWChildren = insertIntoArrayAtPropertyPath(
		childrenPath,
		childToRestore,
		docStructure[currentTab],
		origIndex
	);
	const currentTabWFolder = setObjPropertyAtPropertyPath(
		newFolderPath,
		folderToRestore,
		currentTabWChildren
	);
	docStructure[currentTab] = currentTabWFolder;

	// Opens the first file in the restored folder (if it has a document)
	const restoredFolderFirstDoc = findFirstDocInFolder(folderToRestore);
	let newCurrentDoc = navData.currentDoc;
	let newLastClicked = { ...navData.lastClicked };
	if (restoredFolderFirstDoc) {
		newCurrentDoc = restoredFolderFirstDoc.docName;
		newLastClicked = {
			type: 'doc',
			id: restoredFolderFirstDoc.docId,
		};
	}

	setNavData({
		...navData,
		currentTab,
		currentDoc: newCurrentDoc,
		lastClicked: newLastClicked,
	});

	setDocStructure(docStructure);
};

const removeAllLinksRelatedToFile = (linkStructure, fileName) => {
	let newLinkStructure = JSON.parse(JSON.stringify(linkStructure));

	// Grab all links to a page and remove from tagLinks
	const docId = fileName.slice(3, -5);
	let linksToPage = linkStructure.tagLinks[docId] ? linkStructure.tagLinks[docId] : [];
	delete newLinkStructure.tagLinks[docId];

	// in docLinks, find all linkIds FROM this page and what tag they link to
	//   remove this fileName property from docLinks
	const linksFromPage = newLinkStructure.docLinks[fileName];
	delete newLinkStructure.docLinks[fileName];

	// in tagLinks, for each tag that was linked to FROM this page (using linkId and tag from above)
	//   remove from arrays
	if (linksFromPage) {
		for (let linkId in linksFromPage) {
			const tag = linksFromPage[linkId];
			let linkArray = newLinkStructure.tagLinks[tag];

			const index = linkArray.findIndex((item) => item === Number(linkId));
			linkArray.splice(index, 1);

			newLinkStructure.tagLinks[tag] = linkArray;

			// Delete entry in "links"
			delete newLinkStructure.links[linkId];
		}
	}

	// in links, find the source for all the linkIds TO this page. Remove those links.
	// in docLinks, for each source of linkIds TO this page, remove that linkId from that source
	if (linksToPage.length) {
		for (let linkId of linksToPage) {
			const source = newLinkStructure.links[linkId].source;
			delete newLinkStructure.links[linkId];
			delete newLinkStructure.docLinks[source][linkId];
		}
	}

	// setLinkStructure(newLinkStructure);

	return newLinkStructure;
};

// Loops through the document structure and builds out the file/folder tree
export const buildFileStructure = (
	folder,
	path,
	isTrash,
	handleFolderClick,
	openFolders,
	setOpenFolders,
	openCloseFolder,
	currentlyDragging,
	setCurrentlyDragging
) => {
	return folder.children.map((child) => {
		// Rendering a document
		if (child.type === 'doc') {
			// If rendering the trash area, use the trash document component instead
			return isTrash ? (
				<NavDocumentTrash child={child} key={'doc-' + child.id} />
			) : (
				<NavDocument
					child={child}
					path={[path, 'children'].join('/')}
					{...{ currentlyDragging, setCurrentlyDragging, openCloseFolder }}
					key={'doc-' + child.id}
				/>
			);
		}

		// If rendering a folder
		if (child.type === 'folder') {
			const hasChildren = !!folder.folders[child.id]['children'].length;

			// Default folders to open if not already set
			let isOpen;
			if (openFolders.hasOwnProperty(child.id)) {
				isOpen = openFolders[child.id];
			} else {
				isOpen = true;
				setOpenFolders({ ...openFolders, [child.id]: true });
			}

			return (
				<div className='file-nav folder' key={'folder-' + child.id}>
					{/* Folder Title Button */}
					{isTrash ? (
						<NavFolderTrash
							child={child}
							handleFolderClick={handleFolderClick}
							isOpen={openFolders[child.id]}
						/>
					) : (
						<NavFolder
							child={child}
							path={[path, 'children'].join('/')}
							{...{
								handleFolderClick,
								openCloseFolder,
								currentlyDragging,
								setCurrentlyDragging,
								isOpen,
							}}
						/>
					)}

					{/* Folder contents area */}
					<Collapse isOpen={isOpen}>
						<div className='folder-contents'>
							{hasChildren ? (
								buildFileStructure(
									folder.folders[child.id],
									[path, 'folders', child.id].join('/'),
									isTrash,
									handleFolderClick,
									openFolders,
									setOpenFolders,
									openCloseFolder,
									currentlyDragging,
									setCurrentlyDragging
								)
							) : (
								<NavFolderEmpty
									path={[path, 'folders', child.id, 'children'].join('/')}
									currentlyDragging={currentlyDragging}
								/>
							)}
						</div>
					</Collapse>
				</div>
			);
		}
	});
};

// Loops through the document structure and builds out the file/folder tree
export const buildAddToWikiStructure = (
	folderStructure,
	path,
	handleFileClick,
	foldersOnly,
	currentDoc
) => {
	const currentDocId = currentDoc ? Number(currentDoc.slice(3, -5)) : '';
	return folderStructure.children.map((child) => {
		if (child.type === 'doc' && child.id !== currentDocId && !foldersOnly) {
			return (
				// NEED TO ADD CLICK AND HOVER
				<button
					className='file-nav document add-to-wiki'
					onClick={handleFileClick(child)}
					key={'doc-' + child.id}>
					<div className='svg-wrapper add-to-wiki'>
						<DocumentSingleSVG />
					</div>
					<span>{child.name}</span>
				</button>
			);
		}
		if (child.type === 'folder') {
			const hasChildren = !!folderStructure.folders[child.id]['children'].length;
			return (
				<div className='file-nav folder add-to-wiki' key={'folder-' + child.id}>
					<div
						className={`file-nav title open add-to-wiki ${
							foldersOnly ? 'document' : 'folder'
						}`}
						style={foldersOnly ? { cursor: 'pointer' } : {}}
						// onClick={() => foldersOnly && handleFileClick(child)}>
						onMouseDown={(e) => e.preventDefault()}
						onClick={handleFileClick(child, foldersOnly)}>
						<div className='svg-wrapper add-to-wiki'>
							<FolderOpenSVG />
						</div>
						<span>{child.name}</span>
					</div>

					<div className='folder-contents add-to-wiki'>
						{hasChildren &&
							buildAddToWikiStructure(
								folderStructure.folders[child.id],
								[path, 'folders', child.id].join('/'),
								handleFileClick,
								foldersOnly,
								currentDoc
							)}
					</div>
				</div>
			);
		}
	});
};

// Return an array of all docs in a given folder
export const findAllDocsInFolder = (currentFolder, path = '') => {
	let docArray = [];

	// For this folder level's children, add all docs to the docArray
	for (let child of currentFolder.children) {
		if (child.type === 'doc') {
			docArray.push({
				...child,
				path: path + (path ? '/' : '') + 'children',
			});
		}

		if (child.type === 'folder') {
			const folderId = child.id.toString();
			let subDocArray = findAllDocsInFolder(
				currentFolder.folders[folderId],
				path + (path === '' ? '' : '/') + 'folders/' + folderId
			);
			if (subDocArray) {
				docArray = [...docArray, ...subDocArray];
			}
		}
	}

	// // Find and store all docs from children folders
	// for (let folderName in currentFolder.folders) {
	// 	let subDocArray = findAllDocsInFolder(
	// 		currentFolder.folders[folderName],
	// 		path + (path === '' ? '' : '/') + 'folders/' + folderName
	// 	);
	// 	if (subDocArray) {
	// 		docArray = [...docArray, ...subDocArray];
	// 	}
	// }

	return docArray;
};

export const findInWholeProject = (editorArchives, editorState, currentDoc, findText) => {
	let findResults = {};

	// Exclude current doc from the editorArchives search
	// Find matches in the current editorState
	// Select relevant text for each match

	const regexMetaChars = /[(){[*+?.\\^$|]/g;
	const cleanedFindText = findText.replace(regexMetaChars, '\\$&');
	const regex = new RegExp(cleanedFindText, 'gi');
	// console.log('regex:', regex);

	for (let docName in editorArchives) {
		// console.log('docName:', docName);
		let textBlocks = editorArchives[docName].textBlocks;
		let docResults = [];

		// For each paragrah, find all matches
		for (let block of textBlocks) {
			let matchArr;

			while ((matchArr = regex.exec(block.text)) !== null) {
				const start = matchArr.index;

				docResults.push({
					key: block.key,
					start: start,
					preText: block.text.slice(Math.max(start - 50, 0), start),
					text: block.text.slice(start, start + findText.length),
					postText: block.text.slice(start + findText.length, start + findText.length + 100),
				});
			}
		}

		findResults[docName] = docResults;
	}

	return findResults;
};

// Kripper’s heart quickened. The swelling continued, and Kripper could feel the heat rising from the display in front of them.
// A flash of green heat won out. Kripper stumbled back several steps before turning and running towards the
// “Yes, sir?” Kripper said, turning to face the old man.
// “Ay, sir. Very close indeed, sir.” Kripper turned beside the old man and watched the workers prepare to slide the fifteenth and final stone into its socket in the floor.
