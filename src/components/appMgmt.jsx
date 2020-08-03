// Import dependencies
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { ipcRenderer } from 'electron';

import TopNav from './navs/top-nav/TopNav';
import LeftNav from './navs/left-nav/LeftNav';
import RightNav from './navs/right-nav/RightNav';
import EditorContainer from './editor/EditorContainer';

// import LeftNavContextProvider from '../contexts/leftNavContext';
import { LeftNavContext } from '../contexts/leftNavContext';
import LoadingOverlay from './loadingOverlay';

import { findFirstDocInFolder } from '../utils/utils';
import Store from 'electron-store';
console.log(Store);

// import ReactResizeDetector from 'react-resize-detector';

// CONSTANTS
const DEFAULT_WIDTH = 12;

// Create main App component
const AppMgmt = () => {
	const [structureLoaded, setStructureLoaded] = useState(false);
	const [prevProj, setPrevProj] = useState('');
	const [editorWidth, setEditorWidth] = useState({
		leftNav: DEFAULT_WIDTH,
		leftIsPinned: true,
		rightNav: DEFAULT_WIDTH,
		rightIsPinned: true,
	});
	const [saveProject, setSaveProject] = useState({});
	const [needCurrentDocReset, setNeedCurrentDocReset] = useState(false);

	const {
		docStructure,
		setDocStructure,
		project,
		setProject,
		navData,
		setNavData,
	} = useContext(LeftNavContext);

	// Loads the document map (function)
	const loadDocStructure = useCallback(
		async ({ isNewProject = false }) => {
			console.log('Loading the new document structure...');
			console.log('isNewProject: ', isNewProject);
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

	// Resets the width of the side nav bars
	const resetNavWidth = useCallback(
		(whichNav) => {
			setEditorWidth({ ...editorWidth, [whichNav]: DEFAULT_WIDTH });
		},
		[editorWidth]
	);

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
			console.log('Top document was found!');
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

	// Loads the document structure when the project changes
	useEffect(() => {
		if (prevProj !== project.tempPath && project.tempPath) {
			// Updates the program title with the updated file name
			if (project.jotsPath) {
				let lastSlash = project.jotsPath.lastIndexOf('/');
				let projectName = project.jotsPath.slice(lastSlash + 1);
				document.title = 'Jotling - ' + projectName;
				console.log('new document.title: ', projectName);
			}

			// Loads the doc structure
			loadDocStructure({ isNewProject: true });
			setPrevProj(project.tempPath);
		}
	}, [loadDocStructure, prevProj, project]);

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
	}, [docStructure, structureLoaded, project.tempPath]);

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
			setSaveProject({ command: 'save-as' });
		});

		// Save Project and Quit - queues EditorContainer to request a save and quit
		ipcRenderer.on('request-save-and-quit', (event, shouldSave) => {
			setSaveProject({ command: 'save', options: { shouldQuit: true } });
		});

		// Save Project and Quit - queues EditorContainer to request a save and quit
		ipcRenderer.on('request-save-and-close', (event, shouldSave) => {
			setSaveProject({ command: 'save', options: { shouldClose: true } });
		});

		// Save Project and Create New - queues EditorContainer to request a save and create new
		ipcRenderer.on('request-save-and-create-new', (event, shouldSave) => {
			setSaveProject({ command: 'save', options: { shouldCreateNew: true } });
		});

		// Save Project and Open - queues EditorContainer to request a save and open another project
		ipcRenderer.on('request-save-and-open', (event, shouldSave, openJotsPath) => {
			setSaveProject({ command: 'save', options: { shouldOpen: true, openJotsPath } });
		});
	}, []);

	// If no current doc, finds the first document
	useEffect(() => {
		if (!navData.currentDoc && Object.keys(docStructure).length) {
			console.log('no current doc, reseting');
			resetCurrentDoc();
		}
	}, [docStructure, navData.currentDoc, resetCurrentDoc]);

	return (
		<>
			<TopNav />
			<LeftNav {...{ editorWidth, setEditorWidth, resetNavWidth }} />
			<RightNav {...{ editorWidth, setEditorWidth, resetNavWidth }} />
			<EditorContainer {...{ editorWidth, saveProject, setSaveProject }} />
			<LoadingOverlay {...{ structureLoaded }} />
		</>
	);
};

export default AppMgmt;
