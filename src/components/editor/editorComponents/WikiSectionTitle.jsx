import React, { useEffect, useState, useContext } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

// DECORATOR PROPS INCLUDE
// blockKey: BlockNodeKey,
// children?: Array<React.Node>,
// contentState: ContentState,
// decoratedText: string,
// dir: ?HTMLDir,
// end: number,
// // Many folks mistakenly assume that there will always be an 'entityKey'
// // passed to a DecoratorComponent.
// // To find the `entityKey`, Draft calls
// // `contentBlock.getEntityKeyAt(leafNode)` and in many cases the leafNode does
// // not have an entityKey. In those cases the entityKey will be null or
// // undefined. That's why `getEntityKeyAt()` is typed to return `?string`.
// // See https://github.com/facebook/draft-js/blob/2da3dcb1c4c106d1b2a0f07b3d0275b8d724e777/src/model/immutable/BlockNode.js#L51
// entityKey: ?string,
// offsetKey: string,
// start: number,

import {
	findFilePath,
	retrieveContentAtPropertyPath,
	setObjPropertyAtPropertyPath,
} from '../../../utils/utils';

export const WikiSectionDecorator = ({ children, decoratedText, blockKey, contentState }) => {
	const [synced, setSynced] = useState({ key: blockKey, text: '' });

	const { docStructureRef, setDocStructure, navData, navDataRef } = useContext(LeftNavContext);
	const [decoratorDoc] = useState(navData.currentDoc);

	// Sync our wiki-section changes to the docStructure
	useEffect(() => {
		// If changes need to be synced
		if (decoratedText !== synced.text || blockKey !== synced.key) {
			updateDocSections(
				false,
				navDataRef,
				blockKey,
				docStructureRef,
				setDocStructure,
				setSynced,
				contentState,
				decoratedText
			);
		}
	}, [decoratedText, blockKey, contentState]);

	// If the section is deleted, remove from the docStructure
	useEffect(() => {
		return () => {
			// If document has changed, no cleanup needed. Section was not deleted.
			if (decoratorDoc !== navDataRef.current.currentDoc) {
				return;
			}

			// Remove the section from the document
			updateDocSections(
				true, // Delete the section
				navDataRef,
				blockKey,
				docStructureRef,
				setDocStructure
			);
		};
	}, []);

	return <span className='wiki-section-title'>{children}</span>;
};

// Update or delete the section in the docStructure
const updateDocSections = (
	isDeletion,
	navDataRef,
	blockKey,
	docStructureRef,
	setDocStructure,
	setSynced,
	contentState,
	decoratedText = ''
) => {
	const { currentDoc, currentDocTab } = navDataRef.current;
	const docId = currentDoc ? Number(currentDoc.slice(3, -5)) : 0;
	let shouldUpdateDocStructure = true;

	// Find the children array that contains our document
	const filePath = findFilePath(docStructureRef.current[currentDocTab], '', 'doc', docId);
	if (typeof filePath !== 'string') {
		return;
	}

	const childrenPath = filePath + (filePath ? '/' : '') + 'children';
	let childrenArray = retrieveContentAtPropertyPath(
		childrenPath,
		docStructureRef.current[currentDocTab]
	);

	// Grab the individual document
	const docIndex = childrenArray.findIndex((item) => item.type === 'doc' && item.id === docId);
	const docObject = childrenArray[docIndex];

	let docSections = docObject.sections ? [...docObject.sections] : [];
	const newSectionObject = {
		key: blockKey,
		text: decoratedText,
	};

	const sectionIndex = docSections.findIndex((item) => item.key == blockKey);
	// If deleting, remove the section from the section array
	if (isDeletion) {
		docSections.splice(sectionIndex, 1);
	} else {
		// Either insert or update the wiki-section in the section array

		// Update the previous entry if it exists
		if (sectionIndex !== -1) {
			// Do not update the section if the text is the same
			if (docSections[sectionIndex].text === decoratedText) {
				shouldUpdateDocStructure = false;
			} else {
				docSections[sectionIndex] = {
					...docSections[sectionIndex],
					text: decoratedText,
				};
			}

			// If the array is empty, just push the new object onto it
		} else if (docSections.length === 0) {
			docSections.push(newSectionObject);

			// Insert the new object into the correct section order
		} else {
			let tempBlock = contentState.getBlockBefore(blockKey);
			let wikiSectionCount = 0;

			// Working backwards, count the wiki-sections before this one
			while (tempBlock) {
				if (tempBlock.getType() === 'wiki-section') {
					wikiSectionCount++;
				}
				let tempKey = tempBlock.getKey();
				tempBlock = contentState.getBlockBefore(tempKey);
			}

			// Insert the new object into the correct order in the array
			docSections.splice(wikiSectionCount, 0, newSectionObject);
		}
	}

	// Now that we've updated the array, update the docObject with that array
	const newDocObject = {
		...docObject,
		sections: docSections,
	};
	childrenArray[docIndex] = newDocObject;

	// Set the doc in the tab
	const docStructureTab = setObjPropertyAtPropertyPath(
		childrenPath,
		childrenArray,
		docStructureRef.current[currentDocTab]
	);

	// This prevents this useEffect from rerunning
	!isDeletion && setSynced(newSectionObject);

	const newDocStructure = {
		...docStructureRef.current,
		[currentDocTab]: docStructureTab,
	};

	// Update the doc structure with the new tab
	if (shouldUpdateDocStructure) {
		setDocStructure(newDocStructure);
		docStructureRef.current = newDocStructure;
	}
};
