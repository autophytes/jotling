import { List, Repeat, Map } from 'immutable';
import {
	EditorState,
	SelectionState,
	ContentState,
	ContentBlock,
	genKey,
	CompositeDecorator,
	CharacterMetadata,
	Modifier,
	RichUtils,
} from 'draft-js';
import { setBlockData, getSelectedBlocksList } from 'draftjs-utils';
import {
	getAllBlockKeys,
	getBlockKeysForSelection,
	getTextSelection,
} from '../../utils/draftUtils';
import { stripOutEscapeCharacters } from '../../utils/utils';
import { findAllDocsInFolder } from '../navs/navFunctions';

import { LinkSourceDecorator, LinkDestDecorator } from './editorComponents/LinkDecorators';
import { HighlightTagDecorator } from './editorComponents/HighlightTagDecorator';
import { FindReplaceDecorator } from './editorComponents/FindReplaceDecorator';
import { BlockImageContainer } from './editorComponents/BlockImageContainer';
import { CompoundDecorator } from './editorComponents/CompoundDecorator';
import { WikiSectionDecorator } from './editorComponents/WikiSectionTitle';

function getEntityStrategy(type) {
	return function (contentBlock, callback, contentState) {
		contentBlock.findEntityRanges((character) => {
			const entityKey = character.getEntity();
			if (entityKey === null) {
				return false;
			}
			return contentState.getEntity(entityKey).getType() === type;
		}, callback);
	};
}

function getBlockStrategy(blockType) {
	return function (contentBlock, callback, contentState) {
		if (contentBlock.getType() === blockType) {
			callback(0, contentBlock.getLength());
		}
	};
}

function getBlockDataStrategy(blockDataProp) {
	return function (contentBlock, callback, contentState) {
		const blockData = contentBlock.getData();
		if (blockData.has(blockDataProp)) {
			callback(0, contentBlock.getLength());
		}
	};
}

const buildFindWithRegexFunction = (findTextArray, findRegisterRef, editorStateRef) => {
	console.log('findTextArray:', findTextArray);
	var regexMetachars = /[(){[*+?.\\^$|]/g;
	// Escape regex metacharacters in the text
	for (var i = 0; i < findTextArray.length; i++) {
		findTextArray[i] = findTextArray[i].replace(regexMetachars, '\\$&');
	}
	var regex = new RegExp('(?:' + findTextArray.join('|') + ')', 'gi');

	return function (contentBlock, callback, contentState) {
		// If we have a list of block keys, make sure this block is in it
		// if (visibleBlockKeys && !visibleBlockKeys.includes(contentBlock.getKey())) {
		// 	return;
		// }

		// Don't run on wiki-section blocks
		if (contentBlock.getType() === 'wiki-section') {
			return;
		}

		let text = contentBlock.getText();
		const blockKey = contentBlock.getKey();

		if (findRegisterRef) {
			removeBlockFromFindRegisterRef(findRegisterRef, blockKey, findTextArray[0]);
		}

		let matchArr, start;
		while ((matchArr = regex.exec(text)) !== null) {
			start = matchArr.index;

			// INSERT A FUNCTION that will register this as a match
			if (findRegisterRef) {
				updateFindRegisterRef(
					findRegisterRef,
					blockKey,
					start,
					findTextArray[0],
					editorStateRef
				);
			}

			callback(start, start + matchArr[0].length);
		}
	};
};

const findTagsToHighlight = (wikiStructure, currentDoc) => {
	// Compiling a list of all tags
	let tagList = [];

	for (let doc of findAllDocsInFolder(wikiStructure)) {
		if (doc.fileName !== currentDoc) {
			tagList.push(doc.name);
		}
	}

	return buildFindWithRegexFunction(tagList);
};

const findSearchKeyword = (findText, findRegisterRef, editorStateRef) => {
	return buildFindWithRegexFunction([findText], findRegisterRef, editorStateRef);
};

const defaultDecorator = [
	{
		strategy: getEntityStrategy('LINK-SOURCE'),
		component: LinkSourceDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
	},
	{
		strategy: getBlockDataStrategy('linkDestId'),
		component: LinkDestDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
	},
	{
		strategy: getEntityStrategy('IMAGE'),
		component: BlockImageContainer, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
	},
	{
		strategy: getBlockStrategy('wiki-section'),
		component: WikiSectionDecorator,
	},
];

export const generateDecorators = (
	docStructure,
	currentDoc,
	showAllTags,
	findText,
	findRegisterRef,
	editorStateRef
	// visibleBlockKeys
) => {
	let decoratorArray = [...defaultDecorator];

	if (showAllTags) {
		decoratorArray.push({
			strategy: findTagsToHighlight(docStructure.pages, currentDoc),
			component: HighlightTagDecorator,
		});
	}

	if (findText) {
		decoratorArray.push({
			strategy: findSearchKeyword(findText, findRegisterRef, editorStateRef),
			component: FindReplaceDecorator,
		});
	}

	return new CompoundDecorator(decoratorArray);
	// return new CompositeDecorator(decoratorArray);
};

export const defaultCompositeDecorator = new CompositeDecorator(defaultDecorator);

// NEW FUNCTION
// editorState, linkStructure, navData.currentDoc
// List all link entities in the document
// Pull all the tags from the link structure
// Pull all the links for each tag
// Check at all links exist in the document entities
// Add new entities for new links (include the link id and alias boolean)
// Update all content of link entities if source content updated (and no alias)
// Remove link entities that have been removed
//   If aliased, we will sever the link and leave it as orphaned instead.
//   If orphaned, remove that link and add a separate inline button notification of the severed link.

// UPDATE: if ##topOfPage, insert as first block. ##bottomOfPage is last block.
// Otherwise, insert after the block key in the initialSectionKey

export const updateLinkEntities = (editorState, linkStructure, currentDoc) => {
	let contentState = editorState.getCurrentContent();
	let blockArray = contentState.getBlocksAsArray();

	// Grab all used Link IDs
	let usedLinkIdArray = [];
	let nonAliasedLinks = {};

	// Looping through all blocks' entities to grab the Link IDs
	for (let block of blockArray) {
		// Get block data
		const blockData = block.getData();
		const linkId = blockData.get('linkDestId');

		// Skip this block if no linkDestId
		if (!linkId) {
			continue;
		}

		usedLinkIdArray.push(linkId);

		// If aliased, no need to synchronize
		if (linkStructure.links[linkId] && linkStructure.links[linkId].alias) {
			continue;
		}

		// Initialize the nonAliasedLinks
		if (!nonAliasedLinks.hasOwnProperty(linkId)) {
			nonAliasedLinks[linkId] = { blockList: [] };
		}

		const blockKey = block.getKey();
		// If first block for link, add the start info
		if (!nonAliasedLinks[linkId].hasOwnProperty('startBlockKey')) {
			nonAliasedLinks[linkId].startBlockKey = blockKey;
			nonAliasedLinks[linkId].startOffset = 0;
		}

		// Update the nonAliasedLink entry for each new block that contains the linkId
		nonAliasedLinks[linkId] = {
			...nonAliasedLinks[linkId],
			blockList: [...nonAliasedLinks[linkId].blockList, blockKey],
			endBlockKey: blockKey,
			endOffset: block.getLength(),
		};
	}

	// Grabbing all links that should be included on the page
	const docId = currentDoc.slice(3, -5);
	let linksToPage = linkStructure.tagLinks[docId] ? linkStructure.tagLinks[docId] : [];

	// Comparing the total with the used to find the unused links
	let unusedLinkIds = [];
	for (let linkId of linksToPage) {
		if (!usedLinkIdArray.includes(linkId)) {
			unusedLinkIds.push(linkId);
		}
	}

	// If we have unusedLinkIds, and currently the page just has an empty block, delete that block
	let newEditorState = editorState;
	if (unusedLinkIds.length && blockArray.length === 1) {
		const block = blockArray[0];
		if (block.getLength() === 0) {
			const selectionState = SelectionState.createEmpty();
			const newSelectionState = selectionState.merge({
				anchorKey: block.getKey(),
				anchorOffset: 0,
				focusKey: block.getKey(),
				focusOffset: 1,
			});

			let contentState = editorState.getCurrentContent();
			let newContentState = Modifier.removeRange(contentState, newSelectionState, 'forward');

			newEditorState = EditorState.push(newEditorState, newContentState, 'delete-character');
		}
	}

	// Inserting the unsused links
	for (const linkId of unusedLinkIds) {
		// New line characters break the content into multiple blocks.
		const linkContentArray = linkStructure.links[linkId].content.split('\n');
		let sectionKey = linkStructure.links[linkId].initialSectionKey;
		// const newSectionOptions = linkStructure.links[linkId].newSectionOptions;
		const blockKeys = [];

		let newContentState = newEditorState.getCurrentContent();
		let newBlockArray = newContentState.getBlocksAsArray();

		// If only 1 block in the array and that block is empty, remove it
		if (newBlockArray.length === 1 && newBlockArray[0].getLength() === 0) {
			newBlockArray.pop();
		}

		let blockIndex = newBlockArray.findIndex((item) => item.getKey() === sectionKey);
		let incrementBefore = true;
		if (sectionKey === '##topOfPage') {
			blockIndex = 0;
			incrementBefore = false;
		}

		// Create each block for a given link
		for (let content of linkContentArray) {
			const newBlockKey = genKey();
			blockKeys.push(newBlockKey);

			// Creating a new block with our link content
			const newBlock = new ContentBlock({
				key: newBlockKey,
				type: 'unstyled',
				text: content,
				characterList: List(Repeat(CharacterMetadata.create(), content.length)),
				data: Map({ linkDestId: linkId }),
			});

			// Insert the new link block into the correct section
			if (blockIndex !== -1) {
				// If we found a matching section block key, insert afterwards
				newBlockArray.splice(blockIndex + (incrementBefore ? 1 : 0), 0, newBlock);
				blockIndex++;
			} else {
				// Otherwise, push to the end of the page
				newBlockArray.push(newBlock);
			}
		}

		// Push the new content block into the editorState
		newEditorState = EditorState.push(
			newEditorState,
			ContentState.createFromBlockArray(newBlockArray),
			'split-block'
		);

		// NOTE: no longer needed, applying data directly to the block above
		// Apply the LINK-DEST entity to the new block
		// newEditorState = createTagDestLink(newEditorState, linkId, blockKeys);
	}

	let linkContentState = newEditorState.getCurrentContent();

	// Sychronize the existing links on the page (non-aliased)
	for (const linkId of Object.keys(nonAliasedLinks)) {
		let linkData = nonAliasedLinks[linkId];
		let structureContent = linkStructure.links[linkId]
			? linkStructure.links[linkId].content
			: '';

		// If removing the whole block, set the selection to the start of the next block
		// Otherwise we'll have a blank block remaining
		let anchorOffset = linkData.startOffset;
		let anchorKey = linkData.startBlockKey;
		if (structureContent === '') {
			const prevBlock = linkContentState.getBlockBefore(linkData.endBlockKey);
			if (prevBlock) {
				anchorKey = prevBlock.getKey();
				anchorOffset = prevBlock.getLength();
			}
		}

		const selectionState = SelectionState.createEmpty();
		const linkSelectionState = selectionState.merge({
			anchorKey: anchorKey,
			anchorOffset: anchorOffset,
			focusKey: linkData.endBlockKey,
			focusOffset: linkData.endOffset,
		});

		if (structureContent === '') {
			linkContentState = Modifier.removeRange(linkContentState, linkSelectionState, 'forward');

			// The rest of the code is only relevant if we aren't deleting the block.
			continue;
		}

		// Update the link text
		linkContentState = Modifier.replaceText(
			linkContentState,
			linkSelectionState,
			structureContent
		);

		const blockList = nonAliasedLinks[linkId].blockList;
		let blockKey = blockList[0];
		let block = linkContentState.getBlockForKey(blockKey);
		let blockText = block.getText();
		let newLineIndex = blockText.lastIndexOf('\n');

		while (newLineIndex !== -1) {
			const newLineSelectionState = selectionState.merge({
				anchorKey: blockKey,
				anchorOffset: newLineIndex,
				focusKey: blockKey,
				focusOffset: newLineIndex + 1,
			});

			linkContentState = Modifier.splitBlock(linkContentState, newLineSelectionState);

			block = linkContentState.getBlockForKey(blockKey);
			blockText = block.getText();
			newLineIndex = blockText.lastIndexOf('\n');
		}
	}

	// Push the new content block into the editorState
	newEditorState = EditorState.push(newEditorState, linkContentState, 'insert-characters');

	return newEditorState;
};

export const findVisibleBlocks = (editorRef) => {
	console.log('editorRef:', editorRef);
	const bottom = window.innerHeight;
	const blockElementList = editorRef.current.editor.children[0].children;

	let blockKeyList = [];
	// Iterate through each of our blocks
	for (let element of blockElementList) {
		let rect = element.getBoundingClientRect();
		// If the block is visible on screen
		if (rect.top < bottom - 20 && rect.bottom > 80) {
			// Extract the block key and add it to the list to return
			let offsetKey = element.dataset.offsetKey;
			let blockKey = offsetKey.slice(0, offsetKey.indexOf('-'));
			blockKeyList.push(blockKey);
		} else if (blockKeyList.length) {
			// If we had previous matches and are now off screen, return the list.
			// return blockKeyList;
			break;
		}
	}
	return blockKeyList;
};

export const scrollToBlock = (blockKey, element = document) => {
	let blockElement = element.querySelector(`[data-offset-key='${blockKey}-0-0'`);

	let blockRect = blockElement.getBoundingClientRect();

	window.scrollTo({
		left: 0,
		top: Math.floor(blockRect.top + window.pageYOffset - 200, 0),
		behavior: 'smooth',
	});
};

// Creating a new source tag link
export const createTagLink = (
	tagName,
	editorStateRef,
	linkStructureRef,
	currentDoc,
	setEditorState,
	setLinkStructure,
	setSyncLinkIdList,
	initialSectionKey
) => {
	// Clear out any existing links in the selection
	const cleanedEditorState = removeLinkSourceFromSelection(
		editorStateRef.current,
		linkStructureRef.current,
		setLinkStructure,
		setSyncLinkIdList
	);

	// Increment the max id by 1, or start at 0
	let arrayOfLinkIds = Object.keys(linkStructureRef.current.links).map((item) => Number(item));
	let newLinkId = arrayOfLinkIds.length ? Math.max(...arrayOfLinkIds) + 1 : 1;

	const contentState = cleanedEditorState.getCurrentContent();
	const selectionState = cleanedEditorState.getSelection();

	// Apply the linkId as an entity to the selection
	const contentStateWithEntity = contentState.createEntity('LINK-SOURCE', 'MUTABLE', {
		linkId: newLinkId,
	});
	const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
	const contentStateWithLink = Modifier.applyEntity(
		contentStateWithEntity,
		selectionState,
		entityKey
	);
	const newEditorState = EditorState.push(
		cleanedEditorState,
		contentStateWithLink,
		'apply-entity'
	);

	// Get the selected text to include in the link
	const selectedText = getTextSelection(contentStateWithLink, selectionState);

	// Updating the linkStructure with the new link
	let newLinkStructure = JSON.parse(JSON.stringify(linkStructureRef.current));

	// Ensure the page tag links exist
	if (!newLinkStructure.tagLinks[tagName]) {
		newLinkStructure.tagLinks[tagName] = [];
	}

	newLinkStructure.tagLinks[tagName].push(newLinkId); // FIX EVENTUALLY
	newLinkStructure.links[newLinkId] = {
		source: currentDoc, // Source document
		content: selectedText, // Selected text
		alias: null,
		sourceEntityKey: entityKey,
		initialSectionKey: initialSectionKey, // Section to insert the link into
	};

	// Updating the linkStructure with the keyword the link is using
	if (!newLinkStructure.docLinks.hasOwnProperty(currentDoc)) {
		newLinkStructure.docLinks[currentDoc] = {};
	}
	newLinkStructure.docLinks[currentDoc][newLinkId] = tagName; // FIX EVENTUALLY

	setLinkStructure(newLinkStructure);
	setEditorState(newEditorState);
};

// Insert an image into a document
export const insertImageBlockData = (imageId, imageUseId, editorState, setEditorState) => {
	let contentState = editorState.getCurrentContent();
	const selectionState = editorState.getSelection();
	let blockKey = selectionState.getStartKey();
	let block = contentState.getBlockForKey(blockKey);

	// Add the image to the block metadata
	const blockData = block.getData();
	let blockImageArray = [...blockData.get('images', [])];
	blockImageArray.push({
		imageId,
		imageUseId,
	});
	const newBlockData = blockData.set('images', blockImageArray);

	// Select the end of the block
	const newSelectionState = SelectionState.createEmpty();
	const blockEndSelectionState = newSelectionState.merge({
		anchorKey: blockKey, // Starting position
		anchorOffset: 0, // How much to adjust from the starting position
		focusKey: blockKey, // Ending position
		focusOffset: 0, // How much to adjust from the ending position.
	});

	// Insert the character with the image entity at the end of the block
	const contentStateWithImage = Modifier.setBlockData(
		contentState,
		blockEndSelectionState,
		newBlockData
	);

	const newEditorState = EditorState.push(
		editorState,
		contentStateWithImage,
		'change-block-data'
	);
	setEditorState(newEditorState);
};

// Update the metadata of an image in a block
export const updateImageBlockData = (
	imageId,
	imageUseId,
	editorState,
	setEditorState,
	blockKey,
	imageData
) => {
	const contentState = editorState.getCurrentContent();

	// Get the block image metadata
	const block = contentState.getBlockForKey(blockKey);
	const blockData = block.getData();
	let blockImageArray = [...blockData.get('images', [])];

	// Update the image data in the block
	let imageIndex = blockImageArray.findIndex(
		(item) => imageId === item.imageId && imageUseId == item.imageUseId
	);
	blockImageArray.splice(imageIndex, 1, imageData);
	const newBlockData = blockData.set('images', blockImageArray);

	// Select the end(beginning?) of the block
	const newSelectionState = SelectionState.createEmpty();
	const selectionState = newSelectionState.merge({
		anchorKey: blockKey, // Starting position
		anchorOffset: 0, // How much to adjust from the starting position
		focusKey: blockKey, // Ending position
		focusOffset: 0, // How much to adjust from the ending position.
	});

	// Insert the character with the image entity at the end of the block
	const contentStateWithImage = Modifier.setBlockData(
		contentState,
		selectionState,
		newBlockData
	);

	const newEditorState = EditorState.push(
		editorState,
		contentStateWithImage,
		'change-block-data'
	);
	setEditorState(newEditorState);
};

// Update the find match in the find register array
const updateFindRegisterRef = (
	findRegisterRef,
	blockKey,
	start,
	origFindText,
	editorStateRef
) => {
	let findText = stripOutEscapeCharacters(origFindText);

	const origRegisterArray = findRegisterRef.current[findText.toLowerCase()];
	let registerArray = [...(origRegisterArray ? origRegisterArray : [])];
	const updatedMatch = { blockKey, start };

	let matchIndex = registerArray.findIndex(
		(item) => item.blockKey === blockKey && item.start === start
	);
	if (matchIndex !== -1) {
		return;
	}

	let blockMap = editorStateRef.current.getCurrentContent().getBlockMap();
	let blockKeyOrder = [...blockMap.keys()];

	let matchingBlockKeyIndex = registerArray.findIndex((item) => item.blockKey === blockKey);
	// If we found a block with a MATCHING BLOCK KEY
	if (matchingBlockKeyIndex !== -1) {
		// If that block is AFTER ours, insert it before
		if (registerArray[matchingBlockKeyIndex].start > start) {
			// Insert our updatedMatch
			registerArray.splice(matchingBlockKeyIndex, 0, updatedMatch);
		} else {
			// Otherwise, check blocks after until find a new blockKey OR the start is after ours
			let foundMatch = false;
			while (!foundMatch && matchingBlockKeyIndex <= registerArray.length - 1) {
				// If find a new blockKey OR the start is after ours
				if (
					registerArray[matchingBlockKeyIndex].blockKey !== blockKey ||
					registerArray[matchingBlockKeyIndex].start > start
				) {
					// Insert our updatedMatch
					registerArray.splice(matchingBlockKeyIndex, 0, updatedMatch);
					foundMatch = true;
				} else {
					matchingBlockKeyIndex += 1;
				}
			}
			// If we hit the end of the array, just push it onto the end
			if (!foundMatch) {
				registerArray.push(updatedMatch);
			}
		}
		// If we found NO MATCHING BLOCK KEY
	} else {
		// Find where the next block is in the block order
		let blockKeyIndex = blockKeyOrder.findIndex((item) => item === blockKey) + 1;
		if (blockKeyIndex === 0) {
			console.log('Our block key was NOT found in the blockKeyOrder array.');
			return;
		}

		// Check if that next block has a match. If so, inject our updatedMatch before it.
		let foundMatch = false;
		while (!foundMatch && blockKeyIndex <= blockKeyOrder.length - 1) {
			let nextBlockIndex = registerArray.findIndex(
				(item) => item.blockKey === blockKeyOrder[blockKeyIndex]
			);
			if (nextBlockIndex !== -1) {
				registerArray.splice(nextBlockIndex, 0, updatedMatch);
				foundMatch = true;
			}
			blockKeyIndex += 1;
		}

		if (!foundMatch) {
			registerArray.push(updatedMatch);
		}
	}

	findRegisterRef.current[findText.toLowerCase()] = [...registerArray];
};

const removeBlockFromFindRegisterRef = (findRegisterRef, blockKey, origFindText) => {
	// Clean out the \'s from the regex
	let findText = stripOutEscapeCharacters(origFindText);

	const origRegisterArray = findRegisterRef.current[findText.toLowerCase()];
	let registerArray = [...(origRegisterArray ? origRegisterArray : [])];

	// Remove all elements in the array for a given blockKey
	const updateRemoveIndex = () =>
		registerArray.findIndex((item) => item.blockKey === blockKey);

	let removeIndex = updateRemoveIndex();

	if (removeIndex !== -1) {
		while (removeIndex !== -1) {
			registerArray.splice(removeIndex, 1);
			removeIndex = updateRemoveIndex();
		}

		findRegisterRef.current[findText.toLowerCase()] = [...registerArray];
	}
};

export const insertTextWithEntity = (editorState, content, selection, block, text) => {
	const style = editorState.getCurrentInlineStyle();
	const entity = block.getEntityAt(selection.getStartOffset());

	const newContent = Modifier.insertText(content, selection, text, style, entity);

	return EditorState.push(editorState, newContent, 'insert-characters');
};

// Remove all links in a given editor selection, and update the linkStructure
export const removeLinkSourceFromSelection = (
	editorState,
	linkStructure,
	setLinkStructure,
	setSyncLinkIdList
) => {
	const contentState = editorState.getCurrentContent();
	const selectionState = editorState.getSelection();

	const linkData = grabSelectionLinkIdsAndContent(editorState);
	const linkIds = [...Object.keys(linkData)];
	let resyncLinkIds = [];

	let shouldResyncLinkStructure = false;
	let newLinkStructure = JSON.parse(JSON.stringify(linkStructure));

	for (let id of linkIds) {
		let content = linkStructure.links[id].content;
		if (linkData[id] === content) {
			// Delete all entries for the link from the linkStructure
			let source = linkStructure.links[id].source;
			let keyword = linkStructure.docLinks[source][id];

			delete newLinkStructure.links[id];
			delete newLinkStructure.docLinks[source][id];

			let newTagLinksArray = [...newLinkStructure.tagLinks[keyword]];
			let idIndex = newTagLinksArray.findIndex((item) => item === Number(id));
			newTagLinksArray.splice(idIndex, 1);
			newLinkStructure.tagLinks[keyword] = newTagLinksArray;

			shouldResyncLinkStructure = true;
		} else {
			// Push the id into the queue to resynchronize that link
			resyncLinkIds.push(id);
		}
	}

	// DONE
	// Find what linkId(s) we're removing from the selection
	// For each link, determine if we are removing the entire link or only part
	//    - We'll need to save the text from the link ranges to compare
	// If we're removing everything, remove the link from the linkStructure (links, docLinks, tagLinks)
	// Then set the syncLinkIdList to our partial links we need to remove

	// DONE NOTE: if just removing a segment inside a link... the link should really be split
	//   Maybe don't let people remove the middle of a link??

	// In our LINK-DEST pages, if a link is completely removed, we need to remove the links from that page as well

	// If we ever add any other entities and we only wnat to remove the LINK-SOURCE, this will be a problem
	const newContentState = Modifier.applyEntity(contentState, selectionState, null);
	const newEditorState = EditorState.push(editorState, newContentState, 'apply-entity');

	// I wonder if this will trigger too early, before the editor state has updated.
	// If so, return the list and set it after we set the state.
	if (resyncLinkIds.length) {
		setSyncLinkIdList(resyncLinkIds);
	}

	if (shouldResyncLinkStructure) {
		setLinkStructure(newLinkStructure);
	}

	return newEditorState;
};

// Returns an object of { [linkId]: linkText } for all LINK-SOURCE in a selectionState
const grabSelectionLinkIdsAndContent = (editorState) => {
	const contentState = editorState.getCurrentContent();
	const selection = editorState.getSelection();
	const startBlockKey = selection.getStartKey();
	const startOffset = selection.getStartOffset();
	const endBlockKey = selection.getEndKey();
	const endOffset = selection.getEndOffset();

	let linkData = {};

	let block = contentState.getBlockForKey(startBlockKey);
	let finished = false;
	while (!finished) {
		const currentBlockKey = block.getKey();

		// FIND ENTITY RANGES
		block.findEntityRanges(
			(char) => {
				const entityKey = char.getEntity();
				if (!entityKey) {
					return false;
				}

				const entity = contentState.getEntity(entityKey);
				return entity.getType() === 'LINK-SOURCE';
			},
			(start, end) => {
				let adjStart = start;
				let adjEnd = end;
				let skip = false;

				// Starting block - Only use the portion of the link inside our selection
				if (currentBlockKey === startBlockKey) {
					if (adjEnd < startOffset) {
						skip = true;
					}
					adjStart = Math.max(startOffset, adjStart);
				}

				// Ending block - Only use the portion of the link inside our selection
				if (currentBlockKey === endBlockKey) {
					if (adjStart > endOffset) {
						skip = true;
					}
					adjEnd = Math.min(endOffset, adjEnd);
				}

				if (!skip) {
					// Find the linkId
					const entityKey = block.getEntityAt(adjStart);
					const entity = contentState.getEntity(entityKey);
					const entityData = entity.getData();
					const linkId = entityData.linkId;

					// Find the linkText
					const allText = block.getText();
					const linkText = allText.slice(adjStart, adjEnd);

					if (linkId !== undefined) {
						if (linkData.hasOwnProperty(linkId)) {
							linkData[linkId] = linkData[linkId] + '\n' + linkText;
						} else {
							linkData[linkId] = linkText;
						}
					}
				}

				// if starting block && ending block

				// if starting block
				// if end is before start offset, ignore the link
				//  otherwise, take the greater of the start offset or the start

				// if ending block
				// if start is after end offset, ignore the link
				//  otherwise, take the lesser of the ending offset or the end
			}
		);

		if (currentBlockKey === endBlockKey) {
			finished = true;
		}

		block = contentState.getBlockAfter(currentBlockKey);
	}

	return linkData;
};

// Checks if the selected text has a given entity type
export const selectionHasEntityType = (editorState, entityType) => {
	const currentContent = editorState.getCurrentContent();
	const selection = editorState.getSelection();
	const startBlockKey = selection.getStartKey();
	const startOffset = selection.getStartOffset();
	const endBlockKey = selection.getEndKey();
	const endOffset = selection.getEndOffset();

	let block = currentContent.getBlockForKey(startBlockKey);
	let finished = false;
	while (!finished) {
		const currentBlockKey = block.getKey();
		const length = currentBlockKey === endBlockKey ? endOffset : block.getLength();
		let i = currentBlockKey === startBlockKey ? startOffset : 0;
		for (i; i < length; i++) {
			let entityKey = block.getEntityAt(i);
			if (entityKey) {
				let entity = currentContent.getEntity(entityKey);
				if (entity.get('type') === entityType) {
					// WE FOUND OUR MATCH, DO THE THING
					return true;
				}
			}
		}

		if (currentBlockKey === endBlockKey) {
			finished = true;
		}

		block = currentContent.getBlockAfter(currentBlockKey);
	}

	return false;
};

// Checks if selection is inside a LINK-SOURCE
export const selectionInMiddleOfLink = (editorState) => {
	const currentContent = editorState.getCurrentContent();
	const selection = editorState.getSelection();
	const startBlockKey = selection.getStartKey();
	const startOffset = selection.getStartOffset();
	const endBlockKey = selection.getEndKey();
	const endOffset = selection.getEndOffset();

	let startBlock =
		startOffset === 0
			? currentContent.getBlockBefore(startBlockKey)
			: currentContent.getBlockForKey(startBlockKey);

	let endBlock = currentContent.getBlockForKey(endBlockKey);
	let isSelectionAtBlockEnd = endBlock.getLength() <= endOffset; // >= ?
	if (isSelectionAtBlockEnd) {
		endBlock = currentContent.getBlockAfter(endBlockKey);
	}

	// If at the start/end of the document, can't be in the middle of a link.
	if (!endBlock || !startBlock) {
		return false;
	}

	let startEntityKey = startBlock.getEntityAt(
		startOffset === 0 ? startBlock.getLength() - 1 : startOffset - 1
	);
	let endEntityKey = endBlock.getEntityAt(isSelectionAtBlockEnd ? 0 : endOffset);

	if (startEntityKey && startEntityKey === endEntityKey) {
		let entity = currentContent.getEntity(startEntityKey);

		if (entity.getType() === 'LINK-SOURCE') {
			return true;
		}
	}

	return false;
};

// Returns true if a selected block matches the block type
export const selectionContainsBlockType = (editorState, blockType) => {
	const selectedBlocks = getSelectedBlocksList(editorState);
	if (selectedBlocks.size > 0) {
		// Loop through each block
		for (let i = 0; i < selectedBlocks.size; i += 1) {
			if (selectedBlocks.get(i).getType() === blockType) {
				return true;
			}
		}
	}
	return false;
};

// Insert a new section title into a Wiki page
export const insertNewSectionInOpenDoc = (editorState, setEditorState) => {
	const contentState = editorState.getCurrentContent();
	const selectionState = editorState.getSelection();
	const startBlockKey = selectionState.getStartKey();
	const startBlock = contentState.getBlockForKey(startBlockKey);
	let insertBefore = true;
	let useCurrentBlock = selectionState.isCollapsed() && startBlock.getLength() === 0;

	// Check if we need to insert the section AFTER the current block
	if (selectionState.isCollapsed()) {
		const start = selectionState.getStartOffset();

		if (start === startBlock.getLength()) {
			insertBefore = false;
		}
	}

	// If an empty block is selected, convert that block instead
	let sectionBlockKey, contentWithSection;

	// If we're USING THE SELECTED block as a wiki-section
	if (useCurrentBlock) {
		sectionBlockKey = startBlockKey;
		contentWithSection = contentState;
	}

	// If instead we're INSERTING a new block BEFORE to use as a wiki-section
	if (insertBefore && !useCurrentBlock) {
		// Select the start of the block
		const emptySelectionState = SelectionState.createEmpty();
		const beginningSelectionState = emptySelectionState.merge({
			anchorKey: startBlockKey,
			anchorOffset: 0,
			focusKey: startBlockKey,
			focusOffset: 0,
		});

		// The new section block will have kept the old block key
		const splitContentState = Modifier.splitBlock(contentState, beginningSelectionState);
		sectionBlockKey = startBlockKey;

		// Migrate data from the old block the new block below it
		const origBlockData = splitContentState.getBlockForKey(sectionBlockKey).getData();
		const origBlockKey = splitContentState.getBlockAfter(sectionBlockKey).getKey();
		const origBlockSelectionState = emptySelectionState.merge({
			anchorKey: origBlockKey,
			anchorOffset: 0,
			focusKey: origBlockKey,
			focusOffset: 0,
		});
		contentWithSection = Modifier.setBlockData(
			splitContentState,
			origBlockSelectionState,
			origBlockData
		);
	}

	// If instead we're INSERTING a new block AFTER to use as a wiki-section
	if (!insertBefore && !useCurrentBlock) {
		contentWithSection = Modifier.splitBlock(contentState, selectionState);
		sectionBlockKey = contentWithSection.getKeyAfter(startBlockKey);
	}

	// Change the new block type to wiki-section
	const emptySelectionState = SelectionState.createEmpty();
	const sectionSelectionState = emptySelectionState.merge({
		anchorKey: sectionBlockKey,
		anchorOffset: 0,
		focusKey: sectionBlockKey,
		focusOffset: 0,
	});

	// Create and set new block data saying the block is new
	// const newBlockData = new Map({
	// 	wikiSection: {
	// 		isNew: true,
	// 	},
	// });
	// const contentWithBlockData = Modifier.setBlockData(
	// 	contentWithSection,
	// 	sectionSelectionState,
	// 	newBlockData
	// );

	// Changing the block type
	const contentWithBlockType = Modifier.setBlockType(
		contentWithSection,
		sectionSelectionState,
		'wiki-section'
	);

	// Adds default text
	const defaultText = 'Section Title';
	const contentWithDefaultText = Modifier.insertText(
		contentWithBlockType,
		sectionSelectionState,
		defaultText
	);

	// Push the new block onto the editorState
	const newEditorState = EditorState.push(editorState, contentWithDefaultText, 'split-block');

	// Select the text in the new section title
	const finalSelectionState = emptySelectionState.merge({
		anchorKey: sectionBlockKey,
		anchorOffset: 0,
		focusKey: sectionBlockKey,
		focusOffset: defaultText.length,
		hasFocus: true,
	});

	const finalEditorState = EditorState.forceSelection(newEditorState, finalSelectionState);
	setEditorState(finalEditorState);
};

// IDEA: We could possibly batch the updates and always update the whole doc after a 1sec delay

export const replaceSingleFindMatch = (
	findText,
	replaceText,
	blockKey,
	start,
	editorState
) => {
	const contentState = editorState.getCurrentContent();
	const contentBlock = contentState.getBlockForKey(blockKey);
	const entityKey = contentBlock.getEntityAt(start);

	// Find content block with block key
	// Find the entity at the start index
	// On content state, get the entity for the entity key
	// Somehow apply this entity to the new selection

	// Lets grab the initial selection state and reset it when we're done
	const emptySelectionState = SelectionState.createEmpty();
	const selectionState = emptySelectionState.merge({
		anchorKey: blockKey, // Starting block (position is the start)
		anchorOffset: start, // How much to adjust from the starting position
		focusKey: blockKey, // Ending position (position is the start)
		focusOffset: start + findText.length,
	});

	const newContentState = Modifier.replaceText(contentState, selectionState, replaceText);

	// If we have an entity, apply that entity to the new text
	let contentStateWithLink;
	if (entityKey !== null) {
		const selectionStateForEntity = emptySelectionState.merge({
			anchorKey: blockKey,
			anchorOffset: start,
			focusKey: blockKey,
			focusOffset: start + replaceText.length,
		});

		contentStateWithLink = Modifier.applyEntity(
			newContentState,
			selectionStateForEntity,
			entityKey
		);
	}

	const newEditorState = EditorState.push(
		editorState,
		contentStateWithLink ? contentStateWithLink : newContentState,
		'insert-characters'
	);

	return newEditorState;
};
