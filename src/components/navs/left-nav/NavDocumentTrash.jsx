import React, { useCallback, useContext } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

const NavDocumentTrash = ({ child }) => {
	const { navData, setNavData } = useContext(LeftNavContext);

	const handleClick = useCallback(
		(child) => {
			navData.currentDoc !== child.fileName &&
				setNavData({
					...navData,
					currentDoc: child.fileName,
				});
		},
		[setNavData, navData]
	);

	return (
		<button
			key={child.id}
			onClick={() => handleClick(child)}
			data-context-menu-item-type='trash-doc'
			data-context-menu-item-id={child.id}
			className={
				'file-nav document' + (navData.currentDoc === child.fileName ? ' active' : '')
			}>
			<div className='svg-wrapper'>
				<DocumentSingleSVG />
			</div>
			<span>{child.name}</span>
		</button>
	);
};

export default NavDocumentTrash;
