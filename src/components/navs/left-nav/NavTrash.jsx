import React, { useEffect, useState, useContext, useCallback } from 'react';
import { ipcRenderer } from 'electron';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import PopupModal from '../../containers/PopupModal';
import ConfirmDeleteForm from '../../forms/ConfirmDeleteForm';

import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';
import TrashSVG from '../../../assets/svg/TrashSVG';

import { deleteDocument } from '../navFunctions';
import Collapse from 'react-css-collapse';

const NavTrash = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [docToDelete, setDocToDelete] = useState(false);

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
			const trashArray = docStructureRef.current.trash;
			const trashItem = trashArray.find((item) => item.id === Number(id));
			console.log('trashItem: ', trashItem);

			setDocToDelete(trashItem);
		});
	}, []);

	const handleClick = useCallback(
		(child) => {
			navData.currentDoc !== child.fileName &&
				setNavData({
					...navData,
					currentDoc: child.fileName,
					lastClicked: { type: 'doc', id: child.id },
				});
		},
		[setNavData, navData]
	);

	return (
		<>
			<div className='file-nav folder'>
				<button className='file-nav folder title' onClick={() => setIsOpen(!isOpen)}>
					<div className='svg-wrapper'>
						<TrashSVG />
					</div>
					Trash ({docStructure.trash.length})
				</button>
				<Collapse isOpen={isOpen}>
					<div className='folder-contents'>
						{docStructure.trash.map((item) => (
							<button
								key={item.id}
								onClick={() => handleClick(item)}
								data-context-menu-item-type='trash-doc'
								data-context-menu-item-id={item.id}
								className={
									'file-nav document' + (navData.currentDoc === item.fileName ? ' active' : '')
								}>
								<div className='svg-wrapper'>
									<DocumentSingleSVG />
								</div>
								<span>{item.name}</span>
							</button>
						))}
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
