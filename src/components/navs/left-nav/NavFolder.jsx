import React, { useState, useContext, useCallback } from 'react';
import FolderClosedSVG from '../../../assets/svg/FolderClosedSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName } from '../../../utils/utils';

const NavFolder = ({ child, path, handleFolderClick, isOpen }) => {
	const [fileName, setFileName] = useState(child.name);

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
		[child, path]
	);

	return (
		<button
			className={'file-nav folder title' + (isOpen ? ' open' : '')}
			onClick={() => {
				handleFolderClick(child.id);
			}}
			onDoubleClick={() => setNavData({ ...navData, editFile: 'folder-' + child.id })}>
			<div className='svg-wrapper'>{isOpen ? <FolderOpenSVG /> : <FolderClosedSVG />}</div>
			{navData.editFile === 'folder-' + child.id ? (
				<input
					type='text'
					value={fileName}
					autoFocus
					onChange={(e) => setFileName(e.target.value)}
					onBlur={(e) => saveFolderNameChange(e.target.value)}
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
