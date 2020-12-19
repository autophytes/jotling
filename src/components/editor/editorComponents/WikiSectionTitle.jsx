import React, { useEffect, useState, useContext } from 'react';
import { EditorBlock, EditorState, Modifier, SelectionState } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';
// PROPS
// block: ContentBlock {_map: Map, __ownerID: undefined}
// blockProps: undefined
// blockStyleFn: block => {…}
// contentState: ContentState {_map: Map, __ownerID: undefined}
// customStyleFn: undefined
// customStyleMap: {BOLD: {…}, CODE: {…}, ITALIC: {…}, STRIKETHROUGH: {…}, UNDERLINE: {…}, …}
// decorator: CompositeDraftDecorator {_decorators: Array(2)}
// direction: "LTR"
// forceSelection: true
// offsetKey: "ah7m4-0-0"
// preventScroll: undefined
// selection: SelectionState {_map: Map, __ownerID: undefined}
// tree: List

// TO-DO
// Potentially convert to render like the LinkDestBlock
//  - Though maybe not. Only real benefit is quick access to block, right? We can monitor
//    the children for changes in the block, update accordingly.
// Should this be a title that you have to "edit" with an input-like form? Or just text?
// On load, ensure the title is in sync with the "sections" in the docStructure
// Ensure section titles are unique per document somehow

export const WikiSectionTitle = (props) => {
	// const [blockKey, setBlockKey] = useState(block.getKey());
	const { contentState, block } = props;

	const [isEditable, setIsEditable] = useState(false);
	const [title, setTitle] = useState('New Section');

	// console.log(props);

	const { docStructureRef, setDocStructure } = useContext(LeftNavContext);

	// If this title was just added, prompt for the name
	useEffect(() => {
		const blockData = block.getData().get('wikiSection', {});
		console.log('blockData:', blockData);
		if (blockData.isNew) {
			setIsEditable(true);
		}

		console.log('props.children changed!');
	}, []);

	useEffect(() => {
		// console.log('block text: ', block.getText());
	}, [block]);

	// // Load the blockKey
	// useEffect(() => {
	// 	console.log('dataOffsetKey changed');

	// 	setBlockKey((prev) => {
	// 		if (prev !== dataOffsetKey.slice(0, 5)) {
	// 			return dataOffsetKey.slice(0, 5);
	// 		} else {
	// 			return prev;
	// 		}
	// 	});
	// }, [dataOffsetKey]);

	return (
		<div className='wiki-section-title' onDragOver={null} onDrop={null}>
			<EditorBlock {...props} />
		</div>
	);
};

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
	console.log('blockKey:', blockKey);
	console.log('decoratedText:', decoratedText);
	const [synced, setSynced] = useState({ key: blockKey, text: decoratedText });
	console.log('synced:', synced);

	const {
		docStructureRef,
		setDocStructure,
		navDataRef,
		editorStateRef,
		setEditorStateRef,
	} = useContext(LeftNavContext);

	useEffect(() => {
		const block = contentState.getBlockForKey(blockKey);
		const blockData = block.getData();
		const wikiSectionData = blockData.get('wikiSection', { isNew: false });
		console.log('wikiSectionData:', wikiSectionData);

		if (decoratedText !== synced.text || blockKey !== synced.key || wikiSectionData.isNew) {
			const { currentDoc, currentDocTab } = navDataRef.current;
			const docId = currentDoc ? Number(currentDoc.slice(3, -5)) : 0;

			const filePath = findFilePath(docStructureRef.current[currentDocTab], '', 'doc', docId);
			const childrenPath = filePath + (filePath ? '/' : '') + 'children';
			console.log('filePath:', filePath);

			let childrenArray = retrieveContentAtPropertyPath(
				childrenPath,
				docStructureRef.current[currentDocTab]
			);
			console.log('childrenArray:', childrenArray);

			const docIndex = childrenArray.findIndex(
				(item) => item.type === 'doc' && item.id === docId
			);
			const docObject = childrenArray[docIndex];
			console.log('docObject:', docObject);

			let docSections = docObject.sections ? [...docObject.sections] : [];
			console.log('docSections:', docSections);
			const newSectionObject = {
				key: blockKey,
				text: decoratedText,
			};

			const sectionIndex = docSections.findIndex((item) => item.key == blockKey);
			console.log('sectionIndex:', sectionIndex);
			// Update the previous entry if it exists
			if (sectionIndex !== -1) {
				docSections[sectionIndex] = {
					...docSections[sectionIndex],
					text: decoratedText,
				};

				// If the array is empty, just push the new object onto it
			} else if (docSections.length === 0) {
				docSections.push(newSectionObject);
				console.log('docSections:', docSections);

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

			// Now that we've updated the array, update the docObject with that array
			const newDocObject = {
				...docObject,
				sections: docSections,
			};
			console.log('newDocObject:', newDocObject);

			childrenArray[docIndex] = newDocObject;

			// Set the doc in the tab
			const docStructureTab = setObjPropertyAtPropertyPath(
				childrenPath,
				childrenArray,
				docStructureRef.current[currentDocTab]
			);

			setSynced(newSectionObject);

			// Update the doc structure with the new tab
			setDocStructure({
				...docStructureRef.current,
				[currentDocTab]: docStructureTab,
			});

			// If it was NEW, update the block data
			if (wikiSectionData.isNew) {
				const newWikiSectionData = {
					...wikiSectionData,
					isNew: false,
				};

				const newBlockData = blockData.set('wikiSection', newWikiSectionData);
				// Select the end of the block
				const newSelectionState = SelectionState.createEmpty();
				const sectionSelectionState = newSelectionState.merge({
					anchorKey: blockKey, // Starting position
					anchorOffset: 0, // How much to adjust from the starting position
					focusKey: blockKey, // Ending position
					focusOffset: 0, // How much to adjust from the ending position.
				});

				const newContentState = Modifier.mergeBlockData(
					contentState,
					sectionSelectionState,
					newBlockData
				);
				const newEditorState = EditorState.push(
					editorStateRef.current,
					newContentState,
					'change-block-data'
				);

				setEditorStateRef.current(newEditorState);
			}
		}
	}, [decoratedText, blockKey, contentState]);

	return children;
};
