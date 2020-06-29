// Import dependencies
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { ipcRenderer } from 'electron';

import TopNav from './navs/top-nav/TopNav';
import LeftNav from './navs/left-nav/LeftNav';
import RightNav from './navs/right-nav/RightNav';
import EditorContainer from './editor/EditorContainer';

// import LeftNavContextProvider from '../contexts/leftNavContext';
import { LeftNavContext } from '../contexts/leftNavContext';

// Create main App component
const AppMgmt = () => {
	// const [docStructure, setDocStructure] = useState({});
	const [structureLoaded, setStructureLoaded] = useState(false);
	const [currentDoc, setCurrentDoc] = useState('x023jfsf.json');
	const [currentProj, setCurrentProj] = useState('Test Project');
	const [prevProj, setPrevProj] = useState('');

	const { docStructure, setDocStructure } = useContext(LeftNavContext);

	// Loads the document map (function)
	const loadDocStructure = useCallback(async () => {
		console.log('Loading the new document structure...');
		const newDocStructure = await ipcRenderer.invoke(
			'read-single-document',
			'Jotling/' + currentProj,
			'DocumentStructure.json'
		);
		setDocStructure(newDocStructure.fileContents);
		setStructureLoaded(true);
	}, [setDocStructure, setStructureLoaded, currentProj]);

	// Loads the document structure when the project changes
	useEffect(() => {
		if (prevProj !== currentProj) {
			loadDocStructure();
			setPrevProj(currentProj);
		}
	}, [loadDocStructure, prevProj, currentProj]);

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
			<LeftNav
				docStructure={docStructure}
				setDocStructure={setDocStructure}
				currentDoc={currentDoc}
				setCurrentDoc={setCurrentDoc}
			/>
			<RightNav />
			<EditorContainer currentProj={currentProj} currentDoc={currentDoc} />
		</>
	);
};

export default AppMgmt;
