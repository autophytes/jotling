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
	// STATE
	const [fileName, setFileName] = useState(child.name);
	const [folderStyles, setFolderStyles] = useState({});
	const [isBeingDragged, setIsBeingDragged] = useState(false);
	const [dragOverTopBottom, setDragOverTopBottom] = useState('');

	// REFS
	const isDraggedOver = useRef(false);
	const folderRef = useRef(null);

	// CONTEXT
	const { navData, setNavData, docStructure, setDocStructure } = useContext(LeftNavContext);

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

	// Determines whether currently dragging over the top/bottom half of the folder
	const handleDragOver = (e) => {
		e.preventDefault(); // Necessary for onDrop
		if (isBeingDragged) {
			return;
		}

		// Checks the mouse Y coordinate compared to the halfway Y coordinate of the folder
		let rect = folderRef.current.getBoundingClientRect();
		if (rect.top + rect.height / 2 > e.clientY) {
			setFolderStyles({ borderTop: '2px solid var(--color-primary)' });
			if (dragOverTopBottom !== 'top') {
				setDragOverTopBottom('top'); // Used to determine where to insert
			}
		} else {
			setFolderStyles({ borderBottom: '2px solid var(--color-primary)' });
			if (dragOverTopBottom !== 'bottom') {
				setDragOverTopBottom('bottom'); // Used to determine where to insert
			}
		}
	};

	// Flags the dragged-over folder and sets a timer to open the folder
	const handleDragEnter = () => {
		if (!isBeingDragged) {
			isDraggedOver.current = true; // Needed for the timeout
			// If the folder is still being hovered over 1 second later, open the folder
			if (!isOpen) {
				setTimeout(() => {
					if (isDraggedOver.current) {
						openCloseFolder(child.id, true);
					}
				}, 1000);
			}
		}
	};

	// When no longer dragged over, clear the styles
	const handleDragLeave = () => {
		console.log('drag left');
		setFolderStyles({});
		isDraggedOver.current = false;
	};

	// Sets the folder as currently being dragged
	const handleDragStart = () => {
		setIsBeingDragged(true);
		openCloseFolder(child.id, false);
		setCurrentlyDragging({ type: 'folder', id: child.id, path });
	};

	// Moves the file to below the destination folder on drop
	const handleDrop = useCallback(
		(e) => {
			// If the file was dropped in the original position, don't move.
			if (currentlyDragging.id === child.id && currentlyDragging.type === child.type) {
				return;
			}
			let newCurrentFolder = moveFileToPath(
				docStructure[navData.currentTab],
				currentlyDragging,
				{ type: child.type, id: child.id, path },
				dragOverTopBottom
			);
			setDocStructure({ ...docStructure, [navData.currentTab]: newCurrentFolder });

			setFolderStyles({});
			isDraggedOver.current = false;
		},
		[docStructure, navData, currentlyDragging, child, path, moveFileToPath, dragOverTopBottom]
	);

	// If the folder name is being edited and is inside another folder, open that folder
	useEffect(() => {
		if (navData.editFile === 'folder-' + child.id) {
			let noChildren =
				path.lastIndexOf('/') !== -1 ? path.slice(0, path.lastIndexOf('/')) : '';

			let containingFolderId =
				noChildren.lastIndexOf('/') !== -1
					? noChildren.slice(noChildren.lastIndexOf('/') + 1)
					: '';

			// If it's inside of a folder, open
			if (containingFolderId) {
				openCloseFolder(containingFolderId, true);
			}
		}
	}, [navData.editFile, child.id, openCloseFolder]);

	return (
		<button
			className={'file-nav folder title' + (isOpen ? ' open' : '')}
			data-context-menu-item-type='folder'
			data-context-menu-item-id={child.id}
			data-context-menu-current-tab={navData.currentTab}
			style={folderStyles}
			ref={folderRef}
			draggable
			onDragStart={handleDragStart}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragEnd={() => {
				// Fires after onDrop.
				setIsBeingDragged(false);
				setCurrentlyDragging({ type: '', id: '', path: '' });
			}}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
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
				<span>{child.name}</span>
			)}
		</button>
	);
};

export default NavFolder;
