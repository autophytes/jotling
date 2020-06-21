import React, { useCallback } from 'react';
import NavDocument from './NavDocument';
import NavFolder from './NavFolder';

const LeftNavContent = ({ docStructure, setDocStructure, currentTab }) => {
	// Loops through the document structure and builds out the file/folder tree
	const buildFileStructure = useCallback((doc, path) => {
		return doc.children.map((child) => {
			if (child.type === 'doc') {
				return <NavDocument child={child} path={[path, 'children'].join('/')} />;
			}
			if (child.type === 'folder') {
				const hasChildren = !!doc.folders[child.id]['children'].length;
				return (
					<div className='file-nav folder' key={'folder-' + child.id}>
						<NavFolder
							child={child}
							folder={doc.folders[child.id]}
							path={[path, 'folders'].join('/')}
						/>
						{hasChildren && (
							<div className='folder-contents'>
								{buildFileStructure(
									doc.folders[child.id],
									[path, 'folders', child.id].join('/')
								)}
							</div>
						)}
					</div>
				);
			}
			return <></>;
		});
	}, []);

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
