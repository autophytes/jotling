import React, { useCallback, useState, useContext } from 'react';
import NavDocument from './NavDocument';
import NavFolder from './NavFolder';
import NavFolderEmpty from './NavFolderEmpty';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import Collapse from 'react-css-collapse';

const LeftNavContent = () => {
	const [openFolders, setOpenFolders] = useState({});
	const [currentlyDragging, setCurrentlyDragging] = useState({ type: '', id: '', path: '' });

	const { docStructure, navData, setNavData } = useContext(LeftNavContext);

	// Toggles open/close on folders
	const handleFolderClick = useCallback(
		(folderId) => {
			setOpenFolders({ ...openFolders, [folderId]: !openFolders[folderId] });
			setNavData({ ...navData, lastClicked: { type: 'folder', id: folderId } });
		},
		[openFolders, setOpenFolders, navData]
	);

	// Toggles open/close on folders
	const openCloseFolder = useCallback(
		(folderId, isOpen) => {
			setOpenFolders({ ...openFolders, [folderId]: isOpen });
		},
		[openFolders, setOpenFolders]
	);

	// Loops through the document structure and builds out the file/folder tree
	const buildFileStructure = useCallback((doc, path) => {
		return doc.children.map((child) => {
			if (child.type === 'doc') {
				return (
					<NavDocument
						child={child}
						path={[path, 'children'].join('/')}
						currentlyDragging={currentlyDragging}
						setCurrentlyDragging={setCurrentlyDragging}
						key={'doc-' + child.id}
					/>
				);
			}
			if (child.type === 'folder') {
				const hasChildren = !!doc.folders[child.id]['children'].length;
				let isOpen;
				if (openFolders.hasOwnProperty(child.id)) {
					isOpen = openFolders[child.id];
				} else {
					isOpen = false;
					setOpenFolders({ ...openFolders, [child.id]: false });
				}
				return (
					<div className='file-nav folder' key={'folder-' + child.id}>
						<NavFolder
							child={child}
							path={[path, 'children'].join('/')}
							handleFolderClick={handleFolderClick}
							openCloseFolder={openCloseFolder}
							currentlyDragging={currentlyDragging}
							setCurrentlyDragging={setCurrentlyDragging}
							isOpen={isOpen}
						/>
						<Collapse isOpen={isOpen}>
							<div className='folder-contents'>
								{hasChildren ? (
									buildFileStructure(
										doc.folders[child.id],
										[path, 'folders', child.id].join('/')
									)
								) : (
									<NavFolderEmpty
										path={[path, 'folders', child.id, 'children'].join('/')}
										currentlyDragging={currentlyDragging}
									/>
								)}
							</div>
						</Collapse>
					</div>
				);
			}
			// return <></>;
		});
	});

	return (
		<div className='left-nav-content'>
			{buildFileStructure(docStructure[navData.currentTab], '')}
		</div>
	);
};

export default LeftNavContent;

{
	/* <div className='file-nav folder'>
				<p className='file-nav folder title'>Chapter 1</p>
				<div className='folder-contents'>
					<p className='file-nav document'>Sub 1</p>
					<div className='file-nav folder'>
						<p className='file-nav folder title'>Sub 2</p>
						<div className='folder-contents'>
							<p className='file-nav document'>Sub sub 1</p>
							<p className='file-nav document'>Sub sub 2</p>
							<p className='file-nav document'>Sub sub 3</p>
						</div>
					</div>
				</div>
			</div>
			<p className='file-nav document'>Chapter 2</p>
			<p className='file-nav document'>Chapter 3</p>
			<p className='file-nav document'>Chapter 4</p>
			<p className='file-nav document'>Chapter 5</p> */
}