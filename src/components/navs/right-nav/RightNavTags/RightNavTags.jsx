import React, { useContext, useState, useEffect, useCallback, Fragment } from 'react';
import CloseSVG from '../../../../assets/svg/CloseSVG';
import PlusSVG from '../../../../assets/svg/PlusSVG';

import TextareaAutosize from 'react-textarea-autosize';
import { LeftNavContext } from '../../../../contexts/leftNavContext';
import AddTagPopper from './AddTagPopper';
import { findFilePath, retrieveContentAtPropertyPath } from '../../../../utils/utils';

let fieldTimeouts = {};

const RightNavTags = ({ activeTab }) => {
	const { wikiMetadata, setWikiMetadata, navData, docStructure } = useContext(LeftNavContext);
	const { currentDoc, currentDocTab } = navData;

	const [tags, setTags] = useState([]);
	const [displayAddTagPopper, setDisplayAddTagPopper] = useState(false);
	const [displayDoc, setDisplayDoc] = useState('');
	const [currentDocName, setCurrentDocName] = useState('Page Name');

	// FIRST, CONTROL WHAT WIKI PAGE WE ARE VIEWING DATA FOR
	// WILL NEED TO FIND THE TAB IT IS IN
	// // Pull the current doc name
	// useEffect(() => {
	// 	// const docPath = findFilePath(currentFolder, path, fileType, fileId))
	// 	if (!navData.currentDocTab || !navData.currentDoc) {
	// 		return;
	// 	}

	// 	const docId = navData.currentDoc.slice(3, -5);
	// 	console.log('docId:', docId)
	// 	console.log('navData.currentDocTab:', navData.currentDocTab)

	// 	const docPath = findFilePath(docStructure[navData.currentDocTab], '', 'doc', docId);
	// 	console.log('docPath:', docPath);
	// 	const children = retrieveContentAtPropertyPath(docPath, docStructure[navData.currentTab]);
	// 	console.log('children:', children);
	// }, [navData, docStructure]);

	// When opening a new page, check if it is a wiki page
	useEffect(() => {
		console.log('currentDoc:', currentDoc);
		console.log('currentDocTab:', currentDocTab);
		if (currentDocTab === 'pages') {
			setDisplayDoc(currentDoc);
		} else {
			setDisplayDoc('');
		}
	}, [currentDoc, currentDocTab]);

	// If the page we opened isn't a wiki page, use the displayDoc from the metadata
	useEffect(() => {
		if (!displayDoc && wikiMetadata.displayDoc && wikiMetadata.displayDoc !== displayDoc) {
			setDisplayDoc(wikiMetadata.displayDoc);
		}
	}, [wikiMetadata, displayDoc]);

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
					[displayDoc]: { 1: {}, 2: {} },
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

		// // Loop through all tags added to the current wiki page
		// for (let tagId in wikiMetadata.wikis[displayDoc]) {
		// 	const tagValueObj = wikiMetadata.wikis[displayDoc][tagId];

		// 	// List all of the fields from the template
		// 	console.log('wikiMetadata:', wikiMetadata);
		// 	const newFields = wikiMetadata.tagTemplates[tagId].map((fieldId) => ({
		// 		id: fieldId,
		// 		fieldName: wikiMetadata.fieldNames[fieldId],
		// 		// If we have a value, pull that. Otherwise default to empty string.
		// 		value: tagValueObj[fieldId] ? tagValueObj[fieldId] : '',
		// 	}));

		// 	newTags.push({
		// 		id: tagId,
		// 		tagName: wikiMetadata.tagNames[tagId],
		// 		fields: newFields,
		// 	});
		// }

		// setTags(newTags);

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
				newWikiMetadata.wikis[currentDoc][tagId][fieldId] = value;
				return newWikiMetadata;
			});
		}, 1000);
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
	//   }

	return (
		<>
			<p className='left-nav-section-title'>{currentDocName}</p>

			<div className='tags-row'>
				{tags.map((tag) => (
					<div className='tags-row-button' key={tag.id}>
						<CloseSVG />
						{tag.tagName}
					</div>
				))}
				<div className='tags-row-button add-tag' onClick={() => setDisplayAddTagPopper(true)}>
					<PlusSVG />
					Tag
				</div>
			</div>

			<div className='right-nav-content'>
				<div className='tags-content'>
					<div className='tag-section'>
						{tags.map((tag) => (
							<Fragment key={tag.id}>
								<p className='tag-section-title'>{tag.tagName}</p>
								<div className='tag-section-fields'>
									{tag.fields.map((field) => (
										<Fragment key={field.id}>
											<p className='tag-section-key'>{field.fieldName}</p>
											<TextareaAutosize
												minRows={1}
												maxRows={6}
												value={field.value}
												onChange={(e) => handleFieldChange(e.target.value, tag.id, field.id)}
												className='tag-section-value'
											/>
										</Fragment>
									))}
								</div>
							</Fragment>
						))}
					</div>
				</div>
			</div>

			{displayAddTagPopper && <AddTagPopper setDisplayAddTagPopper={setDisplayAddTagPopper} />}
		</>
	);
};

export default RightNavTags;
