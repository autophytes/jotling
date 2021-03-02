// Import dependencies
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { ipcRenderer } from 'electron';
import { convertFromRaw, EditorState } from 'draft-js';

import TopNav from './navs/top-nav/TopNav';
import LeftNav from './navs/left-nav/LeftNav';
import RightNav from './navs/right-nav/RightNav';
import EditorContainer from './editor/EditorContainer';

// import LeftNavContextProvider from '../contexts/leftNavContext';
import { LeftNavContext } from '../contexts/leftNavContext';
import { FindReplaceContext } from '../contexts/findReplaceContext';
import { SettingsContext } from '../contexts/settingsContext';
import { RightNavContext } from '../contexts/rightNavContext';

import LoadingOverlay from './loadingOverlay';

import { findFirstDocInFolder } from '../utils/utils';
import { removeLinkSourceFromSelection } from './editor/editorFunctions';
import {
	addFile,
	moveDocToTrash,
	restoreDocument,
	restoreFolder,
	moveFolderToTrash,
} from './navs/navFunctions';

import PeekDocument from './editor/PeekDocument';
import EditorSettings from './navs/top-nav/EditorSettings';
import HiddenContextMenu from './hiddenContextMenu';

import UploadImageForm from './forms/UploadImageForm';

import { exportProject } from './export/export';
import { loadProjectFiles } from './appMgmtFunctions';

// For an example of how we can use web workers. Webpack already configured. Doesn't work with Draft.
//   https://willowtreeapps.com/ideas/improving-web-app-performance-with-web-worker
// import ExampleWorker from '../../webWorkers/exampleWorker';

// Create main App component
const AppMgmt = () => {
	// STATE
	const [isProjectLoaded, setIsProjectLoaded] = useState(false);
	const [prevProj, setPrevProj] = useState('');
	const [saveProject, setSaveProject] = useState({});

	// CONTEXT
	const {
		docStructure,
		setDocStructure,
		docStructureRef,
		linkStructure,
		setLinkStructure,
		linkStructureRef,
		mediaStructure,
		setMediaStructure,
		wikiMetadata,
		setWikiMetadata,
		mediaStructureRef,
		project,
		setProject,
		projectRef,
		navData,
		setNavData,
		navDataRef,
		editorArchivesRef,
		setEditorArchives,
		peekWindowLinkId,
		setDisplayWikiPopper,
		editorStateRef,
		setEditorStateRef,
		setSyncLinkIdList,
		showUploadImage,
		saveFileRef,
		setEditorStyles,
	} = useContext(LeftNavContext);
	const {
		setShowFindReplace,
		setRefocusFind,
		setRefocusReplace,
		setShowFindAll,
		setRefocusFindAll,
		setRefocusReplaceAll,
		setFindText,
	} = useContext(FindReplaceContext);
	const { showEditorSettings } = useContext(SettingsContext);
	const { setActiveTab: setRightNavActiveTab } = useContext(RightNavContext);

	// HiddenContextMenu();
	console.log('appMgmt refreshed!!');

	// Loads the document / link structures when the project changes
	useEffect(() => {
		if (prevProj !== project.tempPath && project.tempPath) {
			// Loads the doc structure
			setEditorArchives({});

			// Load all project JSON files on project change
			loadProjectFiles({
				setDocStructure,
				setLinkStructure,
				setMediaStructure,
				setWikiMetadata,
				setNavData,
				setIsProjectLoaded,
				setEditorArchives,
				docStructureRef,
				tempPath: project.tempPath,
			});

			setPrevProj(project.tempPath);
		}
	}, [prevProj, project]);

	// Updates the application title when the project changes
	useEffect(() => {
		if (project.jotsPath) {
			// Eventually use some sort of project name instead of the .jots file
			let lastSlash = project.jotsPath.lastIndexOf('/');
			let projectName = project.jotsPath.slice(lastSlash + 1);
			document.title = 'Jotling - ' + projectName;
		} else {
			document.title = 'Jotling';
		}
	}, [project]);

	// Saves the docStructure after every change
	useEffect(() => {
		if (isProjectLoaded) {
			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'documentStructure.json',
				docStructure
			);
			console.log('Saving document structure.');
			// console.log('to project.tempPath:', project.tempPath);
		}
	}, [docStructure, isProjectLoaded, project]);

	// Saves the linkStructure after every change
	useEffect(() => {
		if (isProjectLoaded) {
			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'linkStructure.json',
				linkStructure
			);
			console.log('Saving link structure.');
		}
	}, [linkStructure, isProjectLoaded, project]);

	// Saves the mediaStructure after every change
	useEffect(() => {
		if (isProjectLoaded) {
			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'mediaStructure.json',
				mediaStructure
			);
			console.log('Saving media structure.');
		}
	}, [mediaStructure, isProjectLoaded, project]);

	// Saves the wikiMetadata after every change
	useEffect(() => {
		if (isProjectLoaded) {
			ipcRenderer.invoke(
				'save-single-document',
				project.tempPath,
				project.jotsPath,
				'wikiMetadata.json',
				wikiMetadata
			);
			// console.log('wikiMetadata:', wikiMetadata);
			console.log('Saving wiki metadata.');
			// console.log('to project.tempPath:', project.tempPath);
		}
	}, [wikiMetadata, isProjectLoaded, project]);

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
		ipcRenderer.on('show-find-replace', (event, { replace, wholeProject }) => {
			// Reset here
			// setFindText('');

			if (!wholeProject) {
				setShowFindAll((prev) => {
					prev && setFindText('');
					return false;
				}); // Close whole project find

				if (replace) {
					setRefocusReplace(true);
				} else {
					setRefocusFind(true);
				}
				setShowFindReplace(true);
			}

			if (wholeProject) {
				setShowFindReplace((prev) => {
					prev && setFindText('');
					return false;
				}); // Close local find

				if (replace) {
					setRefocusReplaceAll(true);
				} else {
					setRefocusFindAll(true);
				}
				setShowFindAll(true);
			}
		});

		ipcRenderer.on('insert-link', (event) => {
			if (document.getSelection().toString().length) {
				setDisplayWikiPopper(true);
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
				setNavData,
				saveFileRef
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

		ipcRenderer.on('rename-file', (event, { id, type }) => {
			setNavData((prev) => ({
				...prev,
				editFile: `${type}-${id}`,
			}));
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
				setDisplayWikiPopper(true);
			}
		});

		ipcRenderer.on('request-export-project', (event, { extension }) => {
			exportProject({
				editorStateRef,
				editorArchivesRef,
				mediaStructureRef,
				docStructureRef,
				projectRef,
				currentDoc: navDataRef.current.currentDoc,
			});
		});

		ipcRenderer.on('show-wiki-tags', (event, { docId, docName }) => {
			console.log('docName:', docName);
			setWikiMetadata((prev) => ({
				...prev,
				displayDoc: docName ? docName : `doc${docId}.json`,
			}));
			setRightNavActiveTab('tags');
			setEditorStyles((prev) => ({
				...prev,
				rightIsPinned: true,
			}));
		});
	}, []);

	return (
		<>
			<TopNav />
			<LeftNav />
			<RightNav />

			{navData.currentDoc && <EditorContainer {...{ saveProject, setSaveProject }} />}

			<LoadingOverlay {...{ isProjectLoaded }} />
			{peekWindowLinkId !== null && <PeekDocument />}
			{showEditorSettings && <EditorSettings />}
			<HiddenContextMenu />
			{showUploadImage && <UploadImageForm />}
		</>
	);
};

export default AppMgmt;
