import React, { useCallback, useState, useContext, useEffect } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import NavTrash from './NavTrash';
import WikiTemplates from './WikiTemplates';

import { buildFileStructure } from '../navFunctions';

const LeftNavContent = () => {
	const [openFolders, setOpenFolders] = useState({});
	const [currentlyDragging, setCurrentlyDragging] = useState({ type: '', id: '', path: '' });

	const { docStructure, navData, setNavData } = useContext(LeftNavContext);
	const { parentFolders } = navData;

	// When opening a new document, open the parent folders of the first document
	useEffect(() => {
		if (parentFolders) {
			let newOpenFolders = {};
			for (let folderId of parentFolders) {
				newOpenFolders[folderId] = true;
			}
			setNavData({ ...navData, parentFolders: null });
			setOpenFolders({ ...newOpenFolders });
		}
	}, [parentFolders, openFolders, navData]);

	// Toggles open/close on folders
	const handleFolderClick = useCallback(
		(folderId) => {
			setOpenFolders({ ...openFolders, [folderId]: !openFolders[folderId] });
			setNavData({ ...navData, lastClicked: { type: 'folder', id: folderId } });
		},
		[openFolders, setOpenFolders, navData]
	);

	// Toggles open/close on folders
	const openCloseFolder = useCallback(
		(folderId, isOpen) => {
			if (openFolders[folderId] !== isOpen) {
				setOpenFolders({ ...openFolders, [folderId]: isOpen });
			}
		},
		[openFolders, setOpenFolders]
	);

	return (
		<div className='left-nav-content'>
			{Object.keys(docStructure).length ? (
				buildFileStructure(
					docStructure[navData.currentTab],
					'',
					false,
					handleFolderClick,
					openFolders,
					setOpenFolders,
					openCloseFolder,
					currentlyDragging,
					setCurrentlyDragging
				)
			) : (
				<></>
			)}

			<hr />
			{navData.currentTab === 'pages' && <WikiTemplates />}
			{docStructure.trash && <NavTrash />}
		</div>
	);
};

export default LeftNavContent;
