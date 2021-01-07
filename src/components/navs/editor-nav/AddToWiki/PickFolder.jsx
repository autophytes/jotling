import React, { useContext, useCallback, useState } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

import BackArrowSVG from '../../../../assets/svg/BackArrowSVG';
import FolderOpenSVG from '../../../../assets/svg/FolderOpenSVG';

import { createTagLink } from '../../../editor/editorFunctions';
import { addFile } from '../../navFunctions';
import { findFilePath, findFirstFileAlongPathWithProp } from '../../../../utils/utils';
import PickSection from './PickSection';

const PickFolder = ({
	newWikiName,
	setShowPickFolder,
	buildAddToWikiStructure,
	setDisplayWikiPopper,
}) => {
	const [showPickSection, setShowPickSection] = useState(false);
	const [selectedFolder, setSelectedFolder] = useState(null);
	const [templateSections, setTemplateSections] = useState(null);
	const [docId, setDocId] = useState(null);

	const {
		docStructureRef,
		setDocStructure,
		navData,
		setNavData,
		editorStateRef,
		linkStructureRef,
		setEditorStateRef,
		setLinkStructure,
		setSyncLinkIdList,
		setEditorArchives,
		saveFileRef,
	} = useContext(LeftNavContext);

	const handleFolderClick = useCallback(
		(child) => {
			return (e) => {
				e.preventDefault();
				e.stopPropagation();
				console.log('folder: ', child);

				// NEXT: if we get templateSections from either of the options below,
				// let the user choose the section to insert the new wiki into.
				// Otherwise, crate the page with no sections screen

				let newTemplateSections;
				// If this folder itself has sections
				if (child.templateSections && child.templateSections.length) {
					// Then use these sections as options for choosing the section to insert below
					newTemplateSections = child.templateSections;
				} else {
					// If this folder didn't have template sections, check the parents
					const folderFilePath = findFilePath(
						docStructureRef.current.pages,
						'',
						'folder',
						child.id
					);

					// Find the first parent folder with templateSections if it exists
					const folderObj = findFirstFileAlongPathWithProp(
						docStructureRef.current.pages,
						folderFilePath,
						'folder',
						'templateSections'
					);

					if (folderObj && folderObj.templateSections.length) {
						newTemplateSections = folderObj.templateSections;
					}
				}

				// If we have templateSections, choose the section before creating the link
				if (newTemplateSections && newTemplateSections.length) {
					setSelectedFolder(child);
					setTemplateSections(newTemplateSections);
					// setDocId(newDocId);
					setShowPickSection(true);

					// Don't create the link. We'll do that in PickSection
					return;
				}

				// Add the file to the given folder
				// Might need add file to return the file we've created?
				const { id: newDocId } = addFile(
					'doc',
					docStructureRef.current,
					setDocStructure,
					'pages',
					child.type,
					child.id,
					navData,
					setNavData,
					setEditorArchives,
					saveFileRef,
					newWikiName,
					true // don't open the file after creating it
				);

				// Create the link to the new wiki document
				createTagLink(
					newDocId, // Need to return the doc id from addFile
					editorStateRef,
					linkStructureRef,
					navData.currentDoc,
					setEditorStateRef.current,
					setLinkStructure,
					setSyncLinkIdList
				);

				// Then create the link
				setDisplayWikiPopper(false);
			};
		},
		[navData, newWikiName]
	);

	return !showPickSection ? (
		<>
			<div className='popper-title'>
				<button
					onClick={(e) => {
						setTimeout(() => {
							setShowPickFolder(false);
						}, 0);
					}}
					className='back-arrow'>
					<BackArrowSVG />
				</button>
				<span>
					Add <span className='new-wiki-title'>{newWikiName}</span> to Folder
				</span>
			</div>

			<div className='file-nav folder add-to-wiki'>
				<div
					className='file-nav title open add-to-wiki document'
					style={{ cursor: 'pointer' }}
					onClick={handleFolderClick({})}>
					<div className='svg-wrapper add-to-wiki'>
						<FolderOpenSVG />
					</div>
					<span>Wikis</span>
				</div>

				<div className='folder-contents add-to-wiki'>
					{buildAddToWikiStructure(docStructureRef.current.pages, '', handleFolderClick, true)}
				</div>
			</div>
		</>
	) : (
		<PickSection {...{ setShowPickSection, templateSections, selectedFolder }} />
	);
};

export default PickFolder;
