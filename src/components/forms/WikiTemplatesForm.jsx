import React, { Fragment, useContext, useEffect, useState } from 'react';
import TemplatesSVG from '../../assets/svg/TemplatesSVG';
import DragSVG from '../../assets/svg/DragSVG';
import CloseSVG from '../../assets/svg/CloseSVG';
import { LeftNavContext } from '../../contexts/leftNavContext';
import PopupModal from '../containers/PopupModal';

const WikiTemplatesForm = ({ setDisplayModal }) => {
	const [folders, setFolders] = useState([]);

	const { docStructure } = useContext(LeftNavContext);

	// Load in the initial folders
	useEffect(() => {
		const wikiStructure = docStructure.pages;
		const origFolders = wikiStructure.children.filter((item) => item.type === 'folder');
		const newFolders = origFolders.map((folder) => ({
			...folder,
			templateSections: folder.templateSections
				? folder.templateSections.map((section, i) => ({
						id: i,
						name: section,
				  }))
				: [],
		}));

		setFolders(newFolders);
	}, []);

	const addSection = (folderId) => {
		const folderIndex = folders.findIndex((item) => item.id === folderId);
		let newFolders = JSON.parse(JSON.stringify(folders));

		let templateSections = newFolders[folderIndex].templateSections;
		const maxId = templateSections.reduce((max, item) => (item.id > max ? item.id : max), 0);

		templateSections.push({
			id: maxId + 1,
			name: 'New Section',
		});
		newFolders[folderIndex].templateSections = templateSections;

		setFolders(newFolders);
	};

	const updateSection = (folderId, sectionId, newName) => {
		const folderIndex = folders.findIndex((item) => item.id === folderId);
		let newFolders = JSON.parse(JSON.stringify(folders));

		let templateSections = newFolders[folderIndex].templateSections;
		const sectionIndex = templateSections.findIndex((item) => item.id === sectionId);

		templateSections[sectionIndex].name = newName;

		newFolders[folderIndex].templateSections = templateSections;

		setFolders(newFolders);
	};

	return (
		<PopupModal setDisplayModal={setDisplayModal} width='30rem'>
			<h2 className='popup-modal-title'>Edit Templates</h2>
			<hr className='modal-form-hr' />

			<div className='delete-modal-body'>
				{folders.map((folder) => (
					<Fragment key={folder.id}>
						<div className='wiki-template-title'>
							<TemplatesSVG />
							<p>{folder.name}</p>
						</div>

						<div className='wiki-template-section-list'>
							{folder.templateSections.map((section) => (
								<div className='wiki-template-section-row'>
									<DragSVG />
									<CloseSVG />
									<input
										key={section.id}
										value={section.name}
										onChange={(e) => updateSection(folder.id, section.id, e.target.value)}
									/>
								</div>
							))}

							<button
								className='wiki-template-add-section'
								onClick={() => addSection(folder.id)}>
								Add Section
							</button>
						</div>
					</Fragment>
				))}

				<div className='delete-modal-button-row'>
					<button
						className='submit-button delete-modal-delete'
						onClick={() => console.log('saving changes')}>
						Save
					</button>
					<button className='submit-button' onClick={() => setDisplayModal(false)}>
						Cancel
					</button>
				</div>
			</div>
		</PopupModal>
	);
};

export default WikiTemplatesForm;
