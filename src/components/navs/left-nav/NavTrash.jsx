import React, { useEffect, useState, useContext, useCallback } from 'react';
import { ipcRenderer } from 'electron';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import PopupModal from '../../containers/PopupModal';
import ConfirmDeleteForm from '../../forms/ConfirmDeleteForm';

import TrashSVG from '../../../assets/svg/TrashSVG';

import { deleteDocument, buildFileStructure } from '../navFunctions';
import Collapse from 'react-css-collapse';
import NavDocumentTrash from './NavDocumentTrash';

const NavTrash = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [docToDelete, setDocToDelete] = useState(false);
	const [openFolders, setOpenFolders] = useState({});

	// Toggles open/close on folders
	const handleFolderClick = useCallback(
		(folderId) => {
			setOpenFolders({ ...openFolders, [folderId]: !openFolders[folderId] });
		},
		[openFolders, setOpenFolders]
	);

	const {
		docStructure,
		docStructureRef,
		setDocStructure,
		linkStructureRef,
		setLinkStructure,
		navData,
		setNavData,
	} = useContext(LeftNavContext);

	useEffect(() => {
		ipcRenderer.on('delete-doc', (event, { id }) => {
			const trashArray = docStructureRef.current.trash.children;
			const trashItem = trashArray.find((item) => item.id === Number(id));
			console.log('trashItem: ', trashItem);

			setDocToDelete(trashItem);
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

			{/* Confirm Delete */}
			{docToDelete !== false && (
				<PopupModal setDisplayModal={setDocToDelete} width='30rem'>
					<ConfirmDeleteForm
						setDisplayModal={setDocToDelete}
						message={`the document "${docToDelete.name}"`}
						deleteFunc={() =>
							deleteDocument(
								docStructureRef.current,
								setDocStructure,
								linkStructureRef.current,
								setLinkStructure,
								docToDelete.id,
								navData,
								setNavData
							)
						}
					/>
				</PopupModal>
			)}
		</>
	);
};

export default NavTrash;
