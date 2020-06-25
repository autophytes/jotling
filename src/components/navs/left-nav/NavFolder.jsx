import React from 'react';
import FolderClosedSVG from '../../../assets/svg/FolderClosedSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

const NavFolder = ({ child, folder, path, handleFolderClick, isOpen }) => {
	return (
		<p
			className={'file-nav folder title' + (isOpen ? ' open' : '')}
			onClick={() => {
				handleFolderClick(child.id);
			}}>
			<div className='svg-wrapper'>{isOpen ? <FolderOpenSVG /> : <FolderClosedSVG />}</div>
			{folder.name}
		</p>
	);
};

export default NavFolder;
