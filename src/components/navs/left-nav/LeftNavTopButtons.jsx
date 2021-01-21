import React, { useCallback, useContext } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';
import FolderOpenSVG from '../../../assets/svg/FolderOpenSVG';
import PlusSVG from '../../../assets/svg/PlusSVG';
import PushpinSVG from '../../../assets/svg/PushpinSVG';

import { addFile } from '../navFunctions';

const LeftNavTopButtons = ({ pinNav, setPinNav }) => {
	const {
		setDocStructure,
		docStructureRef,
		setNavData,
		navDataRef,
		editorStyles,
		setEditorStyles,
		saveFileRef,
	} = useContext(LeftNavContext);

	const handleAddFile = useCallback((insertFileType) => {
		addFile(
			insertFileType,
			docStructureRef.current,
			setDocStructure,
			navDataRef.current.currentTab,
			navDataRef.current.lastClicked.type,
			navDataRef.current.lastClicked.id,
			navDataRef.current,
			setNavData,
			saveFileRef
		);
	}, []);

	return (
		<div className='left-nav-top-buttons'>
			<div className='add-file-folder-wrapper'>
				<button
					className='nav-button add-file-button'
					title='Insert Document'
					onClick={() => handleAddFile('doc')}>
					<span className='plus-sign'>
						<PlusSVG />
					</span>
					<DocumentSingleSVG />
				</button>
				<button
					className='nav-button add-file-button'
					title='Insert Folder'
					onClick={() => handleAddFile('folder')}>
					<span className='plus-sign'>
						<PlusSVG />
					</span>
					<FolderOpenSVG />
				</button>
			</div>
			<button
				className={'nav-button' + (editorStyles.leftIsPinned ? ' active' : '')}
				title='Pin Document Navigation'
				onMouseUp={() => {
					setEditorStyles((prev) => ({ ...prev, leftIsPinned: !prev.leftIsPinned }));
				}}>
				<PushpinSVG />
			</button>
		</div>
	);
};

export default LeftNavTopButtons;
