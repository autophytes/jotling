import React, { useContext, useState, useEffect, useCallback, Fragment, useRef } from 'react';
import CloseSVG from '../../../../assets/svg/CloseSVG';
import PlusSVG from '../../../../assets/svg/PlusSVG';

import TextareaAutosize from 'react-textarea-autosize';
import { LeftNavContext } from '../../../../contexts/leftNavContext';
import AddTagPopper from './AddTagPopper';
import { findFilePath, retrieveContentAtPropertyPath } from '../../../../utils/utils';
import { convertSetterToRefSetter } from '../../../../utils/contextUtils';
import EyeSVG from '../../../../assets/svg/EyeSVG';
import EyeHideSVG from '../../../../assets/svg/EyeHideSVG';

let fieldTimeouts = {};

const RightNavTags = ({ activeTab }) => {
	const {
		wikiMetadata,
		setWikiMetadata,
		navData,
		docStructure,
		editorStyles,
		showAllTags,
		setShowAllTags,
	} = useContext(LeftNavContext);
	const { currentDoc, currentDocTab } = navData;
	const { displayDoc: metadataDisplayDoc } = wikiMetadata;
	const { rightNav } = editorStyles;

	const [tags, setTagsOrig] = useState([]);
	const [displayAddTagPopper, setDisplayAddTagPopper] = useState(false);
	const [displayDoc, setDisplayDoc] = useState('');
	const [currentDocName, setCurrentDocName] = useState('Page Name');
	const [fieldSize, setFieldSize] = useState({});

	const tagsRef = useRef(tags);

	const setTags = (value) => {
		convertSetterToRefSetter(tagsRef, setTagsOrig, value);
	};

	// Pull the current doc name
	useEffect(() => {
		// If no displayDoc, reset the title
		if (!displayDoc) {
			setCurrentDocName('Page Name');
			return;
		}

		// Find the document
		const docId = Number(displayDoc.slice(3, -5));
		const docPath = findFilePath(docStructure.pages, '', 'doc', docId);

		// If invalid, reset
		if (!docPath) {
			setCurrentDocName('Page Name');
			return;
		}

		// Pull the document name
		const children = retrieveContentAtPropertyPath(
			docPath + (docPath ? '/children' : 'children'),
			docStructure['pages']
		);
		const newDoc = children.find((item) => item.id === docId);
		setCurrentDocName(newDoc.name);
	}, [displayDoc, docStructure]);

	// When opening a new page, check if it is a wiki page
	useEffect(() => {
		if (currentDocTab === 'pages') {
			setWikiMetadata((prev) => ({ ...prev, displayDoc: '' }));
			setDisplayDoc(currentDoc);
		}
	}, [currentDoc, currentDocTab]);

	// If the page we opened isn't a wiki page, use the displayDoc from the metadata
	useEffect(() => {
		if (metadataDisplayDoc) {
			setDisplayDoc(metadataDisplayDoc);
		}
	}, [metadataDisplayDoc]);

	// Ensure wikiMetadata has wikis and currentDoc props
	useEffect(() => {
		if (!displayDoc || !wikiMetadata.wikis) {
			return;
		}

		if (!wikiMetadata.wikis || !wikiMetadata.wikis[displayDoc]) {
			setWikiMetadata((prev) => ({
				...prev,
				wikis: {
					...(wikiMetadata.wikis ? wikiMetadata.wikis : {}),
					// TEMPORARY - replace with {}
					[displayDoc]: {},
				},
			}));
		}
	}, [wikiMetadata, displayDoc]);

	// Contruct a tags array to render
	useEffect(() => {
		// let newTags = [];

		if (!displayDoc || !wikiMetadata.wikis || !wikiMetadata.wikis[displayDoc]) {
			setTags([]);
			return;
		}

		setTags((prev) => {
			let newTags = [];

			for (let tagId in wikiMetadata.wikis[displayDoc]) {
				const tagValueObj = wikiMetadata.wikis[displayDoc][tagId];
				const tagIndex = prev.findIndex((item) => item.id === tagId);

				// List all of the fields from the template
				const newFields = wikiMetadata.tagTemplates[tagId].map((fieldId) => {
					// See if we already had a local field value
					let prevFieldValue;
					if (tagIndex !== -1) {
						const fieldIndex = prev[tagIndex].fields.findIndex((item) => item.id === fieldId);
						if (fieldIndex !== -1 && prev[tagIndex].fields[fieldIndex].value) {
							prevFieldValue = prev[tagIndex].fields[fieldIndex].value;
						}
					}

					return {
						id: fieldId,
						fieldName: wikiMetadata.fieldNames[fieldId],
						// If we have a value, pull that. Otherwise default to empty string.
						value: prevFieldValue
							? prevFieldValue
							: tagValueObj[fieldId]
							? tagValueObj[fieldId]
							: '',
					};
				});

				newTags.push({
					id: tagId,
					tagName: wikiMetadata.tagNames[tagId],
					fields: newFields,
				});
			}

			return newTags;
		});
	}, [wikiMetadata, displayDoc]);

	// On right-nav resize, recompute field line heights
	useEffect(() => {
		const fields = tagsRef.current.flatMap((tag) =>
			tag.fields.map((field) => ({ ...field, key: `${tag.id}_${field.id}` }))
		);

		let newFieldSize = {};
		fields.forEach((field) => {
			const fieldEl = document.getElementById(field.key);
			if (!fieldEl) {
				return;
			}

			let newHeight = fieldEl.offsetHeight;

			console.log('useEffect field.value: ', field.value);

			// If multi-line
			if (newHeight > 29) {
				newFieldSize[field.key] = {
					isExpanded: true,
					chars: field.value.length,
				};
			} else {
				// If single line

				newFieldSize[field.key] = {
					isExpanded: false,
				};
			}
		});

		setFieldSize(newFieldSize);
	}, [rightNav]);

	// Handle field keystrokes
	const handleFieldChange = (value, tagId, fieldId) => {
		// Update local tags
		let newTags = JSON.parse(JSON.stringify(tags));
		const tagIndex = tags.findIndex((item) => item.id === tagId);
		const fieldIndex = tags[tagIndex].fields.findIndex((item) => item.id === fieldId);

		// Update the individual field value
		newTags[tagIndex].fields[fieldIndex].value = value;
		setTags(newTags);

		// wikiMetadata = {
		//   wikis: {
		//     doc5.json: {
		//        1: {
		//           1: '5\'10"'

		// Debounce the wikiMetadata update
		clearTimeout(fieldTimeouts[fieldId]);
		fieldTimeouts[fieldId] = setTimeout(() => {
			setWikiMetadata((prev) => {
				let newWikiMetadata = JSON.parse(JSON.stringify(prev));
				newWikiMetadata.wikis[displayDoc][tagId][fieldId] = value;
				return newWikiMetadata;
			});
		}, 1000);
	};

	// Field height change handler
	const handleHeightChange = (newHeight, field, fieldKey) => {
		console.log('handleHeightChange field.value: ', field.value);
		// If multi-line
		if (newHeight > 29) {
			if ((fieldSize[fieldKey] && !fieldSize[fieldKey].isExpanded) || !fieldSize[fieldKey]) {
				setFieldSize((prev) => ({
					...prev,
					[fieldKey]: {
						isExpanded: true,
						chars: field.value.length,
					},
				}));
			}
		} else {
			// If single line

			if (
				(fieldSize[fieldKey] && !fieldSize[fieldKey].hasOwnProperty('isExpanded')) ||
				!fieldSize[fieldKey]
			) {
				setFieldSize((prev) => ({
					...prev,
					[fieldKey]: {
						...(prev[fieldKey] ? prev[fieldKey] : {}),
						isExpanded: false,
					},
				}));
			}
		}
		// If height is changing to > something (20 is 1 line, 38 is 2 lines)
		//   flag to expand to 100% width, store the num of characters it flipped at
	};

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
	//        }
	//     },
	//   },
	//   deleted: {
	//     doc6.json: {
	//       1: {
	//         1: '5\'10"'
	//         2: '175lbs'
	//         3: 'Brown, short cut, wavy'
	//       }
	//     }
	//   },

	return (
		<>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					position: 'relative',
				}}>
				<p className='left-nav-section-title'>{currentDocName}</p>

				{/* Show / Hide Keys/Links/Comments */}
				<button
					className={'nav-button right-nav-header' + (showAllTags ? ' active' : '')}
					style={{ justifySelf: 'flex-end' }}
					title='Show Wiki Links'
					onMouseDown={(e) => {
						e.preventDefault();
						setShowAllTags(!showAllTags);
					}}>
					{showAllTags ? <EyeSVG /> : <EyeHideSVG />}
				</button>
			</div>

			<div className='tags-row'>
				{tags.map((tag) => (
					<div className='tags-row-button' key={tag.id}>
						{tag.tagName}
					</div>
				))}
				{!!displayDoc && (
					<div
						className='tags-row-button add-tag'
						onClick={() => setDisplayAddTagPopper((prev) => !prev)}>
						<PlusSVG />
						Tag
					</div>
				)}
			</div>

			<div className='right-nav-content'>
				<div className='tags-content'>
					<div className='tag-section'>
						{tags.map((tag) => (
							<Fragment key={tag.id}>
								<p className='tag-section-title'>{tag.tagName}</p>
								<div className='tag-section-fields'>
									{tag.fields.map((field) => {
										const fieldKey = `${tag.id}_${field.id}`;
										return (
											<div className='tag-section-row' key={field.id}>
												<p className='tag-section-key'>{field.fieldName}:</p>
												<TextareaAutosize
													minRows={1}
													maxRows={6}
													cols={1}
													id={fieldKey}
													placeholder='New Field'
													className='tag-section-value'
													onChange={(e) => {
														handleFieldChange(e.target.value, tag.id, field.id);

														if (
															fieldSize[fieldKey] &&
															fieldSize[fieldKey].isExpanded &&
															e.target.value.length < fieldSize[fieldKey].chars
														) {
															setFieldSize((prev) => ({
																...prev,
																[fieldKey]: {
																	...(prev[fieldKey] ? prev[fieldKey] : {}),
																	isExpanded: false,
																},
															}));
														}
													}}
													onHeightChange={(newHeight) =>
														handleHeightChange(newHeight, field, fieldKey)
													}
													value={field.value}
													style={{
														width:
															!!fieldSize[fieldKey] && fieldSize[fieldKey].isExpanded
																? '100%'
																: 'auto',
													}}
												/>
											</div>
										);
									})}
								</div>
							</Fragment>
						))}
					</div>
				</div>
			</div>

			{displayAddTagPopper && (
				<AddTagPopper
					setDisplayAddTagPopper={setDisplayAddTagPopper}
					displayDoc={displayDoc}
				/>
			)}
		</>
	);
};

export default RightNavTags;
