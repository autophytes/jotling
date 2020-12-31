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

	// When resetting the current document, open the parent folders of the first document
	useEffect(() => {
		if (parentFolders) {
			let newOpenFolders = {};
			for (let folderId of parentFolders) {
				newOpenFolders[folderId] = true;
			}
			setNavData((prev) => ({ ...prev, parentFolders: null }));
			setOpenFolders({ ...newOpenFolders });
		}
	}, [parentFolders]);

	// Toggles open/close on folders
	const handleFolderClick = useCallback((folderId) => {
		setOpenFolders((prev) => ({
			...prev,
			[folderId]: !prev[folderId],
		}));
		setNavData((prev) => ({
			...prev,
			lastClicked: { type: 'folder', id: folderId },
		}));
	}, []);

	// Toggles open/close on folders
	const openCloseFolder = useCallback((folderId, isOpen) => {
		setOpenFolders((prev) => {
			if (prev[folderId] !== isOpen) {
				return { ...prev, [folderId]: isOpen };
			}
			return prev;
		});
	}, []);

	return (
		<div className='left-nav-content'>
			{Object.keys(docStructure).length
				? buildFileStructure(
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
				: null}

			<hr />
			{navData.currentTab === 'pages' && <WikiTemplates />}
			{docStructure.trash && <NavTrash />}
		</div>
	);
};

export default LeftNavContent;
