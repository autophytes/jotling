import React, { useContext, useEffect, useState } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

import SectionsSVG from '../../../../assets/svg/SectionsSVG';
import BackArrowSVG from '../../../../assets/svg/BackArrowSVG';

import { createTagLink } from '../../../editor/editorFunctions';
import { addFile, insertNewDocSection } from '../../navFunctions';
import { findFilePath, retrieveContentAtPropertyPath } from '../../../../utils/utils';

const PickSection = ({
	selectedDocId,
	setShowPickSection,
	templateSections,
	selectedFolder,
	newWikiName,
}) => {
	const [newSectionName, setNewSectionName] = useState('New Section');
	const [showPickSectionLocation, setShowPickSectionLocation] = useState(false);
	const [sections, setSections] = useState([]);

	const {
		setDisplayWikiPopper,
		docStructureRef,
		setDocStructure,
		editorStateRef,
		linkStructureRef,
		navData,
		setNavData,
		setEditorStateRef,
		setLinkStructure,
		setSyncLinkIdList,
		editorArchivesRef,
		saveFileRef,
	} = useContext(LeftNavContext);

	// Handle the section click for an already existing wiki page
	const handleSectionClick = (initialSectionKey, insertSectionOptions) => {
		// If creating a new section
		if (insertSectionOptions) {
			// FINISH

			// If creating a new section, go ahead and create/sync that here
			// In this case, we probably need to return the new editorState from the addFile
			insertNewDocSection(
				editorArchivesRef.current[`doc${selectedDocId}.json`].editorState,
				insertSectionOptions,
				setDocStructure,
				'pages',
				selectedDocId,
				saveFileRef
			);
		}

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

	// Handle the section click when creating a new wiki page too
	const handleSectionClickNewWiki = (sectionItem, insertSectionOptions) => {
		// Add the file to the given folder
		// Might need add file to return the file we've created?
		const { id: newDocId, sections: newSections, editorState } = addFile(
			'doc',
			docStructureRef.current,
			setDocStructure,
			'pages',
			selectedFolder.type,
			selectedFolder.id,
			navData,
			setNavData,
			saveFileRef,
			newWikiName,
			true // don't open the file after creating it
		);

		let blockKey = sectionItem.key;

		// Find the actual blockKey in the newSections
		if (sectionItem.hasOwnProperty('templateSectionIndex')) {
			blockKey = newSections[sectionItem.templateSectionIndex].key;
		}

		// When creating a new section, update the key of the element we're inserting before
		if (insertSectionOptions) {
			// If we have a template index to reference, grab the new section key
			if (insertSectionOptions.section.hasOwnProperty('templateSectionIndex')) {
				insertSectionOptions.insertBeforeKey =
					newSections[insertSectionOptions.section.templateSectionIndex].key;
			} else {
				// If it's not already top or bottom, default to bottom
				if (
					!['##bottomOfPage', '##topOfPage'].includes(insertSectionOptions.insertBeforeKey)
				) {
					insertSectionOptions.insertBeforeKey = '##bottomOfPage';
				}
			}

			// If creating a new section, go ahead and create/sync that here
			// In this case, we probably need to return the new editorState from the addFile
			const { blockKey: newSectionBlockKey } = insertNewDocSection(
				editorState,
				insertSectionOptions,
				setDocStructure,
				'pages',
				newDocId,
				saveFileRef
			);

			blockKey = newSectionBlockKey;
		}

		createTagLink(
			newDocId,
			editorStateRef, // The source document
			linkStructureRef,
			navData.currentDoc,
			setEditorStateRef.current,
			setLinkStructure,
			setSyncLinkIdList,
			blockKey
		);
		setDisplayWikiPopper(false);
	};

	const handleNewSectionEnter = (e) => {
		if (e.key === 'Enter') {
			setShowPickSectionLocation(true);
		}
	};

	// Build the array of sections to list out
	useEffect(() => {
		let newSections = [];

		// If we're creating a new wiki and using template sections that aren't in the doc yet
		if (templateSections) {
			newSections = templateSections.map((item, i) => ({
				key: i,
				text: item,
				isTemplateSection: true, // maybe delete
				templateSectionIndex: i,
			}));
		} else {
			// Otherwise, list the sections from the doc

			// Grab the children array in the folder
			const filePath = findFilePath(docStructureRef.current.pages, '', 'doc', selectedDocId);
			const childrenPath = filePath + (filePath ? '/' : '') + 'children';
			const childrenArray = retrieveContentAtPropertyPath(
				childrenPath,
				docStructureRef.current.pages
			);

			// Pull the specified document
			const docObj = childrenArray.find(
				(item) => item.id === selectedDocId && item.type === 'doc'
			);

			// Grab the existing sections off the document
			newSections = docObj.sections ? docObj.sections : [];
		}

		// Add the top/bottom special handlers
		newSections.unshift({ key: '##topOfPage', text: 'Top of Page', isSpecial: true });
		newSections.push({ key: '##bottomOfPage', text: 'Bottom of Page', isSpecial: true });
		console.log('newSections:', newSections);

		setSections(newSections);
	}, [selectedDocId, templateSections]);

	return (
		<>
			<p className='popper-title'>
				{/* Back Button */}
				<button
					onClick={(e) => {
						setTimeout(() => {
							// Change the back button based on whether we're creating a new section
							showPickSectionLocation
								? setShowPickSectionLocation(false)
								: setShowPickSection(false);
						}, 0);
					}}
					className='back-arrow'>
					<BackArrowSVG />
				</button>
				{/* Title */}
				{showPickSectionLocation ? 'Section Placement' : 'Create Section'}
			</p>

			{/* New Section Input */}
			{!showPickSectionLocation && (
				<>
					<div style={{ position: 'relative' }} id='create-new-wiki-input'>
						<button className='file-nav document add-to-wiki new-wiki'>
							<div className='svg-wrapper add-to-wiki'>
								<SectionsSVG />
							</div>
							<input
								type='text'
								value={newSectionName}
								autoFocus
								spellCheck={false}
								onChange={(e) => setNewSectionName(e.target.value)}
								onFocus={(e) => e.target.select()}
								onKeyUp={handleNewSectionEnter}
							/>
						</button>
					</div>
					<hr />
				</>
			)}

			{showPickSectionLocation ? (
				<>
					{/* Choose a location to insert the new section */}
					{sections.map((item) => (
						<button
							key={item.key}
							className='file-nav document add-to-wiki'
							style={{ marginBottom: '1px', fontStyle: item.isSpecial ? 'italic' : 'normal' }}
							onClick={() =>
								templateSections
									? handleSectionClickNewWiki(item, {
											newName: newSectionName,
											insertBeforeKey: item.key,
											section: item,
									  })
									: handleSectionClick('##newSection', {
											newName: newSectionName,
											insertBeforeKey: item.key,
									  })
							}>
							<div className='svg-wrapper add-to-wiki'>
								<SectionsSVG />
							</div>
							<span>{(item.isSpecial ? '' : 'Before: ') + item.text}</span>
						</button>
					))}
				</>
			) : (
				<>
					{/* Choose the section to insert into */}
					<p className='popper-title'>Select Section</p>
					{sections.map((item) => (
						<button
							className='file-nav document add-to-wiki'
							style={{ marginBottom: '1px', fontStyle: item.isItalic ? 'italic' : 'normal' }}
							onClick={() =>
								templateSections
									? handleSectionClickNewWiki(item)
									: handleSectionClick(item.key)
							}
							key={item.key}>
							<div className='svg-wrapper add-to-wiki'>
								<SectionsSVG />
							</div>
							<span>{item.text}</span>
						</button>
					))}
				</>
			)}
		</>
	);
};

export default PickSection;
