import React, { useEffect, useState, useContext, useCallback } from 'react';
import { ipcRenderer } from 'electron';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import PopupModal from '../../containers/PopupModal';
import NavDocumentTrash from './NavDocumentTrash';
import ConfirmDeleteForm from '../../forms/ConfirmDeleteForm';

import TrashSVG from '../../../assets/svg/TrashSVG';

import { deleteDocument, deleteFolder, buildFileStructure } from '../navFunctions';
import { findFilePath, retrieveContentAtPropertyPath } from '../../../utils/utils';

import Collapse from 'react-css-collapse';

const NavTrash = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(false);
	const [folderToDelete, setFolderToDelete] = useState(false);
	const [openFolders, setOpenFolders] = useState({});

	const {
		docStructure,
		docStructureRef,
		setDocStructure,
		linkStructureRef,
		setLinkStructure,
		navData,
		setNavData,
	} = useContext(LeftNavContext);

	// Toggles open/close on folders
	const handleFolderClick = useCallback(
		(folderId) => {
			setOpenFolders({ ...openFolders, [folderId]: !openFolders[folderId] });
		},
		[openFolders, setOpenFolders]
	);

	const handleFileDelete = useCallback(() => {
		let results;
		if (itemToDelete.type === 'doc') {
			results = deleteDocument(
				docStructureRef.current,
				linkStructureRef.current,
				itemToDelete.id,
				navData
			);
		}

		if (itemToDelete.type === 'folder') {
			results = deleteFolder(
				docStructureRef.current,
				linkStructureRef.current,
				itemToDelete.id,
				navData
			);
		}

		if (results) {
			results.navData && setNavData(results.navData);
			results.linkStructure && setLinkStructure(results.linkStructure);
			results.docStructure && setDocStructure(results.docStructure);
		}
	}, [itemToDelete, navData]);

	// Initialize the listener to set the itemToDelete
	useEffect(() => {
		ipcRenderer.on('delete-file', (event, { id, type }) => {
			const trashFilePath = findFilePath(docStructureRef.current.trash, '', type, Number(id));
			const trashChildrenPath = trashFilePath + (trashFilePath ? '/' : '') + 'children';

			const trashArray = retrieveContentAtPropertyPath(
				trashChildrenPath,
				docStructureRef.current.trash
			);
			const trashItem = trashArray.find((item) => item.id === Number(id));
			console.log('trashItem:', trashItem);

			setItemToDelete(trashItem);
		});
	}, []);

	return (
		<>
			<div className='file-nav folder'>
				<button className='file-nav folder title' onClick={() => setIsOpen(!isOpen)}>
					<div className='svg-wrapper'>
						<TrashSVG />
					</div>
					Trash ({docStructure.trash.children.length})
				</button>
				<Collapse isOpen={isOpen}>
					<div className='folder-contents'>
						{Object.keys(docStructure).length ? (
							buildFileStructure(
								docStructure['trash'],
								'',
								true,
								handleFolderClick,
								openFolders,
								setOpenFolders
							)
						) : (
							<></>
						)}
						{/* {docStructure.trash.children.map((item) => (
							<NavDocumentTrash child={item} key={item.id} />
						))} */}
					</div>
				</Collapse>
			</div>

			{/* Confirm Delete Document / Folder */}
			{itemToDelete !== false && (
				<PopupModal setDisplayModal={setItemToDelete} width='30rem'>
					<ConfirmDeleteForm
						setDisplayModal={setItemToDelete}
						message={
							itemToDelete.type === 'folder'
								? `the folder "${itemToDelete.name}" and all of its contents`
								: `the document "${itemToDelete.name}"`
						}
						deleteFunc={handleFileDelete}
					/>
				</PopupModal>
			)}
		</>
	);
};

export default NavTrash;
