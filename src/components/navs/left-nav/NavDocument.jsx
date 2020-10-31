import React, { useCallback, useState, useContext, useRef, useEffect } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName, moveFileToPath } from '../../../utils/utils';

const NavDocument = ({
	path,
	child,
	currentlyDragging,
	setCurrentlyDragging,
	openCloseFolder,
}) => {
	const [fileName, setFileName] = useState(child.name);
	const [fileStyles, setFileStyles] = useState({});
	const [dragOverTopBottom, setDragOverTopBottom] = useState('');
	const [isBeingDragged, setIsBeingDragged] = useState(false);

	const docRef = useRef(null);

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

	// Determines whether currently dragging over the top/bottom half of the folder
	const handleDragOver = (e) => {
		e.preventDefault(); // Necessary for onDrop
		if (isBeingDragged) {
			return;
		}

		// Checks the mouse Y coordinate compared to the halfway Y coordinate of the doc
		let rect = docRef.current.getBoundingClientRect();
		if (rect.top + rect.height / 2 > e.clientY) {
			setFileStyles({ borderTop: '2px solid var(--color-primary)' });
			if (dragOverTopBottom !== 'top') {
				setDragOverTopBottom('top'); // Used to determine where to insert
			}
		} else {
			setFileStyles({ borderBottom: '2px solid var(--color-primary)' });
			if (dragOverTopBottom !== 'bottom') {
				setDragOverTopBottom('bottom'); // Used to determine where to insert
			}
		}
	};

	// Moves the file to below the destination folder on drop
	const handleDrop = useCallback(
		(e) => {
			let newCurrentFolder = moveFileToPath(
				docStructure[navData.currentTab],
				currentlyDragging,
				{ type: child.type, id: child.id, path },
				dragOverTopBottom
			);
			setDocStructure({ ...docStructure, [navData.currentTab]: newCurrentFolder });

			setFileStyles({});
		},
		[docStructure, navData, currentlyDragging, child, path, moveFileToPath, dragOverTopBottom]
	);

	// If the document is being edited and is inside a folder, open that folder
	useEffect(() => {
		if (navData.editFile === 'doc-' + child.id) {
			let noChildren =
				path.lastIndexOf('/') !== -1 ? path.slice(0, path.lastIndexOf('/')) : '';

			let containingFolderId =
				noChildren.lastIndexOf('/') !== -1
					? noChildren.slice(noChildren.lastIndexOf('/') + 1)
					: '';

			// If it's inside of a folder, open
			if (containingFolderId) {
				openCloseFolder(containingFolderId, true);
			}
		}
	}, [navData.editFile, child.id, openCloseFolder]);

	return (
		<button
			className={
				'file-nav document' + (navData.currentDoc === child.fileName ? ' active' : '')
			}
			data-context-menu-item-type='doc'
			data-context-menu-item-id={child.id}
			data-context-menu-current-tab={navData.currentTab}
			style={fileStyles}
			ref={docRef}
			draggable
			onDragStart={() => {
				setCurrentlyDragging({ type: 'doc', id: child.id, path });
				setIsBeingDragged(true);
			}}
			// onDragEnter={() => setFileStyles({ borderBottom: '2px solid var(--color-primary)' })}
			onDragLeave={() => setFileStyles({})}
			onDragEnd={() => {
				setCurrentlyDragging({ type: '', id: '', path: '' });
				setIsBeingDragged(false);
			}}
			onDragOver={handleDragOver}
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
					onKeyUp={(e) => {
						if (e.key === 'Enter' || e.keyCode === 27) {
							e.target.blur();
						}
					}}
				/>
			) : (
				<span>{child.name}</span>
			)}
		</button>
	);
};

export default NavDocument;
