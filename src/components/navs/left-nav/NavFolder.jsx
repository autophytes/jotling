import React from 'react';
import FolderSVG from '../../../assets/svg/FolderSVG';

const NavFolder = ({ child, folder, path, handleFolderClick }) => {
	return (
		<p
			className='file-nav folder title'
			onClick={() => {
				handleFolderClick('folder-' + child.id);
			}}>
			<FolderSVG />
			{folder.name}
		</p>
	);
};

export default NavFolder;
