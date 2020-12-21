import React, { useContext, useCallback } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

import BackArrowSVG from '../../../../assets/svg/BackArrowSVG';
import FolderOpenSVG from '../../../../assets/svg/FolderOpenSVG';
import { createTagLink } from '../../../editor/editorFunctions';
import { addFile } from '../../navFunctions';

const PickFolder = ({
	newWikiName,
	showPickFolder,
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
	} = useContext(LeftNavContext);

	const handleFolderClick = useCallback(
		(child, foldersOnly) => {
			return foldersOnly
				? (e) => {
						e.preventDefault();
						console.log('folder: ', child);
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
							newWikiName, // TO DO
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
				  }
				: undefined;
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
					onClick={handleFolderClick({}, true)}>
					<div className='svg-wrapper add-to-wiki'>
						<FolderOpenSVG />
					</div>
					<span>Wikis</span>
				</div>

				<div className='folder-contents add-to-wiki'>
					{buildAddToWikiStructure(
						docStructureRef.current.pages,
						'',
						handleFolderClick,
						showPickFolder
					)}
				</div>
			</div>
		</>
	);
};

export default PickFolder;
