import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import FolderClosedSVG from '../../../assets/svg/FolderClosedSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName, moveFileToPath } from '../../../utils/utils';

const NavFolder = ({
	child,
	path,
	handleFolderClick,
	openCloseFolder,
	isOpen,
	currentlyDragging,
	setCurrentlyDragging,
}) => {
	const [fileName, setFileName] = useState(child.name);
	const [folderStyles, setFolderStyles] = useState({});
	const [isBeingDragged, setIsBeingDragged] = useState(false);
	// const [clicks, setClicks] = useState(0);
	const isDraggedOver = useRef(false);

	// NEED A WAY to flag when currently dragged over so that when the 1sec timer goes off,
	// it can check if it's still being hovered over

	const { navData, setNavData, docStructure, setDocStructure } = useContext(LeftNavContext);

	// Handle single/double clicks
	//  Possible solution, but introduces some lag to the single click...
	// useEffect(() => {
	// 	let singleClickTimer;
	// 	if (clicks === 1) {
	// 		singleClickTimer = setTimeout(function () {
	// 			navData.editFile !== 'folder-' + child.id && handleFolderClick(child.id);
	// 			setClicks(0);
	// 		}, 150);
	// 	} else if (clicks >= 2) {
	// 		setNavData({ ...navData, editFile: 'folder-' + child.id });
	// 		setClicks(0);
	// 	}
	// 	return () => clearTimeout(singleClickTimer);
	// }, [clicks]);

	// Updates the folder with the new name
	const saveFolderNameChange = useCallback(
		(newName) => {
			// update
			updateChildName(
				'folder',
				child.id,
				newName,
				path,
				docStructure,
				setDocStructure,
				navData.currentTab
			);
			setNavData({ ...navData, editFile: '' });
		},
		[child, path, docStructure, setDocStructure, setNavData, navData]
	);

	// Styles the dragged-over folder and sets a timer to open the folder
	const handleDragEnter = useCallback(() => {
		if (!isBeingDragged) {
			setFolderStyles({ borderBottom: '2px solid var(--color-primary)' });
			isDraggedOver.current = true;
			// If the folder is still being hovered over 1 second later, open the folder
			setTimeout(() => {
				if (isDraggedOver.current) {
					openCloseFolder(child.id, true);
				}
			}, 1000);
		}
	}, [child, openCloseFolder, isBeingDragged]);

	// Sets the folder as currently being dragged
	const handleDragStart = () => {
		console.log('drag start');
		setIsBeingDragged(true);
		openCloseFolder(child.id, false);
		setCurrentlyDragging({ type: 'folder', id: child.id, path });
	};

	// Moves the file to below the destination folder on drop
	const handleDrop = useCallback(
		(e) => {
			let newCurrentFolder = moveFileToPath(
				docStructure[navData.currentTab],
				currentlyDragging,
				{
					type: child.type,
					id: child.id,
					path,
				}
			);
			setDocStructure({ ...docStructure, [navData.currentTab]: newCurrentFolder });

			setFolderStyles({});
			isDraggedOver.current = false;
		},
		[docStructure, navData, currentlyDragging, child, path, moveFileToPath]
	);

	return (
		<button
			className={'file-nav folder title' + (isOpen ? ' open' : '')}
			style={folderStyles}
			draggable
			onDragStart={handleDragStart}
			onDragEnter={handleDragEnter}
			onDragLeave={() => {
				setFolderStyles({});
				isDraggedOver.current = false;
			}}
			onDragEnd={() => {
				// Fires after onDrop.
				setIsBeingDragged(false);
				setCurrentlyDragging({ type: '', id: '', path: '' });
			}}
			onDragOver={(e) => e.preventDefault()}
			onDrop={handleDrop}
			// onClick={() => setClicks(clicks + 1)}
			onClick={() => navData.editFile !== 'folder-' + child.id && handleFolderClick(child.id)}
			onDoubleClick={() => setNavData({ ...navData, editFile: 'folder-' + child.id })}>
			<div className='svg-wrapper'>{isOpen ? <FolderOpenSVG /> : <FolderClosedSVG />}</div>
			{navData.editFile === 'folder-' + child.id ? (
				<input
					type='text'
					value={fileName}
					autoFocus
					onChange={(e) => setFileName(e.target.value)}
					onBlur={(e) => saveFolderNameChange(e.target.value ? e.target.value : 'Unnamed')}
					onFocus={(e) => e.target.select()}
					onKeyUp={(e) => {
						if (e.key === 'Enter' || e.keyCode === 27) {
							e.target.blur();
						}
					}}
				/>
			) : (
				child.name
			)}
		</button>
	);
};

export default NavFolder;
