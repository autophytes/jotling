import React, { useState, useContext, useCallback, useRef } from 'react';
import FolderClosedSVG from '../../../assets/svg/FolderClosedSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName, moveFileToPath } from '../../../utils/utils';

const NavFolderEmpty = ({ path, currentlyDragging }) => {
	const [folderStyles, setFolderStyles] = useState({});

	// REF
	const folderRef = useRef(null);

	// NEED A WAY to flag when currently dragged over so that when the 1sec timer goes off,
	// it can check if it's still being hovered over

	const { navData, docStructure, setDocStructure } = useContext(LeftNavContext);

	// Determines whether currently dragging over the top/bottom half of the folder
	const handleDragOver = (e) => {
		e.preventDefault(); // Necessary for onDrop

		// Checks the mouse Y coordinate compared to the halfway Y coordinate of the folder
		let rect = folderRef.current.getBoundingClientRect();
		if (rect.top + rect.height / 2 > e.clientY) {
			setFolderStyles({ borderTop: '2px solid var(--color-primary)' });
		} else {
			setFolderStyles({ borderBottom: '2px solid var(--color-primary)' });
		}
	};

	// Moves the file to below the destination folder on drop
	const handleDrop = useCallback(() => {
		let newCurrentFolder = moveFileToPath(
			docStructure[navData.currentTab],
			currentlyDragging,
			{ type: 'doc', id: 0, path }
		);
		setDocStructure({ ...docStructure, [navData.currentTab]: newCurrentFolder });

		setFolderStyles({});
	}, [docStructure, navData, currentlyDragging, path, moveFileToPath]);

	return (
		<span
			className='file-nav folder title'
			ref={folderRef}
			style={{ ...folderStyles, fontStyle: 'italic', userSelect: 'none', maxWidth: '5rem' }}
			// onDragEnter={() => setFolderStyles({ borderBottom: '2px solid var(--color-primary)' })}
			onDragLeave={() => setFolderStyles({})}
			onDragOver={handleDragOver}
			onDrop={handleDrop}>
			<span>No contents.</span>
		</span>
	);
};

export default NavFolderEmpty;
