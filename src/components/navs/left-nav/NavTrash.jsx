import React, { useEffect, useState, useContext, useCallback } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import Collapse from 'react-css-collapse';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';
import TrashSVG from '../../../assets/svg/TrashSVG';

const NavTrash = () => {
	const [isOpen, setIsOpen] = useState(false);

	const { docStructure, navData, setNavData } = useContext(LeftNavContext);

	const handleClick = useCallback(
		(child) => {
			navData.currentDoc !== child.fileName &&
				setNavData({
					...navData,
					currentDoc: child.fileName,
					lastClicked: { type: 'doc', id: child.id },
				});
		},
		[setNavData, navData]
	);

	return (
		<>
			<div className='file-nav folder'>
				<button className='file-nav folder title' onClick={() => setIsOpen(!isOpen)}>
					<div className='svg-wrapper'>
						<TrashSVG />
					</div>
					Trash ({docStructure.trash.length})
				</button>
				<Collapse isOpen={isOpen}>
					<div className='folder-contents'>
						{docStructure.trash.map((item) => (
							<button
								key={item.id}
								onClick={() => handleClick(item)}
								data-context-menu-item-type='trash-doc'
								data-context-menu-item-id={item.id}
								className={
									'file-nav document' + (navData.currentDoc === item.fileName ? ' active' : '')
								}>
								<div className='svg-wrapper'>
									<DocumentSingleSVG />
								</div>
								<span>{item.name}</span>
							</button>
						))}
					</div>
				</Collapse>
			</div>
		</>
	);
};

export default NavTrash;
