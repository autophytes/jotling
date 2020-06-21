import React from 'react';
import FolderSVG from '../../../assets/svg/FolderSVG';

const NavFolder = ({ child, folder, path }) => {
	return (
		<p className='file-nav folder title'>
			<FolderSVG />
			{folder.name}
		</p>
	);
};

export default NavFolder;
