// Import dependencies
import React, { useState, useCallback, useEffect, useContext, useRef } from 'react';
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
import { loadProjectFiles, duplicateDocument } from './appMgmtFunctions';

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
		wikiMetadataRef,
		mediaStructureRef,
		commentStructure,
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
		setDisplayCommentPopper,
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

	// REF
	const syncDocumentWithFilesRef = useRef(null);

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

	// Create syncDocumentWithFilesRef function
	useEffect(() => {
		syncDocumentWithFilesRef.current = (fileName, fileObj) => {
			if (isProjectLoaded) {
				ipcRenderer.invoke(
					'save-single-document',
					project.tempPath,
					project.jotsPath,
					fileName,
					fileObj
				);
				console.log('Saving ', fileName);
			}
		};
	}, [project, isProjectLoaded]);

	// Saves the docStructure after every change
	useEffect(() => {
		syncDocumentWithFilesRef.current('documentStructure.json', docStructure);
	}, [docStructure]);

	// Saves the linkStructure after every change
	useEffect(() => {
		syncDocumentWithFilesRef.current('linkStructure.json', linkStructure);
	}, [linkStructure]);

	// Saves the mediaStructure after every change
	useEffect(() => {
		syncDocumentWithFilesRef.current('mediaStructure.json', mediaStructure);
	}, [mediaStructure]);

	// Saves the wikiMetadata after every change
	useEffect(() => {
		syncDocumentWithFilesRef.current('wikiMetadata.json', wikiMetadata);
	}, [wikiMetadata]);

	// Saves the wikiMetadata after every change
	useEffect(() => {
		syncDocumentWithFilesRef.current('commentStructure.json', commentStructure);
	}, [commentStructure]);

	// Registers ipcRenderer listeners
	useEffect(() => {
		// Registers the ipcRenderer listeners

		// Open Project - sets the new project paths
		ipcRenderer.on('open-project', (e, { tempPath, jotsPath }) => {
			if (tempPath && typeof tempPath === 'string' && typeof jotsPath === 'string') {
				setProject({
					tempPath: tempPath,
					jotsPath: jotsPath,
				});
			}
		});

		// Save Project - queues EditorContainer to request a save
		ipcRenderer.on('request-save-project', (e, shouldSave) => {
			setSaveProject({ command: 'save' });
		});

		// Save As Project - queues EditorContainer to request a save as
		ipcRenderer.on('request-save-as-project', (e, shouldSave) => {
			setSaveProject({ command: 'save-as', options: { saveAs: true } });
		});

		// Save Project and Quit - queues EditorContainer to request a save and quit
		ipcRenderer.on('request-save-and-quit', (e, shouldSave) => {
			setSaveProject({ command: 'save', options: { shouldQuit: true, shouldCleanup: true } });
		});

		// Save Project and Close - queues EditorContainer to request a save and quit
		ipcRenderer.on('request-save-and-close', (e, shouldSave) => {
			setSaveProject({ command: 'save', options: { shouldClose: true, shouldCleanup: true } });
		});

		// Save Project and Create New - queues EditorContainer to request a save and create new
		ipcRenderer.on('request-save-and-create-new', (e, shouldSave) => {
			setSaveProject({
				command: 'save',
				options: { shouldCreateNew: true, shouldCleanup: true },
			});
		});

		// Save Project and Open - queues EditorContainer to request a save and open another project
		ipcRenderer.on('request-save-and-open', (e, shouldSave, openJotsPath) => {
			setSaveProject({
				command: 'save',
				options: { shouldOpen: true, openJotsPath, shouldCleanup: true },
			});
		});

		// Save Project and Open - queues EditorContainer to request a save and open another project
		ipcRenderer.on('show-find-replace', (e, { replace, wholeProject }) => {
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

		ipcRenderer.on('insert-link', (e) => {
			if (document.getSelection().toString().length) {
				setDisplayWikiPopper(true);
			}
		});

		ipcRenderer.on('remove-link', (e) => {
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

		ipcRenderer.on('insert-file', (e, { insertFileType, type, id, currentTab }) => {
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

		ipcRenderer.on('remove-file', (e, { removeFileType, id, currentTab }) => {
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

		ipcRenderer.on('rename-file', (e, { id, type }) => {
			setNavData((prev) => ({
				...prev,
				editFile: `${type}-${id}`,
			}));
		});

		ipcRenderer.on('restore-doc', (e, { id }) => {
			restoreDocument(
				docStructureRef.current,
				setDocStructure,
				navDataRef.current,
				setNavData,
				id
			);
		});

		ipcRenderer.on('restore-folder', (e, { id }) => {
			restoreFolder(
				docStructureRef.current,
				setDocStructure,
				navDataRef.current,
				setNavData,
				id
			);
		});

		ipcRenderer.on('request-context-button', (e) => {
			if (document.getSelection().toString().length) {
				setDisplayWikiPopper(true);
			}
		});

		ipcRenderer.on('request-export-project', (e, { extension }) => {
			exportProject({
				editorStateRef,
				editorArchivesRef,
				mediaStructureRef,
				docStructureRef,
				projectRef,
				currentDoc: navDataRef.current.currentDoc,
			});
		});

		ipcRenderer.on('show-wiki-tags', (e, { docId, docName }) => {
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

		ipcRenderer.on('duplicate-document', (e, { docId, currentTab }) => {
			duplicateDocument({
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
				wikiMetadataRef,
				setWikiMetadata,
			});
		});

		ipcRenderer.on('insert-comment', (e) => {
			if (document.getSelection().toString().length) {
				setDisplayCommentPopper(true);
			}
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
