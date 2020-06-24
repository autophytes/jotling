import React, { useCallback, useState } from 'react';
import NavDocument from './NavDocument';
import NavFolder from './NavFolder';

import Collapse from 'react-css-collapse';

const LeftNavContent = ({
	docStructure,
	setDocStructure,
	currentTab,
	currentDoc,
	setCurrentDoc,
}) => {
	const [openFolders, setOpenFolders] = useState({});

	// Toggles open/close on folders
	const handleFolderClick = useCallback(
		(folderId) => {
			console.log('folder clicked: ', folderId);
			console.log('new isOpen: ', !openFolders[folderId]);
			setOpenFolders({ ...openFolders, [folderId]: !openFolders[folderId] });
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
						currentDoc={currentDoc}
						setCurrentDoc={setCurrentDoc}
						path={[path, 'children'].join('/')}
					/>
				);
			}
			if (child.type === 'folder') {
				const hasChildren = !!doc.folders[child.id]['children'].length;
				let isOpen;
				if (openFolders.hasOwnProperty('folder-' + child.id)) {
					isOpen = openFolders['folder-' + child.id];
				} else {
					isOpen = false;
					setOpenFolders({ ...openFolders, ['folder-' + child.id]: false });
				}
				return (
					<div className='file-nav folder' key={'folder-' + child.id}>
						<NavFolder
							child={child}
							folder={doc.folders[child.id]}
							path={[path, 'folders'].join('/')}
							handleFolderClick={handleFolderClick}
						/>
						<Collapse isOpen={isOpen}>
							{hasChildren && (
								<div className='folder-contents'>
									{buildFileStructure(
										doc.folders[child.id],
										[path, 'folders', child.id].join('/')
									)}
								</div>
							)}
						</Collapse>
					</div>
				);
			}
			return <></>;
		});
	});

	return (
		<div className='left-nav-content'>{buildFileStructure(docStructure[currentTab], '')}</div>
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
