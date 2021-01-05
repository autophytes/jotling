import React, { useContext, useCallback } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

import BackArrowSVG from '../../../../assets/svg/BackArrowSVG';
import FolderOpenSVG from '../../../../assets/svg/FolderOpenSVG';

import { createTagLink } from '../../../editor/editorFunctions';
import { addFile } from '../../navFunctions';
import { findFilePath, findFirstFileAlongPathWithProp } from '../../../../utils/utils';

const PickFolder = ({
	newWikiName,
	setShowPickFolder,
	buildAddToWikiStructure,
	setDisplayWikiPopper,
}) => {
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
	} = useContext(LeftNavContext);

	const handleFolderClick = useCallback(
		(child) => {
			return (e) => {
				e.preventDefault();
				console.log('folder: ', child);

				// If this folder itself has sections
				if (child.templateSections && child.templateSections.length) {
					// Then use these sections as options for choosing the section to insert below
					console.log('folder had template sections: ', child.templateSections);
				} else {
					// If this folder didn't have template sections, check the parents
					const folderFilePath = findFilePath(
						docStructureRef.current.pages,
						'',
						'folder',
						child.id
					);
					console.log('folderFilePath:', folderFilePath);

					// Find the first parent folder with templateSections
					const folderObj = findFirstFileAlongPathWithProp(
						docStructureRef.current.pages,
						folderFilePath,
						'folder',
						'templateSections'
					);
					console.log('folderParent with templateSections:', folderObj);
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

	return (
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
	);
};

export default PickFolder;
