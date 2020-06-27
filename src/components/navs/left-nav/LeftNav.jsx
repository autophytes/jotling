import React, { useState, useCallback } from 'react';

import LeftNavContent from './LeftNavContent';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import PlusSVG from '../../../assets/svg/PlusSVG';
import CaratDownSVG from '../../../assets/svg/CaratDownSVG';
import DocumentPagesSVG from '../../../assets/svg/DocumentPagesSVG';
import LightbulbSVG from '../../../assets/svg/LightbulbSVG';
import BookDraftSVG from '../../../assets/svg/BookDraftSVG';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

import {
	findMaxFileTypeIds,
	findFilePath,
	setObjPropertyAtPropertyPath,
	insertIntoArrayAtPropertyPath,
} from '../../../utils/utils';

const LeftNav = ({ docStructure, setDocStructure, currentDoc, setCurrentDoc }) => {
	const [currentTab, setCurrentTab] = useState('draft');
	const [lastClicked, setLastClicked] = useState({ type: '', id: '' });

	const addFile = useCallback(
		(fileType) => {
			// Create a docStructure object for our current tab.
			// We'll insert our file and overwrite this section of docStructure.
			let folderStructure = JSON.parse(JSON.stringify(docStructure[currentTab]));
			// Note the spread operator only performs a shallow copy (nested objects are still refs).
			//   The JSON method performs a deep copy.

			// Find the max ID for file types (so we can increment for the new one)
			let maxIds = findMaxFileTypeIds(folderStructure);

			// Find out where we need to insert the new file
			let filePath = '';
			if (lastClicked.type !== '') {
				let tempPath = findFilePath(folderStructure, '', lastClicked.type, lastClicked.id);
				filePath =
					tempPath + (lastClicked.type === 'folder' ? `/folders/${lastClicked.id}` : '');
			}

			// Build the object that will go in 'children' at the path
			let childObject = { type: fileType, id: maxIds[fileType] + 1 };
			if (fileType === 'doc') {
				childObject.name = 'New Document';
				childObject.fileName = 'doc' + childObject.id + '.json';
			}

			// Build the object that will go in 'folders' at the path.
			if (fileType === 'folder') {
				let folderObject = { name: 'New Folder', folders: {}, children: [] };
				// Insert the folder into the folder structure
				folderStructure = setObjPropertyAtPropertyPath(
					filePath + '/folders/' + childObject.id,
					folderObject,
					folderStructure
				);
			}

			// Inserts the new child into our folderStructure at the destination path
			folderStructure = insertIntoArrayAtPropertyPath(
				filePath + '/children',
				childObject,
				folderStructure
			);

			setDocStructure({ ...docStructure, [currentTab]: folderStructure });
		},
		[currentTab, lastClicked, docStructure, setDocStructure]
	);

	return (
		<nav className='side-nav left-nav'>
			<div className='side-nav-container'>
				<div className='left-nav-top-buttons'>
					<div className='add-file-folder-wrapper'>
						<button className='nav-button add-file-button' onClick={() => addFile('doc')}>
							<span className='plus-sign'>
								<PlusSVG />
							</span>
							<DocumentSingleSVG />
						</button>
						<button className='nav-button add-file-button' onClick={() => addFile('folder')}>
							<span className='plus-sign'>
								<PlusSVG />
							</span>
							<FolderOpenSVG />
						</button>
					</div>
					<button className='nav-button'>
						<PushpinSVG />
					</button>
				</div>

				<div className='left-nav-sections'>
					<div
						className={'nav-section-tab first' + (currentTab === 'pages' ? ' active' : '')}
						onClick={() => setCurrentTab('pages')}>
						<DocumentPagesSVG />
					</div>
					<div
						className={'nav-section-tab' + (currentTab === 'research' ? ' active' : '')}
						onClick={() => setCurrentTab('research')}>
						<LightbulbSVG />
					</div>
					<div
						className={'nav-section-tab last' + (currentTab === 'draft' ? ' active' : '')}
						onClick={() => setCurrentTab('draft')}>
						<BookDraftSVG />
					</div>
				</div>

				<LeftNavContent
					docStructure={docStructure}
					setDocStructure={setDocStructure}
					currentDoc={currentDoc}
					setCurrentDoc={setCurrentDoc}
					currentTab={currentTab}
					lastClicked={lastClicked}
					setLastClicked={setLastClicked}
				/>

				<div className='left-nav-footer'>
					<p>497 words</p>
					<p>49% today's goal</p>
				</div>
			</div>
			<div className='vertical-rule' style={{ marginLeft: '0.5rem' }}></div>
		</nav>
	);
};

export default LeftNav;
