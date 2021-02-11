import React, { Fragment, useContext, useEffect, useLayoutEffect, useState } from 'react';

import PopupModal from '../containers/PopupModal';

import { LeftNavContext } from '../../contexts/leftNavContext';

import TagSingleSVG from '../../assets/svg/TagSingleSVG';
import DragSVG from '../../assets/svg/DragSVG';
import TrashSVG from '../../assets/svg/TrashSVG';
import PlusSVG from '../../assets/svg/PlusSVG';

import { reorderArray } from '../../utils/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const TagTemplatesForm = ({ setDisplayModal }) => {
	const [tags, setTags] = useState([]);

	const { wikiMetadata, setWikiMetadata } = useContext(LeftNavContext);

	// Load in the initial folders
	useEffect(() => {
		let newTags = [];
		if (wikiMetadata.hasOwnProperty('tagTemplates')) {
			newTags = Object.keys(wikiMetadata.tagTemplates).map((key, i) => ({
				id: i + 1,
				tagName: key,
				fields: wikiMetadata.tagTemplates[key].map((field, j) => ({
					id: j + 1,
					fieldName: field,
				})),
			}));
		}

		setTags(newTags);
	}, []);

	// DONE - Adds a new section to a given folder
	const addField = (tagId) => {
		const tagIndex = tags.findIndex((item) => item.id === tagId);
		let newTags = JSON.parse(JSON.stringify(tags));
		let newFields = newTags[tagIndex].fields;

		// Find the current maxiumum id
		const maxId = newFields.reduce((max, item) => (item.id > max ? item.id : max), 0);

		// Find a unique new field name
		const usedFieldNames = newFields.map((item) => item.fieldName.toLowerCase());
		let newFieldName = 'New Field';
		let fieldNameCounter = 1;
		while (usedFieldNames.includes(newFieldName.toLowerCase())) {
			newFieldName = `New Field (${fieldNameCounter})`;
			fieldNameCounter++;
		}

		// Push the new section. isNew will autoFocus the section title.
		newFields.push({
			id: maxId + 1,
			fieldName: newFieldName,
			isNew: true,
		});
		newTags[tagIndex].fields = newFields;

		setTags(newTags);
	};

	// DONE - Adds a new section to a given folder
	const addTag = () => {
		let newTags = JSON.parse(JSON.stringify(tags));

		// Find the current maxiumum id
		const maxId = newTags.reduce((max, item) => (item.id > max ? item.id : max), 0);

		// Find a unique new tag name
		const usedTagNames = newTags.map((item) => item.tagName.toLowerCase());
		let newTagName = 'New Tag';
		let tagNameCounter = 1;
		while (usedTagNames.includes(newTagName.toLowerCase())) {
			newTagName = `New Tag (${tagNameCounter})`;
			tagNameCounter++;
		}

		// Spin up a new tag
		let newTag = {
			id: maxId + 1,
			tagName: newTagName,
			isNew: true,
			fields: [
				{
					id: 1,
					fieldName: 'New Field',
				},
			],
		};

		// Push the new tag. isNew will autoFocus the tag title.
		newTags.push(newTag);

		setTags(newTags);
	};

	// Update the TAG. Will delete and cleanup isNew if required.
	const updateTag = (tagId, shouldDelete, newName, shouldRemoveNew) => {
		const tagIndex = tags.findIndex((item) => item.id === tagId);
		let newTags = JSON.parse(JSON.stringify(tags));

		// If shouldDelete, remove the section
		if (shouldDelete) {
			newTags.splice(tagIndex, 1);
		} else {
			// Otherwise, update the section name
			newTags[tagIndex].tagName = newName;
		}

		// Remove the isNew flag that autoFocuses the section
		if (shouldRemoveNew) {
			delete newTags[tagIndex].isNew;
		}

		setTags(newTags);
	};

	// Update the FIELD. Will delete and cleanup isNew if required.
	const updateField = (tagId, fieldId, shouldDelete, newName, shouldRemoveNew) => {
		const tagIndex = tags.findIndex((item) => item.id === tagId);
		let newTags = JSON.parse(JSON.stringify(tags));

		let newFields = newTags[tagIndex].fields;
		const fieldIndex = newFields.findIndex((item) => item.id === fieldId);

		// If shouldDelete, remove the section
		if (shouldDelete) {
			newFields.splice(fieldIndex, 1);
		} else {
			// Otherwise, update the section name
			newFields[fieldIndex].fieldName = newName;
		}

		// Remove the isNew flag that autoFocuses the section
		if (shouldRemoveNew) {
			delete newFields[fieldIndex].isNew;
		}

		newTags[tagIndex].fields = newFields;

		setTags(newTags);
	};

	// wikiMetadata = {
	//   tagTemplates: {
	//     character: ['Height', 'Weight', 'Hair'],
	//     faction: ['Height', 'Weight', 'Hair'],
	//     'crag\'s edge': ['Height', 'Weight', 'Hair'],
	//   },
	//   wikis: {
	//     kynan: {}
	//   }

	// DONE - Save the tag templates back to the wikiMetadata
	const saveTagTemplates = () => {
		// Convert the tags to the tagTemplates format
		let newTagTemplates = {};
		for (let tag of tags) {
			newTagTemplates[tag.tagName] = tag.fields.map((field) => field.fieldName);
		}

		// Update the wikiMetadata with the new tag templates
		setWikiMetadata((prev) => ({
			...prev,
			tagTemplates: newTagTemplates,
		}));

		setDisplayModal(false);
	};

	// DONE - Update the section order after drag and drop
	const onDragEnd = (result) => {
		console.log('result: ', result);

		// Check if order actually changed
		if (!result.destination || result.destination.index === result.source.index) {
			return;
		}

		const tagIndex = tags.findIndex((tag) => tag.id === Number(result.source.droppableId));
		const fields = tags[tagIndex].fields;

		// Move element from the source index to the destination index
		const reorderedFields = reorderArray(
			fields,
			result.source.index,
			result.destination.index
		);

		let newTags = [...tags];
		newTags[tagIndex].fields = reorderedFields;
		setTags(newTags);
	};

	// DONE - If hitting enter when typing a field name, create a new field
	const handleInputEnter = (e, tagId, fieldId) => {
		if (e.key === 'Enter') {
			const tag = tags.find((item) => item.id === tagId);

			// If last field in tag or there are no tags, add new field
			if (!tag.fields.length || fieldId === tag.fields[tag.fields.length - 1].id) {
				addField(tagId);
				return;
			}

			// If no field (called on a tag), focus the first tag
			let newFieldId;
			if (!fieldId) {
				newFieldId = tag.fields[0].id;
			} else {
				// Otherwise, focus the NEXT tag
				const fieldIndex = tag.fields.findIndex((item) => item.id === fieldId);
				newFieldId = tag.fields[fieldIndex + 1].id;
			}

			const inputEl = document.getElementById('input-' + tagId + '-' + newFieldId);
			inputEl.focus();
		}
	};

	// NOTE: Enforce uniqueness of tag names & fields
	// Add tag name inputs
	// Handle tag name changes
	// Delete tags
	// If we rename an existing tag, make sure all uses of that name are converted in the wikis section
	// Hide the drag handle and delete button unless row is hovered over? (metadata && sections)

	return (
		<PopupModal setDisplayModal={setDisplayModal} width='25rem'>
			<h2 className='popup-modal-title'>Edit Tag Templates </h2>
			<hr className='modal-form-hr' />

			<div className='wiki-template-modal-body'>
				{/* Folder */}

				{tags.map((tag) => (
					<Fragment key={tag.id}>
						<div className='wiki-template-title'>
							<TagSingleSVG />
							<input
								value={tag.tagName}
								autoFocus={tag.isNew}
								onFocus={(e) => {
									e.target.select();
									if (tag.isNew) {
										updateTag(tag.id, false, e.target.value, true);
									}
								}}
								// Should be the equivalent of TAB
								onKeyDown={(e) => handleInputEnter(e, tag.id)}
								onChange={(e) => updateTag(tag.id, false, e.target.value)}
							/>
						</div>

						<div className='wiki-template-section-list'>
							<DragDropContext onDragEnd={onDragEnd}>
								<Droppable droppableId={tag.id.toString()}>
									{(provided) => (
										<div ref={provided.innerRef} {...provided.droppableProps}>
											{/* SECTIONS */}
											{tag.fields.map((field, r) => (
												<Draggable
													draggableId={tag.tagName + field.id}
													index={r}
													key={tag.tagName + field.id}>
													{(provided) => (
														<div
															className='wiki-template-section-row'
															// key={field}
															ref={provided.innerRef}
															{...provided.draggableProps}>
															{/* Drag Handle */}
															<div
																className='wiki-template-section-drag-handle'
																{...provided.dragHandleProps}
																tabIndex={-1}>
																<DragSVG />
															</div>

															{/* Field Name */}
															<input
																value={field.fieldName}
																id={'input-' + tag.id + '-' + field.id}
																autoFocus={field.isNew}
																onFocus={(e) => {
																	e.target.select();
																	if (field.isNew) {
																		updateField(tag.id, field.id, false, e.target.value, true);
																	}
																}}
																onKeyDown={(e) => handleInputEnter(e, tag.id, field.id)}
																onChange={(e) =>
																	updateField(tag.id, field.id, false, e.target.value)
																}
															/>

															{/* Delete Section */}
															<div
																className='wiki-template-section-close-handle'
																onClick={() => updateField(tag.id, field.id, true)}>
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
							<button className='wiki-template-add-section' onClick={() => addField(tag.id)}>
								<PlusSVG />
								{/* <span className='wiki-template-add-section-plus'>+</span> */}
								Field
							</button>
						</div>
					</Fragment>
				))}

				{/* Add New Tag */}
				<div className='wiki-template-title add-tag' onClick={addTag}>
					<TagSingleSVG />
					<p>Add Tag</p>
				</div>

				<div className='modal-button-row'>
					<button className='submit-button' onClick={saveTagTemplates}>
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

export default TagTemplatesForm;
