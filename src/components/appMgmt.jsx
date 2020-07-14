// Import dependencies
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { ipcRenderer } from 'electron';

import TopNav from './navs/top-nav/TopNav';
import LeftNav from './navs/left-nav/LeftNav';
import RightNav from './navs/right-nav/RightNav';
import EditorContainer from './editor/EditorContainer';

// import LeftNavContextProvider from '../contexts/leftNavContext';
import { LeftNavContext } from '../contexts/leftNavContext';

// import ReactResizeDetector from 'react-resize-detector';

// Create main App component
const AppMgmt = () => {
	const [structureLoaded, setStructureLoaded] = useState(false);
	const [prevProj, setPrevProj] = useState('');
	const [editorWidth, setEditorWidth] = useState({
		leftNav: 12,
		leftIsPinned: true,
		rightNav: 12,
		rightIsPinned: true,
	});

	const { docStructure, setDocStructure, navData } = useContext(LeftNavContext);

	// Loads the document map (function)
	const loadDocStructure = useCallback(async () => {
		console.log('Loading the new document structure...');
		const newDocStructure = await ipcRenderer.invoke(
			'read-single-document',
			'Jotling/' + navData.currentProj,
			'DocumentStructure.json'
		);
		setDocStructure(newDocStructure.fileContents);
		setStructureLoaded(true);
	}, [setDocStructure, setStructureLoaded, navData.currentProj]);

	// Loads the document structure when the project changes
	useEffect(() => {
		if (prevProj !== navData.currentProj) {
			loadDocStructure();
			setPrevProj(navData.currentProj);
		}
	}, [loadDocStructure, prevProj, navData.currentProj]);

	// Saves the document map after every change
	useEffect(() => {
		if (structureLoaded) {
			const saveDocStructure = async () => {
				const saveResponse = await ipcRenderer.invoke(
					'save-single-document',
					'Jotling/Test Project',
					'DocumentStructure.json',
					docStructure
				);
				console.log(saveResponse);
			};
			saveDocStructure();
			console.log('Saving document structure.');
		}
	}, [docStructure, structureLoaded]);

	return (
		<>
			<TopNav />
			<LeftNav editorWidth={editorWidth} setEditorWidth={setEditorWidth} />
			<RightNav editorWidth={editorWidth} setEditorWidth={setEditorWidth} />
			{/* <ReactResizeDetector handleWidth> */}
			<EditorContainer editorWidth={editorWidth} />
			{/* </ReactResizeDetector> */}
		</>
	);
};

export default AppMgmt;
