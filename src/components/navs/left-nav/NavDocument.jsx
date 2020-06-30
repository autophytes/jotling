import React, { useCallback, useState, useContext } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName } from '../../../utils/utils';

const NavDocument = ({ path, child }) => {
	const [fileName, setFileName] = useState(child.name);

	const { navData, setNavData, docStructure, setDocStructure } = useContext(LeftNavContext);

	const handleClick = useCallback(() => {
		navData.currentDoc !== child.fileName &&
			setNavData({
				...navData,
				currentDoc: child.fileName,
				lastClicked: { type: 'doc', id: child.id },
			});
	}, [navData.currentDoc, setNavData, child]);

	const saveDocNameChange = useCallback(
		(newName) => {
			// update
			updateChildName(
				'doc',
				child.id,
				newName,
				path,
				docStructure,
				setDocStructure,
				navData.currentTab
			);
			setNavData({ ...navData, editFile: '' });
		},
		[child, path]
	);

	return (
		<button
			className={
				'file-nav document' + (navData.currentDoc === child.fileName ? ' active' : '')
			}
			// key={'doc-' + child.id}
			onClick={handleClick}
			onDoubleClick={() => setNavData({ ...navData, editFile: 'doc-' + child.id })}>
			<div className='svg-wrapper'>
				<DocumentSingleSVG />
			</div>
			{navData.editFile === 'doc-' + child.id ? (
				<input
					type='text'
					value={fileName}
					autoFocus
					onChange={(e) => setFileName(e.target.value)}
					onBlur={(e) => saveDocNameChange(e.target.value)}
					onKeyPress={(e) => {
						e.key === 'Enter' && e.target.blur();
					}}
				/>
			) : (
				child.name
			)}
			{/* {child.name} */}
		</button>
	);
};

export default NavDocument;
