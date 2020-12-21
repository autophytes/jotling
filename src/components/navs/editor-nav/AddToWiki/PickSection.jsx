import React, { useContext, useEffect, useState } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

import DocumentSingleSVG from '../../../../assets/svg/DocumentSingleSVG';

import { findFilePath, retrieveContentAtPropertyPath } from '../../../../utils/utils';

const PickSection = ({ selectedDocId }) => {
	const [newSectionName, setNewSectionName] = useState('New Section');

	const { setDisplayWikiPopper, docStructureRef } = useContext(LeftNavContext);

	useEffect(() => {
		const filePath = findFilePath(docStructureRef.current.pages, '', 'doc', selectedDocId);
		const childrenPath = filePath + (filePath ? '/' : '') + 'children';

		const childrenArray = retrieveContentAtPropertyPath(
			childrenPath,
			docStructureRef.current.pages
		);
		const docObj = childrenArray.find(
			(item) => item.id === selectedDocId && item.type === 'doc'
		);
		console.log('docObj:', docObj);
	}, [selectedDocId]);

	return (
		<>
			<p className='popper-title'>Create Section</p>
			<div style={{ position: 'relative' }} id='create-new-wiki-input'>
				<button className='file-nav document add-to-wiki new-wiki'>
					<div className='svg-wrapper add-to-wiki'>
						<DocumentSingleSVG />
					</div>
					<input
						type='text'
						value={newSectionName}
						autoFocus
						onChange={(e) => setNewSectionName(e.target.value)}
						onFocus={(e) => e.target.select()}
						onKeyUp={() =>
							console.log('need to create the new section like handleNewWikiEnter')
						}
					/>
				</button>
			</div>
			<hr />
		</>
	);
};

export default PickSection;
