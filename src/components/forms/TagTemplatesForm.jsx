import React, { Fragment, useContext, useEffect, useLayoutEffect, useState } from 'react';

import PopupModal from '../containers/PopupModal';
import ConfirmDeleteButton from '../buttons/ConfirmDeleteButton';

import { LeftNavContext } from '../../contexts/leftNavContext';

import TagSingleSVG from '../../assets/svg/TagSingleSVG';
import DragSVG from '../../assets/svg/DragSVG';
import TrashSVG from '../../assets/svg/TrashSVG';
import PlusSVG from '../../assets/svg/PlusSVG';
import CaratDownSVG from '../../assets/svg/CaratDownSVG';

import { reorderArray } from '../../utils/utils';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Swal from 'sweetalert2';
import Collapse from 'react-css-collapse';
import { RightNavContext } from '../../contexts/rightNavContext';

// wikiMetadata = {
//   tagNames: {
//    1: Character,
//    2: Faction,
//   },
//   fieldNames: {
//     1: Height
//     2: Weight
//     3: Hair
//     4: Rank
//     5: Superior Officer
//     6: Hair
//   }
//   tagTemplates: {
//     1: [1, 2, 3],
//     2: [4, 5, 6],
//   },
//   wikis: {
//     doc5.json: {
//        1: {
//          1: '5\'10"'
//          2: '175lbs'
//          3: 'Brown, short cut, wavy'
//     }
//   }

const TagTemplatesForm = ({ setDisplayModal }) => {
	const [tags, setTags] = useState([]);
	const [openTags, setOpenTags] = useState({});
	const [tagsHaveLoaded, setTagsHaveLoaded] = useState(false);

	const { wikiMetadata, setWikiMetadata } = useContext(LeftNavContext);
	const { newTagTemplate, setNewTagTemplate } = useContext(RightNavContext);

	// DONE - Adds a new field to a tag
	const addField = (tagId) => {
		const tagIndex = tags.findIndex((item) => item.id === tagId);
		let newTags = JSON.parse(JSON.stringify(tags));
		let newFields = newTags[tagIndex].fields;

		// Find the current maxiumum id
		const allFields = tags.flatMap((item) => item.fields);
		const maxId = allFields.reduce((max, item) => (item.id > max ? item.id : max), 0);

		// const maxId = Math.max(
		// 	...(wikiMetadata.fieldNames ? Object.keys(wikiMetadata.fieldNames) : [0])
		// );

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

	// DONE - Adds a new tag
	const addTag = (origNewTagName = 'New Tag', origTags) => {
		let newTags = JSON.parse(JSON.stringify(origTags ? origTags : tags));

		// Find the current maxiumum id
		// const maxId = Math.max(
		// 	...(wikiMetadata.tagNames ? Object.keys(wikiMetadata.tagNames) : [0])
		// );
		const maxId = newTags.reduce((max, item) => (item.id > max ? item.id : max), 0);

		// Find a unique new tag name
		const usedTagNames = newTags.map((item) => item.tagName.toLowerCase());
		let newTagName = origNewTagName;
		let tagNameCounter = 1;
		while (usedTagNames.includes(newTagName.toLowerCase())) {
			newTagName = `${origNewTagName} (${tagNameCounter})`;
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
		setOpenTags((prev) => ({ ...prev, [newTag.id]: true }));
	};

	// DONE - Load in the initial folders
	useEffect(() => {
		let newTags = [];
		if (wikiMetadata.hasOwnProperty('tagTemplates')) {
			// Build the updated tags object from the wikiMetadata
			newTags = Object.keys(wikiMetadata.tagTemplates).map((tagId) => ({
				id: Number(tagId),
				tagName: wikiMetadata.tagNames[tagId],
				fields: wikiMetadata.tagTemplates[tagId].map((fieldId) => ({
					id: fieldId,
					fieldName: wikiMetadata.fieldNames[fieldId],
				})),
			}));
		}

		if (newTagTemplate) {
			// Will set the tags after adding the new one
			addTag(newTagTemplate, newTags);
			setNewTagTemplate('');
			return;
		}

		// Set the updated tags
		setTags(newTags);
	}, [wikiMetadata]);

	// DONE - Update the TAG. Will delete and cleanup isNew if required.
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

	// DONE - Update the FIELD. Will delete and cleanup isNew if required.
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

	// Save the tag templates back to the wikiMetadata
	const saveTagTemplates = () => {
		let newTagTemplates = {};
		let newTagNames = {};
		let newFieldNames = {};

		// Convert the tags to the tagTemplates, tagNames, and fieldNames format
		console.log('tags:', tags);
		for (let tag of tags) {
			// Build the tagTemplates
			newTagTemplates[tag.id] = tag.fields.map((field) => field.id);

			// Build the tagNames
			newTagNames[tag.id] = tag.tagName;

			// Build the list of fieldNames
			for (const field of tag.fields) {
				newFieldNames[field.id] = field.fieldName;
			}
		}

		// Update the wikiMetadata with the new tag templates
		setWikiMetadata((prev) => ({
			...prev,
			tagTemplates: newTagTemplates,
			tagNames: newTagNames,
			fieldNames: newFieldNames,
		}));

		setDisplayModal(false);
	};

	// DONE - Update the field order after drag and drop
	const onDragEnd = (result) => {
		console.log('result: ', result);

		// Check if order actually changed
		if (!result.destination || result.destination.index === result.source.index) {
			return;
		}

		console.log('tags:', tags);
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

	// If hitting enter when typing, select next field or create a new one
	const handleInputEnter = (e, tagId, fieldId) => {
		if (e.key === 'Enter') {
			// Check unique tag/field names
			if (!fieldId) {
				if (!checkIsUniqueTag(tagId)) {
					return;
				}
			} else {
				if (!checkIsUniqueField(tagId, fieldId)) {
					return;
				}
			}

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

			document.getElementById('field-input-' + tagId + '-' + newFieldId).focus();
		}
	};

	const checkIsUniqueTag = (tagId) => {
		// Grab the tag name
		const tag = tags.find((item) => item.id === tagId);
		const tagName = tag.tagName;

		// Check if another tag has the same name
		const matchIndex = tags.findIndex(
			(item) => item.tagName.toLowerCase() === tagName.toLowerCase() && item.id !== tagId
		);

		// If we found a matching tag (that isn't itself), prevent blur and fire alert
		console.log('matchIndex:', matchIndex);
		if (matchIndex !== -1) {
			// Alert the user of duplicate tag name
			Swal.fire({
				toast: true,
				title: 'Tag name must be unique.',
				target: document.getElementById('tag-input-' + tagId).parentElement,
				position: 'top-start',
				showConfirmButton: false,
				customClass: {
					container: 'new-tag-validation-alert',
				},
				timer: 3000,
				timerProgressBar: true,
			});

			// Refocus the element
			document.getElementById('tag-input-' + tagId).focus();

			return false;
		}

		return true;
	};

	const checkIsUniqueField = (tagId, fieldId) => {
		// Grab the tag name
		const tag = tags.find((item) => item.id === tagId);
		const fields = tag.fields;

		const field = fields.find((item) => item.id === fieldId);
		const fieldName = field.fieldName;

		// Check if another field has the same name
		const matchIndex = fields.findIndex(
			(item) => item.fieldName.toLowerCase() === fieldName.toLowerCase() && item.id !== fieldId
		);

		// If we found a matching field (that isn't itself), prevent blur and fire alert
		console.log('matchIndex:', matchIndex);
		if (matchIndex !== -1) {
			// Alert the user of duplicate tag name
			Swal.fire({
				toast: true,
				title: 'Field name must be unique.',
				target: document.getElementById('field-input-' + tagId + '-' + fieldId).parentElement,
				position: 'top-start',
				showConfirmButton: false,
				customClass: {
					container: 'new-tag-validation-alert',
				},
				timer: 3000,
				timerProgressBar: true,
			});

			// Refocus the element
			document.getElementById('field-input-' + tagId + '-' + fieldId).focus();

			return false;
		}

		return true;
	};

	// NOTE: If we rename an existing tag, make sure all uses of that name are converted in the wikis section

	return (
		<PopupModal setDisplayModal={setDisplayModal} width='22rem'>
			<h2 className='popup-modal-title'>Edit Tag Templates </h2>
			<hr className='modal-form-hr' />

			<div className='wiki-template-modal-body'>
				{/* Folder */}

				{tags.map((tag) => (
					<Fragment key={tag.id}>
						<div className='wiki-template-title'>
							<div
								onClick={() =>
									setOpenTags((prev) => ({
										...prev,
										[tag.id]: prev.hasOwnProperty(tag.id) ? !prev[tag.id] : true,
									}))
								}>
								<CaratDownSVG
									rotate={'-90'}
									className={'wiki-template-title-svg' + (openTags[tag.id] ? ' open' : '')}
								/>
							</div>

							{/* <TagSingleSVG className='wiki-template-title-svg' /> */}

							<input
								value={tag.tagName}
								autoFocus={tag.isNew}
								id={'tag-input-' + tag.id}
								onClick={() =>
									setOpenTags((prev) =>
										!prev[tag.id]
											? {
													...prev,
													[tag.id]: true,
											  }
											: prev
									)
								}
								onFocus={(e) => {
									e.target.select();
									if (tag.isNew) {
										updateTag(tag.id, false, e.target.value, true);
									}
								}}
								// Should be the equivalent of TAB
								onKeyDown={(e) => handleInputEnter(e, tag.id)}
								onChange={(e) => updateTag(tag.id, false, e.target.value)}
								onBlur={() => checkIsUniqueTag(tag.id)}
							/>

							{/* Delete Field */}
							<ConfirmDeleteButton
								title={`Delete '${tag.tagName}'`}
								message={`'${tag.tagName}', it's fields, and all data you've stored in them`}
								noOverlay
								deleteFunc={() => updateTag(tag.id, true)}>
								<div className='wiki-template-section-close-handle'>
									<TrashSVG />
								</div>
							</ConfirmDeleteButton>
						</div>

						<Collapse isOpen={openTags[tag.id]}>
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
																	className='tag-section-value'
																	id={'field-input-' + tag.id + '-' + field.id}
																	autoFocus={field.isNew}
																	onFocus={(e) => {
																		e.target.select();
																		if (field.isNew) {
																			updateField(
																				tag.id,
																				field.id,
																				false,
																				e.target.value,
																				true
																			);
																		}
																	}}
																	onBlur={() => checkIsUniqueField(tag.id, field.id)}
																	onKeyDown={(e) => handleInputEnter(e, tag.id, field.id)}
																	onChange={(e) =>
																		updateField(tag.id, field.id, false, e.target.value)
																	}
																/>

																{/* Delete Field */}
																<ConfirmDeleteButton
																	title={`Delete ${field.fieldName}`}
																	message={`${field.fieldName} and any data you've stored`}
																	noOverlay
																	deleteFunc={() => updateField(tag.id, field.id, true)}>
																	<div className='wiki-template-section-close-handle'>
																		<TrashSVG />
																	</div>
																</ConfirmDeleteButton>
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
						</Collapse>
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
