import React, { useCallback, useState, useContext, useRef, useEffect } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName, moveFileToPath } from '../../../utils/utils';
import { findAllDocsInFolder } from '../navFunctions';
import { updateQuotesInString } from '../../editor/editorInputFunctions';

import Swal from 'sweetalert2';

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

	const { navData, setNavData, docStructure, setDocStructure, docStructureRef } = useContext(
		LeftNavContext
	);

	const handleClick = useCallback(() => {
		navData.currentDoc !== child.fileName &&
			setNavData({
				...navData,
				currentDoc: child.fileName,
				currentDocTab: navData.currentTab,
				lastClicked: { type: 'doc', id: child.id },
			});
	}, [setNavData, child, navData]);

	const saveDocNameChange = useCallback(
		(newName, isBlur) => {
			console.log('isBlur:', isBlur);
			console.log('newName:', newName);
			// If on the wiki tab, pull the page names
			let wikiNames = [];
			if (navData.currentTab === 'pages') {
				const allWikiDocs = findAllDocsInFolder(docStructureRef.current.pages);
				const filteredDocs = allWikiDocs.filter((item) => item.id !== child.id);
				wikiNames = filteredDocs.map((item) => item.name.toLowerCase());
				console.log('wikiNames:', wikiNames);
			}

			// If the new name is already a wiki page name (if on the wiki tab)
			if (wikiNames.includes(newName.toLowerCase())) {
				// Visual indicator of invalid name
				Swal.fire({
					toast: true,
					title: 'Wiki name must be unique.',
					target: document.getElementById('left-nav'),
					position: 'top-start',
					showConfirmButton: false,
					customClass: {
						container: 'new-wiki-validation-alert',
					},
					timer: 3000,
					timerProgressBar: true,
				});

				// If clicking away, disable edit mode
				if (isBlur) {
					setFileName(child.name);
					setNavData({ ...navData, editFile: '' });
				}
			} else {
				// Set the new document name
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
			}
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
		<div
			className='file-nav-button-wrapper'
			style={fileStyles}
			onDragLeave={() => setFileStyles({})}
			onDragOver={handleDragOver}
			onDrop={handleDrop}>
			<button
				className={
					'file-nav document' + (navData.currentDoc === child.fileName ? ' active' : '')
				}
				data-context-menu-item-type='doc'
				data-context-menu-item-id={child.id}
				data-context-menu-current-tab={navData.currentTab}
				ref={docRef}
				draggable
				onDragStart={() => {
					setCurrentlyDragging({ type: 'doc', id: child.id, path });
					setIsBeingDragged(true);
				}}
				// onDragEnter={() => setFileStyles({ borderBottom: '2px solid var(--color-primary)' })}

				onDragEnd={() => {
					setCurrentlyDragging({ type: '', id: '', path: '' });
					setIsBeingDragged(false);
				}}
				onClick={handleClick}
				// onDoubleClick={() => setNavData({ ...navData, editFile: 'doc-' + child.id })}
			>
				<div className='svg-wrapper'>
					<DocumentSingleSVG />
				</div>
				{navData.editFile === 'doc-' + child.id ? (
					<input
						type='text'
						value={fileName}
						autoFocus
						onChange={(e) => setFileName(e.target.value)}
						onBlur={(e) =>
							saveDocNameChange(
								e.target.value ? updateQuotesInString(e.target.value) : 'Unnamed',
								true
							)
						}
						onFocus={(e) => e.target.select()}
						onKeyUp={(e) => {
							if (e.key === 'Enter') {
								// saveDocNameChange(
								// 	e.target.value ? updateQuotesInString(e.target.value) : 'Unnamed'
								// );
								e.target.blur();
							}
							if (e.key === 'Escape') {
								setFileName(child.name);
								setNavData({ ...navData, editFile: '' });
							}
						}}
					/>
				) : (
					<span>{child.name}</span>
				)}
			</button>
		</div>
	);
};

export default NavDocument;
