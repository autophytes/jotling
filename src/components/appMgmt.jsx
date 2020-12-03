// Import dependencies
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { ipcRenderer } from 'electron';

import TopNav from './navs/top-nav/TopNav';
import LeftNav from './navs/left-nav/LeftNav';
import RightNav from './navs/right-nav/RightNav';
import EditorContainer from './editor/EditorContainer';

// import LeftNavContextProvider from '../contexts/leftNavContext';
import { LeftNavContext } from '../contexts/leftNavContext';
import { FindReplaceContext } from '../contexts/findReplaceContext';
import { SettingsContext } from '../contexts/settingsContext';

import LoadingOverlay from './loadingOverlay';

import { findFirstDocInFolder } from '../utils/utils';
import { removeLinkSourceFromSelection } from './editor/editorFunctions';
import {
	addFile,
	moveDocToTrash,
	deleteFolder,
	restoreDocument,
	restoreFolder,
	moveFolderToTrash,
} from './navs/navFunctions';

import Store from 'electron-store';
import Mousetrap from 'mousetrap';
import PeekDocument from './editor/PeekDocument';
import EditorSettings from './navs/top-nav/EditorSettings';
import HiddenContextMenu from './hiddenContextMenu';
import UploadImageForm from './forms/UploadImageForm';

// import ReactResizeDetector from 'react-resize-detector';

// Create main App component
const AppMgmt = () => {
	// STATE
	const [structureLoaded, setStructureLoaded] = useState(false);
	const [linkStructureLoaded, setLinkStructureLoaded] = useState(false);
	const [mediaStructureLoaded, setMediaStructureLoaded] = useState(false);
	const [prevProj, setPrevProj] = useState('');
	const [saveProject, setSaveProject] = useState({});
	const [needCurrentDocReset, setNeedCurrentDocReset] = useState(false);

	// CONTEXT
	const {
		docStructure,
		setDocStructure,
		docStructureRef,
		linkStructure,
		setLinkStructure,
		mediaStructure,
		setMediaStructure,
		project,
		setProject,
		navData,
		setNavData,
		navDataRef,
		setEditorArchives,
		peekWindowLinkId,
		setDisplayLinkPopper,
		editorStateRef,
		setEditorStateRef,
		linkStructureRef,
		setSyncLinkIdList,
		showUploadImage,
	} = useContext(LeftNavContext);
	const {
		setShowFindReplace,
		setReplaceDefaultOn,
		setRefocusFind,
		setRefocusReplace,
	} = useContext(FindReplaceContext);
	const { showEditorSettings } = useContext(SettingsContext);

	// HiddenContextMenu();
	console.log('appMgmt refreshed!!');

	// Loads the document map (function)
	const loadDocStructure = useCallback(
		async ({ isNewProject = false }) => {
			const newDocStructure = await ipcRenderer.invoke(
				'read-single-document',
				project.tempPath,
				'documentStructure.json'
			);
			setDocStructure(newDocStructure.fileContents);
			setStructureLoaded(true);
			isNewProject && setNeedCurrentDocReset(true);
		},
		[setDocStructure, setStructureLoaded, project.tempPath]
	);

	// Loads the document link structure (function)
	const loadLinkStructure = useCallback(async () => {
		const newLinkStructure = await ipcRenderer.invoke(
			'read-single-document',
			project.tempPath,
			'linkStructure.json'
		);
		setLinkStructure(newLinkStructure.fileContents);
		setLinkStructureLoaded(true);
	}, [setLinkStructure, project.tempPath]);

	// Loads the document media structure (function)
	const loadMediaStructure = useCallback(async () => {
		const newMediaStructure = await ipcRenderer.invoke(
			'read-single-document',
			project.tempPath,
			'mediaStructure.json'
		);
		setMediaStructure(newMediaStructure.fileContents);
		setMediaStructureLoaded(true);
	}, [setMediaStructure, project.tempPath]);

	const resetCurrentDoc = useCallback(() => {
		// Find the first document in the first tab with contents
		const tabList = ['draft', 'pages', 'research'];
		let response, currentTab;
		for (let i = 0; i <= tabList.length && !response; i++) {
			response = findFirstDocInFolder(docStructure[tabList[i]]);
			if (response) {
				currentTab = tabList[i];
			}
		}

		// let response = findFirstDocInFolder(newDocStructure[currentTab]);
		if (response) {
			// Document was found. Mark the document as the currentDoc.
			setNavData({
				...navData,
				currentTab: currentTab,
				currentDoc: response.docName,
				currentTempPath: project.tempPath,
				lastClicked: { type: 'doc', id: response.docId },
				parentFolders: response.parentFolders,
			});
		} else {
			// No documents found. Reset navData to default.
			console.log('No document was found in the current tab!');
			// Only set if currentDoc has contents. Otherwise, changing navData will trigger a recheck.
			if (navData.currentDoc !== '') {
				console.log('Resetting navData (currentDoc, currentTab, lastClicked, parentFolders)');
				setNavData({
					...navData,
					currentDoc: '',
					currentTab: 'draft',
					currentTempPath: project.tempPath,
					lastClicked: { type: '', id: '' },
					parentFolders: [],
				});
			}
		}
	}, [docStructure, navData, setNavData, project]);

	// Once the docStructure has loaded for a new project, load the first document
	useEffect(() => {
		if (needCurrentDocReset) {
			setNeedCurrentDocReset(false);
			resetCurrentDoc();
		}
	}, [needCurrentDocReset, resetCurrentDoc]);

	// Loads the document / link structures when the project changes
	useEffect(() => {
		if (prevProj !== project.tempPath && project.tempPath) {
			// Updates the program title with the updated file name
			if (project.jotsPath) {
				// Eventually use some sort of project name instead of the .jots file
				let lastSlash = project.jotsPath.lastIndexOf('/');
				let projectName = project.jotsPath.slice(lastSlash + 1);
				document.title = 'Jotling - ' + projectName;
			} else {
				document.title = 'Jotling';
			}

			// Loads the doc structure
			setEditorArchives({});
			loadDocStructure({ isNewProject: true });
			loadLinkStructure();
			loadMediaStructure();
			setPrevProj(project.tempPath);
		}
	}, [loadDocStructure, loadMediaStructure, prevProj, project]);

	// Saves the document map after every change
	useEffect(() => {
		if (structureLoaded) {
			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'documentStructure.json',
				docStructure
			);
			console.log('Saving document structure.');
		}
	}, [docStructure, structureLoaded, project]);

	// Saves the link structure after every change
	useEffect(() => {
		if (linkStructureLoaded) {
			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'linkStructure.json',
				linkStructure
			);
			console.log('Saving link structure.');
		}
	}, [linkStructure, linkStructureLoaded, project]);

	// Saves the mediaStructure after every change
	useEffect(() => {
		if (mediaStructureLoaded) {
			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'mediaStructure.json',
				mediaStructure
			);
			console.log('Saving link structure.');
		}
	}, [mediaStructure, mediaStructureLoaded, project]);

	// Registers ipcRenderer listeners
	useEffect(() => {
		// Registers the ipcRenderer listeners

		// Open Project - sets the new project paths
		ipcRenderer.on('open-project', (event, { tempPath, jotsPath }) => {
			if (tempPath && typeof tempPath === 'string' && typeof jotsPath === 'string') {
				setProject({
					tempPath: tempPath,
					jotsPath: jotsPath,
				});
			}
		});

		// Save Project - queues EditorContainer to request a save
		ipcRenderer.on('request-save-project', (event, shouldSave) => {
			setSaveProject({ command: 'save' });
		});

		// Save As Project - queues EditorContainer to request a save as
		ipcRenderer.on('request-save-as-project', (event, shouldSave) => {
			setSaveProject({ command: 'save-as', options: { saveAs: true } });
		});

		// Save Project and Quit - queues EditorContainer to request a save and quit
		ipcRenderer.on('request-save-and-quit', (event, shouldSave) => {
			setSaveProject({ command: 'save', options: { shouldQuit: true, shouldCleanup: true } });
		});

		// Save Project and Close - queues EditorContainer to request a save and quit
		ipcRenderer.on('request-save-and-close', (event, shouldSave) => {
			setSaveProject({ command: 'save', options: { shouldClose: true, shouldCleanup: true } });
		});

		// Save Project and Create New - queues EditorContainer to request a save and create new
		ipcRenderer.on('request-save-and-create-new', (event, shouldSave) => {
			setSaveProject({
				command: 'save',
				options: { shouldCreateNew: true, shouldCleanup: true },
			});
		});

		// Save Project and Open - queues EditorContainer to request a save and open another project
		ipcRenderer.on('request-save-and-open', (event, shouldSave, openJotsPath) => {
			setSaveProject({
				command: 'save',
				options: { shouldOpen: true, openJotsPath, shouldCleanup: true },
			});
		});

		// Save Project and Open - queues EditorContainer to request a save and open another project
		ipcRenderer.on('show-find-replace', (event, { replace }) => {
			if (replace) {
				// setReplaceDefaultOn(true);
				setRefocusReplace(true);
			} else {
				setRefocusFind(true);
			}
			setShowFindReplace(true);
		});

		ipcRenderer.on('insert-link', (event) => {
			if (document.getSelection().toString().length) {
				setDisplayLinkPopper(true);
			}
		});

		ipcRenderer.on('remove-link', (event) => {
			// IMPLEMENT A FUNCTION TO REMOVE LINKS FROM THE SELECTION
			console.log('will remove the link!');
			const newEditorState = removeLinkSourceFromSelection(
				editorStateRef.current,
				linkStructureRef.current,
				setLinkStructure,
				setSyncLinkIdList
			);
			setEditorStateRef.current(newEditorState);
		});

		ipcRenderer.on('insert-file', (event, { insertFileType, type, id, currentTab }) => {
			// Call the addFile function with the refFileType, refFileId, currentTab, docStructure, setDocStructure
			addFile(
				insertFileType,
				docStructureRef.current,
				setDocStructure,
				currentTab,
				type,
				Number(id),
				navDataRef.current,
				setNavData
			);
		});

		ipcRenderer.on('remove-file', (event, { removeFileType, id, currentTab }) => {
			// Maybe only let users delete empty folders??
			if (removeFileType === 'doc') {
				moveDocToTrash(
					docStructureRef.current,
					setDocStructure,
					currentTab,
					id,
					navDataRef.current,
					setNavData
				);
			}
			if (removeFileType === 'folder') {
				moveFolderToTrash(
					docStructureRef.current,
					setDocStructure,
					currentTab,
					id,
					navDataRef.current,
					setNavData
				);
			}
		});

		ipcRenderer.on('restore-doc', (event, { id }) => {
			restoreDocument(
				docStructureRef.current,
				setDocStructure,
				navDataRef.current,
				setNavData,
				id
			);
		});

		ipcRenderer.on('restore-folder', (event, { id }) => {
			restoreFolder(
				docStructureRef.current,
				setDocStructure,
				navDataRef.current,
				setNavData,
				id
			);
		});

		ipcRenderer.on('request-context-button', (event) => {
			if (document.getSelection().toString().length) {
				setDisplayLinkPopper(true);
			}
		});

		// ipcRenderer.on('edit-file-tree', (event, options) => {
		// 	console.log('received edit-file-tree request');
		// 	console.log('options: ', options);
		// 	// Handle the inserts / deletes
		// });

		// ipcRenderer.on('edit-file-tree', (event, options) => {
		// 	console.log('received edit-file-tree request');
		// 	console.log('options: ', options);
		// 	// Handle the inserts / deletes
		// });
	}, []);

	// If no current doc, finds the first document
	// useEffect(() => {
	// if (!navData.currentDoc && Object.keys(docStructure).length) {
	// 	console.log('no current doc, reseting');
	// 	resetCurrentDoc();
	// }
	// }, [docStructure, navData.currentDoc, resetCurrentDoc]);

	return (
		<>
			<TopNav />
			<LeftNav />
			<RightNav />
			{navData.currentDoc && <EditorContainer {...{ saveProject, setSaveProject }} />}
			<LoadingOverlay {...{ structureLoaded }} />
			{peekWindowLinkId !== null && <PeekDocument />}
			{showEditorSettings && <EditorSettings />}
			<HiddenContextMenu />
			{showUploadImage && <UploadImageForm />}
		</>
	);
};

export default AppMgmt;
