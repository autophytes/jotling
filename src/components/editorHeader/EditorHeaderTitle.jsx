import React, { useContext, useEffect, useState } from 'react';

import { LeftNavContext } from '../../contexts/leftNavContext';

import {
	findFilePath,
	retrieveContentAtPropertyPath,
	setObjPropertyAtPropertyPath,
} from '../../utils/utils';

const EditorHeaderTitle = () => {
	const [docName, setDocName] = useState('');
	const [newDocName, setNewDocName] = useState('');
	const [showEditTitle, setShowEditTitle] = useState(false);

	const { navData, docStructure, setDocStructure } = useContext(LeftNavContext);

	// Synchronize the current document name
	useEffect(() => {
		const docId = Number(navData.currentDoc.slice(3, -5));
		const currentDocTab = navData.currentDocTab;
		const currentFolder = docStructure[currentDocTab];

		const filePath = findFilePath(currentFolder, '', 'doc', docId);
		if (typeof filePath !== 'undefined') {
			const childrenPath = filePath + (filePath ? '/' : '') + 'children';
			const childrenArray = retrieveContentAtPropertyPath(childrenPath, currentFolder);
			const doc = childrenArray.find((item) => item.type === 'doc' && item.id === docId);

			setDocName(doc.name);
			setNewDocName(doc.name);
		}
	}, [navData, docStructure]);

	// Save changes to the document title
	const saveNewDocName = () => {
		if (docName === newDocName) {
			setShowEditTitle(false);
			return;
		}

		const docId = Number(navData.currentDoc.slice(3, -5));
		const currentDocTab = navData.currentDocTab;
		const currentFolder = docStructure[currentDocTab];

		// Find the path to the file
		const filePath = findFilePath(currentFolder, '', 'doc', docId);

		// If we were able to find the file, update the n ame
		if (typeof filePath !== 'undefined') {
			// Grab a copy of the document
			const childrenPath = filePath + (filePath ? '/' : '') + 'children';
			let childrenArray = retrieveContentAtPropertyPath(childrenPath, currentFolder);
			const docIndex = childrenArray.findIndex(
				(item) => item.type === 'doc' && item.id === docId
			);
			const doc = childrenArray[docIndex];

			// Update the name in the document
			const newDoc = {
				...doc,
				name: newDocName,
			};

			// Update the current folder with the new document
			childrenArray[docIndex] = newDoc;
			const newCurrentFolder = setObjPropertyAtPropertyPath(
				childrenPath,
				childrenArray,
				currentFolder
			);

			// Update the docStructure with the new folder segment
			const newDocStructure = setObjPropertyAtPropertyPath(
				currentDocTab,
				newCurrentFolder,
				docStructure
			);

			setDocName(newDocName);
			setDocStructure(newDocStructure);
			setShowEditTitle(false);
		}
	};

	return (
		<>
			{/* TITLE */}
			{!showEditTitle && (
				<h2 className='editor-doc-title' onDoubleClick={() => setShowEditTitle(true)}>
					{docName}
				</h2>
			)}

			{/* EDIT TITLE */}
			{showEditTitle && (
				<input
					className='editor-doc-title-edit'
					type='text'
					value={newDocName}
					autoFocus
					onChange={(e) => setNewDocName(e.target.value)}
					onBlur={saveNewDocName}
					// onFocus={(e) => e.target.select()}
					onKeyUp={(e) => {
						console.log('keyup: ', e);
						if (e.key === 'Enter' || e.keyCode === 27) {
							console.log('saving new doc');
							saveNewDocName();
						}
					}}
				/>
			)}
		</>
	);
};

export default EditorHeaderTitle;
