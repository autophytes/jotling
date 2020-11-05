import React from 'react';

import FolderClosedSVG from '../../../assets/svg/FolderClosedSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

const NavFolderTrash = ({ child, handleFolderClick, isOpen }) => {
	return (
		<button
			className={'file-nav folder title' + (isOpen ? ' open' : '')}
			data-context-menu-item-type='trash-folder'
			data-context-menu-item-id={child.id}
			onClick={() => handleFolderClick(child.id)}>
			<div className='svg-wrapper'>{isOpen ? <FolderOpenSVG /> : <FolderClosedSVG />}</div>

			<span>{child.name}</span>
		</button>
	);
};

export default NavFolderTrash;
