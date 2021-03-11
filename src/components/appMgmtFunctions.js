import { ipcRenderer } from 'electron';
import { ContentState, convertFromRaw, EditorState, Modifier, SelectionState } from 'draft-js';

import { getBlockPlainTextArray } from '../utils/draftUtils';
import {
	findFirstDocInFolder,
	retrieveContentAtPropertyPath,
	findFilePath,
} from '../utils/utils';
import { addFile } from './navs/navFunctions';

// Loads the document / structures when the project changes
export const loadProjectFiles = async ({
	setDocStructure,
	setLinkStructure,
	setMediaStructure,
	setWikiMetadata,
	setNavData,
	setIsProjectLoaded,
	setEditorArchives,
	docStructureRef,
	tempPath,
}) => {
	await loadDocStructure({ tempPath, setDocStructure, docStructureRef, setNavData });
	await loadLinkStructure({ tempPath, setLinkStructure });
	await loadMediaStructure({ tempPath, setMediaStructure });
	await loadWikiMetadata({ tempPath, setWikiMetadata });
	await loadAllDocuments({ tempPath, setEditorArchives });

	setIsProjectLoaded(true);
};

// Loads the document map (function)
const loadDocStructure = async ({
	tempPath,
	setDocStructure,
	docStructureRef,
	setNavData,
}) => {
	const newDocStructure = await ipcRenderer.invoke(
		'read-single-document',
		tempPath,
		'documentStructure.json'
	);
	setDocStructure(newDocStructure.fileContents);

	resetCurrentDoc({ docStructureRef, setNavData, tempPath });
};

// Loads the document link structure (function)
const loadLinkStructure = async ({ tempPath, setLinkStructure }) => {
	const newLinkStructure = await ipcRenderer.invoke(
		'read-single-document',
		tempPath,
		'linkStructure.json'
	);
	setLinkStructure(newLinkStructure.fileContents);
};

// Loads the document media structure (function)
const loadMediaStructure = async ({ tempPath, setMediaStructure }) => {
	const newMediaStructure = await ipcRenderer.invoke(
		'read-single-document',
		tempPath,
		'mediaStructure.json'
	);
	setMediaStructure(newMediaStructure.fileContents);
};

// Loads the document media structure (function)
const loadWikiMetadata = async ({ tempPath, setWikiMetadata }) => {
	console.log('READING NEW METADATA tempPath:', tempPath);
	const newWikiMetadata = await ipcRenderer.invoke(
		'read-single-document',
		tempPath,
		'wikiMetadata.json'
	);
	console.log('newWikiMetadata:', newWikiMetadata);
	setWikiMetadata(newWikiMetadata.fileContents);
};

// Load an object with all raw document contents
const loadAllDocuments = async ({ tempPath, setEditorArchives }) => {
	const newAllDocObj = await ipcRenderer.invoke('read-all-documents', tempPath, 'docs');

	const docArray = Object.keys(newAllDocObj);
	preloadEachDocument(docArray, newAllDocObj, setEditorArchives);
};

// Open the first document in a project (or clean reset)
const resetCurrentDoc = ({ docStructureRef, setNavData, tempPath }) => {
	// Find the first document in the first tab with contents
	const tabList = ['draft', 'pages', 'research'];
	let response, currentTab;
	for (let i = 0; i <= tabList.length && !response; i++) {
		response = findFirstDocInFolder(docStructureRef.current[tabList[i]]);
		if (response) {
			currentTab = tabList[i];
		}
	}

	// let response = findFirstDocInFolder(newDocStructure[currentTab]);
	if (response) {
		// Document was found. Mark the document as the currentDoc.
		setNavData((prev) => ({
			...prev,
			currentTab: currentTab,
			currentDoc: response.docName,
			currentTempPath: tempPath,
			lastClicked: { type: 'doc', id: response.docId },
			parentFolders: response.parentFolders,
		}));
	} else {
		// No documents found. Reset navData to default.
		console.log('No document was found in the current tab!');
		// Only set if currentDoc has contents. Otherwise, changing navData will trigger a recheck.

		console.log('Resetting navData (currentDoc, currentTab, lastClicked, parentFolders)');
		setNavData((prev) => {
			if (prev.currentDoc !== '') {
				return {
					...prev,
					currentDoc: '',
					currentTab: 'draft',
					currentTempPath: tempPath,
					lastClicked: { type: '', id: '' },
					parentFolders: [],
				};
			}

			return prev;
		});
	}
};

// Queues up hydrating editorStates from raw documents to store in the editorArchives.
const preloadEachDocument = (docArray, newAllDocObj, setEditorArchives) => {
	// The timeout puts each loading on the end of the call stack
	setTimeout(() => {
		let newDocArray = [...docArray];
		const docName = newDocArray.pop();

		if (newAllDocObj[docName] && Object.keys(newAllDocObj[docName]).length) {
			// Convert to a valid editorState
			const newContentState = convertFromRaw(newAllDocObj[docName]);
			const newEditorState = EditorState.createWithContent(newContentState);

			setEditorArchives((prev) =>
				prev[docName]
					? prev
					: {
							...prev,
							[docName]: {
								editorState: newEditorState,
								scrollY: 0,
								textBlocks: getBlockPlainTextArray(newEditorState),
							},
					  }
			);
		}

		// Eventually take in an array of names and call this function recursively for each
		if (newDocArray.length) {
			// We call the next document at the end to give the program the chance to resolve any
			//   user actions in the meantime.
			preloadEachDocument(newDocArray, newAllDocObj, setEditorArchives);
		}
	}, 0);
};

export const duplicateDocument = ({
	docId,
	currentTab,
	navDataRef,
	docStructureRef,
	setDocStructure,
	setNavData,
	saveFileRef,
	editorStateRef,
	editorArchivesRef,
	mediaStructureRef,
	setMediaStructure,
	setWikiMetadata,
}) => {
	console.log('docId:', docId);

	// Grab the original document
	const origFilePath = findFilePath(docStructureRef.current[currentTab], '', 'doc', docId);
	if (origFilePath === undefined) {
		return;
	}

	const childrenArray = retrieveContentAtPropertyPath(
		origFilePath + (origFilePath === '' ? '' : '/') + 'children',
		docStructureRef.current[currentTab]
	);
	const origDoc = childrenArray.find(
		(item) => item.id === Number(docId) && item.type === 'doc'
	);

	// Add a new document below our original
	const { id: newDocId } = addFile(
		'doc',
		docStructureRef.current,
		setDocStructure,
		currentTab,
		'doc',
		docId,
		navDataRef.current,
		setNavData,
		saveFileRef,
		origDoc.name + ' copy',
		true // Don't open file
	);
	const newFileName = `doc${newDocId}.json`;

	// Find the editorState to copy
	let editorStateToDuplicate;
	if (navDataRef.current.currentDoc === origDoc.fileName) {
		editorStateToDuplicate = editorStateRef.current;
	} else {
		editorStateToDuplicate = editorArchivesRef.current[origDoc.fileName].editorState;
	}

	// Remove wiki page links
	const editorStateLinks = removeLinkEntities(editorStateToDuplicate, [
		'LINK-SOURCE',
		'LINK-DEST',
	]);

	// Update imageUseIds
	const editorStateImages = updateImages(
		editorStateLinks,
		mediaStructureRef,
		setMediaStructure,
		newFileName
	);

	// Create the wikiMetadata entry
	setWikiMetadata((prev) => ({
		...prev,
		wikis: {
			...prev.wikis,
			[newFileName]: { ...prev.wikis[origDoc.fileName] },
		},
	}));

	// Save the editorState to the file
	saveFileRef.current(newFileName, editorStateImages, newFileName);

	// Open the new document
	setNavData((prev) => ({
		...prev,
		currentDoc: newFileName,
		lastClicked: { type: 'doc', id: newDocId },
	}));
};

// Remove all link entities from an entire editorState
export const removeLinkEntities = (editorState, entityTypeArray) => {
	const contentState = editorState.getCurrentContent();
	const blockArray = contentState.getBlocksAsArray();
	const emptySelectionState = SelectionState.createEmpty();

	// Iterate over the contentState as we remove links
	let newContentState = contentState;

	// Loop through the blocks
	blockArray.forEach((block) => {
		// Find all ranges for link entities
		block.findEntityRanges(
			(character) => {
				const entityKey = character.getEntity();
				if (entityKey === null) {
					return false;
				}
				return entityTypeArray.includes(contentState.getEntity(entityKey).getType());
			},
			(start, end) => {
				// Remove each link entity
				const entitySelectionState = emptySelectionState.merge({
					anchorKey: block.getKey(),
					anchorOffset: start,
					focusKey: block.getKey(),
					focusOffset: end,
				});

				newContentState = Modifier.applyEntity(newContentState, entitySelectionState, null);
			}
		);
	});

	return EditorState.push(editorState, newContentState, 'apply-entity');
};

// Update imageUseIds in the duplicated document, return new editorState
const updateImages = (editorState, mediaStructureRef, setMediaStructure, newFileName) => {
	const contentState = editorState.getCurrentContent();
	let blocks = contentState.getBlocksAsArray();

	let newMediaStructure = JSON.parse(JSON.stringify(mediaStructureRef.current));

	// Looking for images on each block
	const updatedBlocks = blocks.reduce((newBlocks, block) => {
		// Pull images from the block
		const data = block.getData();
		const images = data.get('images');

		// If no images, move on
		if (!images) {
			return [...newBlocks, block];
		}

		let newImages = [...images];

		// Update the blocks and mediaStructure with new imageUseIds
		images.forEach((image, i) => {
			const imageEntry = newMediaStructure[image.imageId];
			const maxId = imageEntry.uses
				? Math.max(...Object.keys(imageEntry.uses).map((id) => Number(id)))
				: 0;

			// Ensure the property "uses" exists
			if (!newMediaStructure[image.imageId].uses) {
				newMediaStructure[image.imageId].uses = {};
			}

			// Update mediaStructure
			newMediaStructure[image.imageId].uses[maxId + 1] = {
				source: newFileName,
			};

			// Update the block images with the new useId
			newImages[i] = {
				...image,
				imageUseId: maxId + 1,
			};
		});

		const newBlockData = data.set('images', newImages);
		const newBlock = block.set('data', newBlockData);

		return [...newBlocks, newBlock];
	}, []);

	// SET MEDIA STRUCTURE
	setMediaStructure(newMediaStructure);

	// Update the blocks in the contentState
	const newContentState = ContentState.createFromBlockArray(
		updatedBlocks,
		contentState.getEntityMap()
	);

	// Update the editorState
	return EditorState.push(editorState, newContentState, 'change-block-data');

	// Loop through all blocks
	// Grab any "images" data
	// For each image, in the mediaStructure
	// Pull the image entry
	// Find the max imageUseId and increment
	// Add an imageUse entry for our duplicate documents
	// Update the imageUseId in the image data in the editorState
};
