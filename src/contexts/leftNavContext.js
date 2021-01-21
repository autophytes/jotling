import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { convertToRaw, EditorState } from 'draft-js';
import { ipcRenderer } from 'electron';

import { cleanupJpeg } from '../components/appFunctions';

import Store from 'electron-store';
import { findFileTab } from '../utils/utils';
import { convertSetterToRefSetter } from '../utils/contextUtils';
import { getBlockPlainTextArray } from '../utils/draftUtils';

const store = new Store();

export const LeftNavContext = createContext();

// CONSTANTS
const DEFAULT_WIDTH = 12;

const LeftNavContextProvider = (props) => {
	// STATE
	const [docStructure, setDocStructureOrig] = useState({});
	const [linkStructure, setLinkStructureOrig] = useState({});
	const [mediaStructure, setMediaStructureOrig] = useState({});
	const [project, setProject] = useState({ tempPath: '', jotsPath: '' });
	const [navData, setNavDataOrig] = useState({
		currentDoc: '',
		currentDocTab: 'draft',
		currentTempPath: '',
		currentTab: 'draft',
		lastClicked: { type: '', id: '' },
		editFile: '',
		parentFolders: [],
	});
	const [editorStyles, setEditorStyles] = useState({
		leftNav: DEFAULT_WIDTH,
		leftNavFind: 18,
		leftIsPinned: true,
		rightNav: DEFAULT_WIDTH,
		rightIsPinned: false,
		showAllTags: false,
		showIndTags: [],
	});
	const [editorArchives, setEditorArchivesOrig] = useState({});

	const [scrollToLinkId, setScrollToLinkId] = useState(null);
	const [peekWindowLinkId, setPeekWindowLinkId] = useState(null);
	const [displayWikiPopper, setDisplayWikiPopper] = useState(false);
	const [hoverSourceLinkId, setHoverSourceLinkId] = useState(null);
	const [hoverDestLinkId, setHoverDestLinkId] = useState(null);
	const [syncLinkIdList, setSyncLinkIdList] = useState([]);
	const [showUploadImage, setShowUploadImage] = useState(false);
	const [customStyles, setCustomStyles] = useState(null);

	// REFS
	const linkStructureRef = useRef(linkStructure);
	const docStructureRef = useRef(docStructure);
	const mediaStructureRef = useRef(mediaStructure);
	const editorStateRef = useRef(EditorState.createEmpty());
	const editorArchivesRef = useRef(editorArchives);
	const navDataRef = useRef(navData);
	const setEditorStateRef = useRef(null);
	const isImageSelectedRef = useRef(false);
	const saveFileRef = useRef(null);

	const setLinkStructure = (value) => {
		convertSetterToRefSetter(linkStructureRef, setLinkStructureOrig, value);
	};

	const setDocStructure = (value) => {
		convertSetterToRefSetter(docStructureRef, setDocStructureOrig, value);
	};

	const setMediaStructure = (value) => {
		convertSetterToRefSetter(mediaStructureRef, setMediaStructureOrig, value);
	};

	const setNavData = (value) => {
		convertSetterToRefSetter(navDataRef, setNavDataOrig, value);
	};

	const setEditorArchives = (value) => {
		convertSetterToRefSetter(editorArchivesRef, setEditorArchivesOrig, value);
	};

	// Initialize the left and right nav width from electron-store
	useEffect(() => {
		let newEditorStyles = { ...editorStyles };

		let newLeftNav = store.get(`editorStyles.leftNav`, null);
		let newRightNav = store.get(`editorStyles.rightNav`, null);

		if (newLeftNav !== null) {
			newEditorStyles.leftNav = newLeftNav;
		} else {
			newEditorStyles.leftNav = DEFAULT_WIDTH;
		}

		if (newRightNav !== null) {
			newEditorStyles.rightNav = newRightNav;
		} else {
			newEditorStyles.rightNav = DEFAULT_WIDTH;
		}

		setEditorStyles(newEditorStyles);
	}, []);

	// Synchronize the editorStyles nav widths electron-store
	useEffect(() => {
		store.set(`editorStyles.leftNav`, editorStyles.leftNav);
		store.set(`editorStyles.rightNav`, editorStyles.rightNav);
	}, [editorStyles]);

	// Synchronize customStyles with the property in the docStructure
	useEffect(() => {
		let newCustomStyles = docStructure.customStyles;

		if (!newCustomStyles || !Object.keys(newCustomStyles).length) {
			return;
		}

		console.log('docStructure changed, new customStyles');

		// Update customStyles if something has changed
		setCustomStyles((prev) => {
			for (let styleType in newCustomStyles) {
				if (
					!prev ||
					!prev[styleType] ||
					prev[styleType].length !== newCustomStyles[styleType].length
				) {
					return newCustomStyles;
				}
				if (!prev[styleType].every((v, i) => v === newCustomStyles[styleType][i])) {
					return newCustomStyles;
				}
			}

			console.log('just returned previous custom style');
			return prev;
		});
	}, [docStructure]);

	// Update the tab the open document is in
	useEffect(() => {
		const fileTab = findFileTab(
			docStructureRef.current,
			'doc',
			Number(navData.currentDoc.slice(3, -5))
		);

		if (fileTab && navData.currentDocTab !== fileTab) {
			setNavData((prev) => ({
				...prev,
				currentDocTab: fileTab,
			}));
		}
	}, [navData]);

	// Resets the width of the side nav bars
	const resetNavWidth = useCallback(
		(whichNav) => {
			setEditorStyles({ ...editorStyles, [whichNav]: DEFAULT_WIDTH });
		},
		[editorStyles]
	);

	// Saves current document file and updates the editorArchives.
	// All 3 arguments are optional.
	const saveFile = useCallback(
		(docName = navData.currentDoc, editorState, scrollY) => {
			// potentially set default of editorState to editorStateRef.current
			const editorStateToSave = editorState ? editorState : editorStateRef.current;

			const currentContent = editorStateToSave.getCurrentContent();
			const rawContent = convertToRaw(currentContent);

			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath, // Must be the root temp path, not a subfolder
				project.jotsPath,
				'docs/' + docName, // Saved in the docs folder
				rawContent
			);

			setEditorArchives((prev) => ({
				...prev,
				[docName]: {
					...prev[docName],
					editorState: editorStateToSave,
					...(typeof scrollY !== 'undefined' ? { scrollY } : {}), // Add scroll if available
					textBlocks: getBlockPlainTextArray(editorStateToSave),
				},
			}));
		},
		[project, navData.currentDoc]
	);

	useEffect(() => {
		saveFileRef.current = saveFile;
	}, [saveFile]);

	// Cleans up unused images
	const runCleanup = useCallback(async () => {
		let newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
		let usedDocuments = {};

		// Loop through each image instance in the media structure and organize by source document
		for (let imageId in mediaStructure) {
			for (let imageUseId in mediaStructure[imageId].uses) {
				const source = mediaStructure[imageId].uses[imageUseId].sourceDoc;

				if (!usedDocuments.hasOwnProperty(source)) {
					usedDocuments[source] = {};
				}

				// Builds a checklist of images to see if they exist, cleanup if they don't
				usedDocuments[source][`${imageId}_${imageUseId}`] = {
					imageId,
					imageUseId,
				};
			}
		}

		// Check editorArchives for everything except hte current document. Use the editorState for that.

		// For each document with images, pull the editorState and remove matches from usedDocuments
		for (let source in usedDocuments) {
			// If the currentDoc, the editorArchives will not be up to date
			let currentEditorState =
				navData.currentDoc === source
					? editorStateRef.current
					: editorArchivesRef.current[source].editorState;

			// Loop through each block
			if (currentEditorState) {
				const contentState = currentEditorState.getCurrentContent();
				const blockMap = contentState.getBlockMap();

				blockMap.forEach((block) => {
					let blockData = block.getData();
					let imageData = blockData.get('images', []);

					// For each image in the block
					for (let image of imageData) {
						// Remove it from our checklist
						delete usedDocuments[source][`${image.imageId}_${image.imageUseId}`];

						// If it was the last image, then stop searching the page
						if (!Object.keys(usedDocuments[source]).length) {
							delete usedDocuments[source];
							return false; // Exits the forEach
						}
					}
				});
			}
		}

		// Anything left in usedDocuments needs to be cleaned up
		for (let sourceObj of Object.values(usedDocuments)) {
			for (let imageObj of Object.values(sourceObj)) {
				newMediaStructure = await cleanupJpeg(imageObj, newMediaStructure, project.tempPath);
			}
		}

		// process each type of cleanup action
		// maybe initialize a copy of the appropriate "structure" if needed
		// and use that (vs undefined) as a flag for setting at the end?

		// Save the mediaStructure to file
		if (newMediaStructure) {
			await ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'mediaStructure.json',
				newMediaStructure
			);
		}
	}, [mediaStructure, project, editorStateRef, navData]);

	// Saves the current file and calls the main process to save the project
	const saveFileAndProject = useCallback(
		async (saveProject) => {
			console.log('saveProject:', saveProject);
			const { command, options } = saveProject;
			const docName = navData.currentDoc;
			const currentContent = editorStateRef.current.getCurrentContent();
			const rawContent = convertToRaw(currentContent);
			console.log('editorContainer options: ', options);

			// Cleanup (remove) files before save. Currently not updating the currentContent.
			if (options && options.shouldCleanup) {
				await runCleanup();
			}

			// Save the current document
			let response = await ipcRenderer.invoke(
				'save-single-document',
				project.tempPath, // Must be the root temp path, not a subfolder
				project.jotsPath,
				'docs/' + docName, // Saved in the docs folder
				rawContent
			);

			if (response) {
				if (command === 'save-as') {
					// Leave the jotsPath argument blank to indicate a Save As
					let { tempPath, jotsPath } = await ipcRenderer.invoke(
						'save-project',
						project.tempPath,
						'',
						options
					);
					// Save the updated path names (if the save was not cancelled)
					if (tempPath && jotsPath) {
						setProject({ tempPath, jotsPath });
					}
				} else {
					// Request a save, don't wait for a response
					ipcRenderer.invoke('save-project', project.tempPath, project.jotsPath, options);
				}
			}
		},
		[project, navData.currentDoc, runCleanup]
	);

	return (
		<LeftNavContext.Provider
			value={{
				docStructure,
				setDocStructure,
				docStructureRef,
				navData,
				setNavData,
				navDataRef,
				project,
				setProject,
				linkStructure,
				setLinkStructure,
				editorStyles,
				setEditorStyles,
				resetNavWidth,
				setEditorArchives,
				editorArchivesRef, // Nothing should monitor editorArchives
				linkStructureRef,
				editorStateRef,
				scrollToLinkId,
				setScrollToLinkId,
				setEditorStateRef,
				peekWindowLinkId,
				setPeekWindowLinkId,
				displayWikiPopper,
				setDisplayWikiPopper,
				hoverSourceLinkId,
				setHoverSourceLinkId,
				hoverDestLinkId,
				setHoverDestLinkId,
				syncLinkIdList,
				setSyncLinkIdList,
				showUploadImage,
				setShowUploadImage,
				mediaStructure,
				mediaStructureRef,
				setMediaStructure,
				isImageSelectedRef,
				customStyles,
				saveFile,
				saveFileRef,
				saveFileAndProject,
			}}>
			{props.children}
		</LeftNavContext.Provider>
	);
};

export default LeftNavContextProvider;
