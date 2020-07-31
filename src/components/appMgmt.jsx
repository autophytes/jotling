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
	const [saveProject, setSaveProject] = useState('');

	const {
		docStructure,
		setDocStructure,
		project,
		setProject,
		navData,
		setNavData,
	} = useContext(LeftNavContext);

	// Loads the document map (function)
	const loadDocStructure = useCallback(async () => {
		console.log('Loading the new document structure...');
		const newDocStructure = await ipcRenderer.invoke(
			'read-single-document',
			project.tempPath,
			'documentStructure.json'
		);
		setDocStructure(newDocStructure.fileContents);
		setStructureLoaded(true);
	}, [setDocStructure, setStructureLoaded, project.tempPath]);

	// Resets the width of the side nav bars
	const resetNavWidth = useCallback(
		(whichNav) => {
			setEditorWidth({ ...editorWidth, [whichNav]: DEFAULT_WIDTH });
		},
		[editorWidth]
	);

	// Loads the document structure when the project changes
	useEffect(() => {
		if (prevProj !== project.tempPath && project.tempPath) {
			loadDocStructure();
			setPrevProj(project.tempPath);
		}
	}, [loadDocStructure, prevProj, project.tempPath]);

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
			console.log('event: ', event);
			if (tempPath && typeof tempPath === 'string' && typeof jotsPath === 'string') {
				setProject({
					tempPath: tempPath,
					jotsPath: jotsPath,
				});
			}
		});

		// Save Project - queues EditorContainer to request a save
		ipcRenderer.on('request-save-project', (event, shouldSave) => {
			setSaveProject('save');
		});

		// Save As Project - queues EditorContainer to request a save as
		ipcRenderer.on('request-save-as-project', (event, shouldSave) => {
			setSaveProject('save-as');
		});
	}, []);

	// // SAVE the project with the tempPath and jotsPath
	// useEffect(() => {
	// 	if (shouldSaveProject) {
	// 		ipcRenderer.invoke('save-project', project.tempPath, project.jotsPath);
	// 		setShouldSaveProject(false);
	// 	}
	// }, [shouldSaveProject, project]);

	// // SAVE AS the project with the tempPath and jotsPath
	// useEffect(() => {
	// 	if (shouldSaveAsProject) {
	// 		// Leave the jotsPath argument blank to indicate a Save As
	// 		ipcRenderer.invoke('save-project', project.tempPath, '');
	// 		setShouldSaveAsProject(false);
	// 	}
	// }, [shouldSaveAsProject, project]);

	return (
		<>
			<TopNav />
			<LeftNav {...{ editorWidth, setEditorWidth, resetNavWidth }} />
			<RightNav {...{ editorWidth, setEditorWidth, resetNavWidth }} />
			{/* <LeftNav editorWidth={editorWidth} setEditorWidth={setEditorWidth} />
			<RightNav editorWidth={editorWidth} setEditorWidth={setEditorWidth} /> */}
			{/* <ReactResizeDetector handleWidth> */}
			<EditorContainer {...{ editorWidth, saveProject, setSaveProject }} />
			{/* </ReactResizeDetector> */}
			<LoadingOverlay {...{ structureLoaded }} />
		</>
	);
};

export default AppMgmt;
