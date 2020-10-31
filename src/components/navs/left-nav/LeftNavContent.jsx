import React, { useCallback, useState, useContext, useEffect } from 'react';
import NavDocument from './NavDocument';
import NavFolder from './NavFolder';
import NavFolderEmpty from './NavFolderEmpty';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import Collapse from 'react-css-collapse';
import NavTrash from './NavTrash';

const LeftNavContent = () => {
	const [openFolders, setOpenFolders] = useState({});
	const [currentlyDragging, setCurrentlyDragging] = useState({ type: '', id: '', path: '' });

	const { docStructure, navData, setNavData } = useContext(LeftNavContext);
	const { parentFolders } = navData;

	// When opening a new document, open the parent folders of the first document
	useEffect(() => {
		if (parentFolders) {
			let newOpenFolders = {};
			for (let folderId of parentFolders) {
				newOpenFolders[folderId] = true;
			}
			setNavData({ ...navData, parentFolders: null });
			setOpenFolders({ ...newOpenFolders });
		}
	}, [parentFolders, openFolders, navData]);

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
			if (openFolders[folderId] !== isOpen) {
				setOpenFolders({ ...openFolders, [folderId]: isOpen });
			}
		},
		[openFolders, setOpenFolders]
	);

	// Loops through the document structure and builds out the file/folder tree
	const buildFileStructure = useCallback(
		(doc, path) => {
			return doc.children.map((child) => {
				if (child.type === 'doc') {
					return (
						<NavDocument
							child={child}
							path={[path, 'children'].join('/')}
							{...{ currentlyDragging, setCurrentlyDragging, openCloseFolder }}
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
						setOpenFolders({ ...openFolders, [child.id]: true });
					}
					return (
						<div className='file-nav folder' key={'folder-' + child.id}>
							<NavFolder
								child={child}
								path={[path, 'children'].join('/')}
								{...{
									handleFolderClick,
									openCloseFolder,
									currentlyDragging,
									setCurrentlyDragging,
									isOpen,
								}}
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
		},
		[currentlyDragging, openFolders, handleFolderClick, openCloseFolder]
	);

	return (
		<div className='left-nav-content'>
			{Object.keys(docStructure).length ? (
				buildFileStructure(docStructure[navData.currentTab], '')
			) : (
				<></>
			)}
			{docStructure.trash && <NavTrash />}
		</div>
	);
};

export default LeftNavContent;
