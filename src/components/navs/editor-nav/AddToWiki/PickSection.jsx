import React, { useContext, useEffect, useState } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

import SectionsSVG from '../../../../assets/svg/SectionsSVG';

import { createTagLink } from '../../../editor/editorFunctions';
import { findFilePath, retrieveContentAtPropertyPath } from '../../../../utils/utils';
import BackArrowSVG from '../../../../assets/svg/BackArrowSVG';

const PickSection = ({ selectedDocId, setShowPickSection }) => {
	const [newSectionName, setNewSectionName] = useState('New Section');
	const [sections, setSections] = useState([]);

	const {
		setDisplayWikiPopper,
		docStructureRef,
		editorStateRef,
		linkStructureRef,
		navData,
		setEditorStateRef,
		setLinkStructure,
		setSyncLinkIdList,
	} = useContext(LeftNavContext);

	const handleSectionClick = (initialSectionKey) => {
		createTagLink(
			selectedDocId,
			editorStateRef,
			linkStructureRef,
			navData.currentDoc,
			setEditorStateRef.current,
			setLinkStructure,
			setSyncLinkIdList,
			initialSectionKey
		);
		setDisplayWikiPopper(false);
	};

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

		let newSections = docObj.sections ? docObj.sections : [];
		newSections.unshift({ key: '##topOfPage', text: 'Top of Page', isItalic: true });
		newSections.push({ key: '##bottomOfPage', text: 'Bottom of Page', isItalic: true });
		console.log('newSections:', newSections);

		setSections(newSections);
	}, [selectedDocId]);

	return (
		<>
			<p className='popper-title'>
				<button
					onClick={(e) => {
						setTimeout(() => {
							setShowPickSection(false);
						}, 0);
					}}
					className='back-arrow'>
					<BackArrowSVG />
				</button>
				Create Section
			</p>
			<div style={{ position: 'relative' }} id='create-new-wiki-input'>
				<button className='file-nav document add-to-wiki new-wiki'>
					<div className='svg-wrapper add-to-wiki'>
						<SectionsSVG />
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

			<p className='popper-title'>Select Section</p>
			{sections.map((item) => (
				<button
					className='file-nav document add-to-wiki'
					style={{ marginBottom: '1px', fontStyle: item.isItalic ? 'italic' : 'normal' }}
					onClick={() => handleSectionClick(item.key)}
					key={item.key}>
					<div className='svg-wrapper add-to-wiki'>
						<SectionsSVG />
					</div>
					<span>{item.text}</span>
				</button>
			))}
		</>
	);
};

export default PickSection;
