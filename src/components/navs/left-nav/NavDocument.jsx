import React, { useCallback, useState, useContext } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName, moveFileToPath } from '../../../utils/utils';

const NavDocument = ({ path, child, currentlyDragging, setCurrentlyDragging }) => {
	const [fileName, setFileName] = useState(child.name);
	const [fileStyles, setFileStyles] = useState({});

	const { navData, setNavData, docStructure, setDocStructure } = useContext(LeftNavContext);

	const handleClick = useCallback(() => {
		navData.currentDoc !== child.fileName &&
			setNavData({
				...navData,
				currentDoc: child.fileName,
				lastClicked: { type: 'doc', id: child.id },
			});
	}, [setNavData, child, navData]);

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
		[child, path, navData, docStructure, setDocStructure]
	);

	// Moves the file to below the destination folder on drop
	const handleDrop = useCallback(
		(e) => {
			let newCurrentFolder = moveFileToPath(
				docStructure[navData.currentTab],
				currentlyDragging,
				{
					type: child.type,
					id: child.id,
					path,
				}
			);
			setDocStructure({ ...docStructure, [navData.currentTab]: newCurrentFolder });

			setFileStyles({});
		},
		[docStructure, navData, currentlyDragging, child, path, moveFileToPath]
	);

	return (
		<button
			className={
				'file-nav document' + (navData.currentDoc === child.fileName ? ' active' : '')
			}
			style={fileStyles}
			// key={'doc-' + child.id}
			draggable
			onDragStart={() => setCurrentlyDragging({ type: 'doc', id: child.id, path })}
			onDragEnter={() => setFileStyles({ borderBottom: '2px solid var(--color-primary)' })}
			onDragLeave={() => setFileStyles({})}
			onDragEnd={() => setCurrentlyDragging({ type: '', id: '', path: '' })}
			onDragOver={(e) => e.preventDefault()}
			onDrop={handleDrop}
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
					onBlur={(e) => saveDocNameChange(e.target.value ? e.target.value : 'Unnamed')}
					onFocus={(e) => e.target.select()}
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
