import React, { Fragment, useContext, useEffect, useLayoutEffect, useState } from 'react';

import PopupModal from '../containers/PopupModal';

import { LeftNavContext } from '../../contexts/leftNavContext';

import TemplatesSVG from '../../assets/svg/TemplatesSVG';
import DragSVG from '../../assets/svg/DragSVG';
import TrashSVG from '../../assets/svg/TrashSVG';
import PlusSVG from '../../assets/svg/PlusSVG';

import { reorderArray } from '../../utils/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const WikiTemplatesForm = ({ setDisplayModal }) => {
	const [folders, setFolders] = useState([]);

	const { docStructure, setDocStructure } = useContext(LeftNavContext);

	// Load in the initial folders
	useEffect(() => {
		const wikiStructure = docStructure.pages;
		const origFolders = wikiStructure.children.filter((item) => item.type === 'folder');

		// Adds an id to each of the section titles. Needed for drag and drop.
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

	// Adds a new section to a given folder
	const addSection = (folderId) => {
		const folderIndex = folders.findIndex((item) => item.id === folderId);
		let newFolders = JSON.parse(JSON.stringify(folders));
		let templateSections = newFolders[folderIndex].templateSections;

		// Find the current maxiumum id
		const maxId = templateSections.reduce((max, item) => (item.id > max ? item.id : max), 0);

		// Push the new section. isNew will autoFocus the section title.
		templateSections.push({
			id: maxId + 1,
			name: 'New Section',
			isNew: true,
		});
		newFolders[folderIndex].templateSections = templateSections;

		setFolders(newFolders);
	};

	// Update the section text. Will delete and cleanup isNew if required.
	const updateSection = (folderId, sectionId, shouldDelete, newName, shouldRemoveNew) => {
		const folderIndex = folders.findIndex((item) => item.id === folderId);
		let newFolders = JSON.parse(JSON.stringify(folders));

		let templateSections = newFolders[folderIndex].templateSections;
		const sectionIndex = templateSections.findIndex((item) => item.id === sectionId);

		// If shouldDelete, remove the section
		if (shouldDelete) {
			templateSections.splice(sectionIndex, 1);
		} else {
			// Otherwise, update the section name
			templateSections[sectionIndex].name = newName;
		}

		// Remove the isNew flag that autoFocuses the section
		if (shouldRemoveNew) {
			delete templateSections[sectionIndex].isNew;
		}

		newFolders[folderIndex].templateSections = templateSections;

		setFolders(newFolders);
	};

	// Save the section templates back to their folders in the docStructure
	const saveSectionTemplates = () => {
		const wikiStructure = JSON.parse(JSON.stringify(docStructure.pages));
		let childrenArray = wikiStructure.children;

		// Update each folder with the templateSections
		for (const folder of folders) {
			const folderIndex = childrenArray.findIndex(
				(item) => item.type === 'folder' && item.id === folder.id
			);
			childrenArray[folderIndex].templateSections = folder.templateSections.map(
				(item) => item.name
			);
		}

		wikiStructure.children = childrenArray;
		setDocStructure((prev) => ({
			...prev,
			pages: wikiStructure,
		}));
		setDisplayModal(false);
	};

	// Update the section order after drag and drop
	const onDragEnd = (result) => {
		console.log('result: ', result);

		// Check if order actually changed
		if (!result.destination || result.destination.index === result.source.index) {
			return;
		}

		const folderIndex = folders.findIndex(
			(item) => item.id === Number(result.source.droppableId) && item.type === 'folder'
		);
		const templateSections = folders[folderIndex].templateSections;

		// Move element from the source index to the destination index
		const reorderedTemplateSections = reorderArray(
			templateSections,
			result.source.index,
			result.destination.index
		);

		let newFolders = [...folders];
		newFolders[folderIndex].templateSections = reorderedTemplateSections;
		setFolders(newFolders);
	};

	// If hitting enter when typing a section name, create a new section
	const handleInputEnter = (e, folderId) => {
		if (e.keyCode === 13) {
			addSection(folderId);
		}
	};

	return (
		<PopupModal setDisplayModal={setDisplayModal} width='22rem'>
			<h2 className='popup-modal-title'>Edit Templates</h2>
			<hr className='modal-form-hr' />

			<div className='wiki-template-modal-body'>
				{/* Folder */}
				{folders.map((folder) => (
					<Fragment key={folder.id}>
						<div className='wiki-template-title' style={{ paddingBottom: '0.25rem' }}>
							<TemplatesSVG />
							<p style={{ marginLeft: '0.25rem' }}>{folder.name}</p>
						</div>

						<div className='wiki-template-section-list'>
							<DragDropContext onDragEnd={onDragEnd}>
								<Droppable droppableId={folder.id.toString()}>
									{(provided) => (
										<div ref={provided.innerRef} {...provided.droppableProps}>
											{/* SECTIONS */}
											{folder.templateSections.map((section, r) => (
												<Draggable
													draggableId={section.id.toString()}
													index={r}
													key={section.id}>
													{(provided) => (
														<div
															className='wiki-template-section-row'
															key={section.id}
															ref={provided.innerRef}
															{...provided.draggableProps}>
															{/* Drag Handle */}
															<div
																className='wiki-template-section-drag-handle'
																{...provided.dragHandleProps}
																tabIndex={-1}>
																<DragSVG />
															</div>

															{/* Section Name */}
															<input
																key={section.id}
																value={section.name}
																autoFocus={section.isNew}
																onFocus={(e) => {
																	e.target.select();
																	if (section.isNew) {
																		updateSection(
																			folder.id,
																			section.id,
																			false,
																			e.target.value,
																			true
																		);
																	}
																}}
																onKeyDown={(e) => handleInputEnter(e, folder.id)}
																onChange={(e) =>
																	updateSection(folder.id, section.id, false, e.target.value)
																}
															/>

															{/* Delete Section */}
															<div
																className='wiki-template-section-close-handle'
																onClick={() => updateSection(folder.id, section.id, true)}>
																<TrashSVG />
															</div>
														</div>
													)}
												</Draggable>
											))}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							</DragDropContext>

							{/* Add Section */}
							<button
								className='wiki-template-add-section'
								onClick={() => addSection(folder.id)}>
								<PlusSVG />
								{/* <span className='wiki-template-add-section-plus'>+</span> */}
								Section
							</button>
						</div>
					</Fragment>
				))}

				<div className='modal-button-row'>
					<button className='submit-button' onClick={saveSectionTemplates}>
						Save
					</button>
					<button
						className='submit-button submit-button-cancel'
						onClick={() => setDisplayModal(false)}>
						Cancel
					</button>
				</div>
			</div>
		</PopupModal>
	);
};

export default WikiTemplatesForm;
