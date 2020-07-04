import React, { useState, useContext, useCallback, useRef } from 'react';
import FolderClosedSVG from '../../../assets/svg/FolderClosedSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName } from '../../../utils/utils';

const NavFolder = ({ child, path, handleFolderClick, openCloseFolder, isOpen }) => {
	const [fileName, setFileName] = useState(child.name);
	const [folderStyles, setFolderStyles] = useState({});
	const [isBeingDragged, setIsBeingDragged] = useState(false);
	const isDraggedOver = useRef(false);

	// NEED A WAY to flag when currently dragged over so that when the 1sec timer goes off,
	// it can check if it's still being hovered over

	const { navData, setNavData, docStructure, setDocStructure } = useContext(LeftNavContext);

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

	const handleDragEnter = useCallback(() => {
		if (!isBeingDragged) {
			setFolderStyles({ borderBottom: '2px solid var(--color-primary)' });
			isDraggedOver.current = true;
			setTimeout(() => {
				console.log('timeout finished');
				if (isDraggedOver.current) {
					console.log('timeout finished: was dragged over');
					openCloseFolder(child.id, true);
				}
			}, 1000);
		}
	}, [child, openCloseFolder, isBeingDragged]);

	return (
		<button
			className={'file-nav folder title' + (isOpen ? ' open' : '')}
			style={folderStyles}
			draggable
			onDragStart={() => {
				setIsBeingDragged(true);
				openCloseFolder(child.id, false);
			}}
			onDragEnter={handleDragEnter}
			onDragLeave={() => {
				setFolderStyles({});
				isDraggedOver.current = false;
			}}
			onDragEnd={() => setIsBeingDragged(false)}
			onDragOver={(e) => e.preventDefault()}
			onDrop={(e) => {
				e.persist();
				console.log(e.nativeEvent);
				setFolderStyles({});
				isDraggedOver.current = false;
			}}
			onClick={() => navData.editFile !== 'folder-' + child.id && handleFolderClick(child.id)}
			onDoubleClick={() => setNavData({ ...navData, editFile: 'folder-' + child.id })}>
			<div className='svg-wrapper'>{isOpen ? <FolderOpenSVG /> : <FolderClosedSVG />}</div>
			{navData.editFile === 'folder-' + child.id ? (
				<input
					type='text'
					value={fileName}
					autoFocus
					onChange={(e) => setFileName(e.target.value)}
					onBlur={(e) => saveFolderNameChange(e.target.value)}
					onFocus={(e) => e.target.select()}
					onKeyPress={(e) => {
						e.key === 'Enter' && e.target.blur();
					}}
				/>
			) : (
				child.name
			)}
		</button>
	);
};

export default NavFolder;
