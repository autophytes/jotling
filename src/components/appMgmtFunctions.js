import { ipcRenderer } from 'electron';
import { convertFromRaw, EditorState } from 'draft-js';

import { getBlockPlainTextArray } from '../utils/draftUtils';
import { findFirstDocInFolder } from '../utils/utils';

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

// MOVE THESE DEFS TO A SEPARATE FILE
