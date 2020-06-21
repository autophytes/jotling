// Import dependencies
import React, { useState, useCallback, useEffect } from 'react';
import { ipcRenderer } from 'electron';

import TopNav from './navs/top-nav/TopNav';
import LeftNav from './navs/left-nav/LeftNav';
import RightNav from './navs/right-nav/RightNav';
import EditorContainer from './editor/EditorContainer';

const defaultDocStructure = {
	projectName: 'Test Project',
	draft: [
		{
			type: 'folder',
			name: 'Chapter 1',
			folderId: 1,
			children: [
				{ type: 'folder', name: 'Sub 1', folderId: 6, children: [] },
				{
					type: 'folder',
					name: 'Sub 2',
					folderId: 7,
					children: [
						{ type: 'doc', name: 'Sub sub 1', fileId: 1, fileName: 'lan23h2f.json' },
						{ type: 'doc', name: 'Sub sub 2', fileId: 2, fileName: 'j20rhs0s.json' },
						{ type: 'doc', name: 'Sub sub 3', fileId: 3, fileName: '0gh20f8l.json' },
					],
				},
			],
		},
		{ type: 'folder', name: 'Chapter 2', folderId: 2, children: [] },
		{ type: 'folder', name: 'Chapter 3', folderId: 3, children: [] },
		{ type: 'folder', name: 'Chapter 4', folderId: 4, children: [] },
		{ type: 'folder', name: 'Chapter 5', folderId: 5, children: [] },
	],
	research: [],
	pages: [],
};

const defaultDocStructure2 = {
	projectName: 'Test Project',
	draft: {
		folders: {
			1: {
				name: 'Chapter 1',
				folders: {
					6: { name: 'Sub 1', folders: {}, children: [] },
					7: {
						name: 'Sub 2',
						folders: {},
						children: [
							{ type: 'doc', name: 'Sub sub 1', id: 1, fileName: 'lan23h2f.json' },
							{ type: 'doc', name: 'Sub sub 2', id: 2, fileName: 'j20rhs0s.json' },
							{ type: 'doc', name: 'Sub sub 3', id: 3, fileName: '0gh20f8l.json' },
						],
					},
				},
				children: [
					{ type: 'folder', id: 6 },
					{ type: 'folder', id: 7 },
				],
			},
			2: { name: 'Chapter 2', folders: {}, children: [] },
			3: { name: 'Chapter 3', folders: {}, children: [] },
			4: { name: 'Chapter 4', folders: {}, children: [] },
			5: { name: 'Chapter 5', folders: {}, children: [] },
		},
		children: [
			{ type: 'folder', id: 1 },
			{ type: 'folder', id: 2 },
			{ type: 'folder', id: 3 },
			{ type: 'folder', id: 4 },
			{ type: 'folder', id: 5 },
		],
	},
	research: {
		folders: {},
		children: [],
	},
	pages: {
		folders: {},
		children: [],
	},
};

// Create main App component
const App = () => {
	const [docStructure, setDocStructure] = useState(defaultDocStructure2);
	const [currentDoc, setCurrentDoc] = useState('x023jfsf.json');
	const [currentProj, setCurrentProj] = useState('Test Project');

	// Loads the document map (function)
	const loadDocStructure = useCallback(async () => {
		const newDocStructure = await ipcRenderer.invoke(
			'read-single-document',
			'Jotling/' + currentProj,
			'DocumentStructure.json'
		);
		setDocStructure(newDocStructure);
		console.log('Loaded document structure.');
	}, [setDocStructure, currentProj]);

	// Saves the document map after every change
	useEffect(() => {
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
	}, [docStructure]);

	// const loadFile = () => {
	// 	const loadFileFromSave = async () => {
	// 		const loadedFile = await ipcRenderer.invoke(
	// 			'read-single-document',
	// 			'Jotling/Test Project',
	// 			'x023jfsf.json'
	// 		);
	// 		console.log(loadedFile);
	// 		const newContentState = convertFromRaw(loadedFile.fileContents);
	// 		const newEditorState = EditorState.createWithContent(newContentState);
	// 		setEditorState(newEditorState);
	// 	};
	// 	loadFileFromSave();
	// };

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

// Export the App component
export default App;
