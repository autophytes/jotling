import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import LeftNavContent from './LeftNavContent';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import PlusSVG from '../../../assets/svg/PlusSVG';
// import CaratDownSVG from '../../../assets/svg/CaratDownSVG';
import DocumentPagesSVG from '../../../assets/svg/DocumentPagesSVG';
import LightbulbSVG from '../../../assets/svg/LightbulbSVG';
import BookDraftSVG from '../../../assets/svg/BookDraftSVG';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';

import {
	setObjPropertyAtPropertyPath,
	insertIntoArrayAtPropertyPath,
} from '../../../utils/utils';

import { addFile } from '../navFunctions';

const LeftNav = () => {
	const {
		docStructure,
		setDocStructure,
		docStructureRef,
		navData,
		setNavData,
		navDataRef,
		editorStyles,
		setEditorStyles,
		resetNavWidth,
	} = useContext(LeftNavContext);
	const [pinNav, setPinNav] = useState(true);
	// const [rootFontSize, setRootFontSize] = useState(18);
	// const [resizeWidth, setResizeWidth] = useState(null);
	const [isResizing, setIsResizing] = useState(false);

	const navRef = useRef(null);

	// Resizes the leftNav width when dragging the handle
	const handleResizeMouseDown = (e) => {
		console.log('mouse resizing');
		setIsResizing(true);
		let rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);

		let minWidth = 7 * rootSize;
		let maxWidth = 25 * rootSize;
		let widthOffset = 2;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeMouseMove = (e) => {
			if (e.clientX !== 0) {
				let newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX)) + widthOffset;
				navRef.current.style.width = newWidth + 'px';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeMouseUp = (e) => {
			setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeMouseMove);
			window.removeEventListener('mouseup', handleResizeMouseUp);

			let newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));

			setEditorStyles({ ...editorStyles, leftNav: newWidth / rootSize }) + widthOffset;
		};

		window.addEventListener('mousemove', handleResizeMouseMove);
		window.addEventListener('mouseup', handleResizeMouseUp);
	};

	const handleAddFile = useCallback((insertFileType) => {
		addFile(
			insertFileType,
			docStructureRef.current,
			setDocStructure,
			navDataRef.current.currentTab,
			navDataRef.current.lastClicked.type,
			navDataRef.current.lastClicked.id,
			navDataRef.current,
			setNavData
		);
	}, []);

	// const addFile = useCallback(
	// 	(fileType) => {
	// 		// Create a docStructure object for our current tab.
	// 		// We'll insert our file and overwrite this section of docStructure.
	// 		let folderStructure = JSON.parse(JSON.stringify(docStructure[navData.currentTab]));
	// 		let maxIds = JSON.parse(JSON.stringify(docStructure.maxIds));
	// 		// Note the spread operator only performs a shallow copy (nested objects are still refs).
	// 		//   The JSON method performs a deep copy.

	// 		// Find out where we need to insert the new file
	// 		let filePath = '';
	// 		console.log('lastClicked.type: ', navData.lastClicked.type);
	// 		if (navData.lastClicked.type !== '') {
	// 			let tempPath = findFilePath(
	// 				folderStructure,
	// 				'',
	// 				navData.lastClicked.type,
	// 				navData.lastClicked.id
	// 			);
	// 			console.log('navData.lastClicked.type:', navData.lastClicked.type);
	// 			console.log('navData.lastClicked.id:', navData.lastClicked.id);

	// 			console.log('tempPath: ', tempPath);
	// 			filePath =
	// 				tempPath +
	// 				(navData.lastClicked.type === 'folder'
	// 					? (tempPath === '' ? '' : '/') + `folders/${navData.lastClicked.id}`
	// 					: '');

	// 			console.log('filePath: ', filePath);
	// 		}

	// 		// Build the object that will go in 'children' at the path
	// 		let childObject = {
	// 			type: fileType,
	// 			id: maxIds[fileType] + 1,
	// 			name: fileType === 'Doc' ? 'New Document' : `New ${fileType}`,
	// 		};
	// 		if (fileType === 'doc') {
	// 			childObject.fileName = 'doc' + childObject.id + '.json';
	// 		}

	// 		// Build the object that will go in 'folders' at the path.
	// 		if (fileType === 'folder') {
	// 			let folderObject = { folders: {}, children: [] };
	// 			// Insert the folder into the folder structure
	// 			console.log('filepath: ', filePath);
	// 			folderStructure = setObjPropertyAtPropertyPath(
	// 				filePath + (filePath === '' ? '' : '/') + 'folders/' + childObject.id,
	// 				folderObject,
	// 				folderStructure
	// 			);
	// 			console.log(folderStructure);
	// 		}

	// 		// Inserts the new child into our folderStructure at the destination path
	// 		folderStructure = insertIntoArrayAtPropertyPath(
	// 			filePath + (filePath === '' ? '' : '/') + 'children',
	// 			childObject,
	// 			folderStructure
	// 		);
	// 		console.log(folderStructure);

	// 		// Will put the file name into edit mode
	// 		let newEditFileId = fileType + '-' + (maxIds[fileType] + 1);
	// 		if (fileType === 'doc') {
	// 			setNavData({
	// 				...navData,
	// 				editFile: newEditFileId,
	// 				currentDoc: childObject.fileName,
	// 				lastClicked: { type: 'doc', id: childObject.id },
	// 			});
	// 		} else {
	// 			setNavData({ ...navData, editFile: newEditFileId });
	// 		}

	// 		// console.log(folderStructure);

	// 		// Increment the max ID for a file type
	// 		maxIds[fileType] = maxIds[fileType] + 1;

	// 		setDocStructure({ ...docStructure, [navData.currentTab]: folderStructure, maxIds });
	// 	},
	// 	[navData.currentTab, navData.lastClicked, docStructure, setDocStructure]
	// );

	return (
		<>
			<div className='side-nav-hover-region left' />
			<nav
				className={'side-nav left-nav animation' + (pinNav ? '' : ' hidden')}
				style={{ width: editorStyles.leftNav + 'rem' }}
				ref={navRef}>
				<div className='side-nav-container'>
					<div className='left-nav-top-buttons'>
						<div className='add-file-folder-wrapper'>
							<button
								className='nav-button add-file-button'
								onClick={() => handleAddFile('doc')}>
								<span className='plus-sign'>
									<PlusSVG />
								</span>
								<DocumentSingleSVG />
							</button>
							<button
								className='nav-button add-file-button'
								onClick={() => handleAddFile('folder')}>
								<span className='plus-sign'>
									<PlusSVG />
								</span>
								<FolderOpenSVG />
							</button>
						</div>
						<button
							className={'nav-button' + (pinNav ? ' active' : '')}
							onMouseUp={() => {
								setPinNav(!pinNav);
								setEditorStyles({ ...editorStyles, leftIsPinned: !pinNav });
							}}>
							<PushpinSVG />
						</button>
					</div>

					<div className='left-nav-sections'>
						<div
							className={
								'nav-section-tab first' + (navData.currentTab === 'draft' ? ' active' : '')
							}
							onClick={() =>
								setNavData({
									...navData,
									currentTab: 'draft',
									lastClicked: { type: '', id: '' },
								})
							}>
							<BookDraftSVG />
						</div>
						<div
							className={
								'nav-section-tab' + (navData.currentTab === 'research' ? ' active' : '')
							}
							onClick={() =>
								setNavData({
									...navData,
									currentTab: 'research',
									lastClicked: { type: '', id: '' },
								})
							}>
							<LightbulbSVG />
						</div>
						<div
							className={
								'nav-section-tab last' + (navData.currentTab === 'pages' ? ' active' : '')
							}
							onClick={() =>
								setNavData({
									...navData,
									currentTab: 'pages',
									lastClicked: { type: '', id: '' },
								})
							}>
							<DocumentPagesSVG />
						</div>
					</div>

					<p className='left-nav-section-title'>
						{navData.currentTab === 'draft'
							? 'Manuscript'
							: navData.currentTab === 'research'
							? 'Planning'
							: navData.currentTab === 'pages'
							? 'Wikis'
							: ''}
					</p>

					<LeftNavContent />

					<div className='left-nav-footer'>
						<p>497 words</p>
						<p>49% today's goal</p>
					</div>
				</div>
				<div className={'vertical-rule vr-left-nav' + (isResizing ? ' primary-color' : '')} />
				<div
					className='vertical-rule-drag-region left'
					// style={pinNav ? {} : { cursor: 'inherit' }}
					onMouseDown={handleResizeMouseDown}
					onDoubleClick={() => resetNavWidth('leftNav')}
					// {...(pinNav && {
					// 	onMouseDown: handleResizeMouseDown,
					// 	onDoubleClick: () => resetNavWidth('leftNav'),
					// })}
				/>
			</nav>
		</>
	);
};

export default LeftNav;
