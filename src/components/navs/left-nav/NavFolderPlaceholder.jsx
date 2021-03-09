import React, { useCallback, useState, useContext } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { moveFileToPath } from '../../../utils/utils';

const NavFolderPlaceholder = ({ path, folderId, currentlyDragging }) => {
	const [fileStyles, setFileStyles] = useState({});

	const { navData, docStructure, setDocStructure } = useContext(LeftNavContext);

	// Determines whether currently dragging over the top/bottom half of the folder
	const handleDragOver = (e) => {
		e.preventDefault(); // Necessary for onDrop

		setFileStyles({ borderTop: '2px solid var(--color-primary)' });
	};

	// Moves the file to below the destination folder on drop
	const handleDrop = useCallback(
		(e) => {
			let newCurrentFolder = moveFileToPath(
				docStructure[navData.currentTab],
				currentlyDragging,
				{ type: 'folder', id: folderId, path },
				'bottom'
			);
			setDocStructure({ ...docStructure, [navData.currentTab]: newCurrentFolder });

			setFileStyles({});
		},
		[docStructure, navData, currentlyDragging, path, moveFileToPath]
	);

	return (
		<div
			className='file-nav-folder-placeholder'
			style={fileStyles}
			onDragLeave={() => setFileStyles({})}
			onDragOver={handleDragOver}
			onDrop={handleDrop}></div>
	);
};

export default NavFolderPlaceholder;
