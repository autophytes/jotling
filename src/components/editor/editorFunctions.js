import { List, Repeat } from 'immutable';
import {
	EditorState,
	SelectionState,
	ContentState,
	ContentBlock,
	genKey,
	CompositeDecorator,
	CharacterMetadata,
	Modifier,
} from 'draft-js';

import { LinkSourceDecorator, LinkDestDecorator } from './decorators/LinkDecorators';
import { HighlightTagDecorator } from './decorators/HighlightTagDecorator';
import { FindReplaceDecorator } from './decorators/FindReplaceDecorator';

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

// function hashtagStrategy(contentBlock, callback, contentState) {
// 	findWithRegex(HASHTAG_REGEX, contentBlock, callback);
// }

// function findWithRegex(regex, contentBlock, callback) {
// 	const text = contentBlock.getText();
// 	let matchArr, start;
// 	while ((matchArr = regex.exec(text)) !== null) {
// 		start = matchArr.index;
// 		callback(start, start + matchArr[0].length);
// 	}
// }

const buildFindWithRegexFunction = (findTextArray, visibleBlockKeys) => {
	var regexMetachars = /[(){[*+?.\\^$|]/g;
	// Escape regex metacharacters in the tags
	for (var i = 0; i < findTextArray.length; i++) {
		findTextArray[i] = findTextArray[i].replace(regexMetachars, '\\$&');
	}
	var regex = new RegExp('(?:' + findTextArray.join('|') + ')', 'gi');

	return function (contentBlock, callback, contentState) {
		// If we have a list of block keys, make sure this block is in it
		if (visibleBlockKeys && !visibleBlockKeys.includes(contentBlock.getKey())) {
			return;
		}

		const text = contentBlock.getText();
		let matchArr, start;
		while ((matchArr = regex.exec(text)) !== null) {
			start = matchArr.index;
			callback(start, start + matchArr[0].length);
		}
	};
};

const findTagsToHighlight = (linkStructure, currentDoc) => {
	// Compiling a list of all tags
	let tagList = [];
	for (let docName of Object.keys(linkStructure.docTags)) {
		if (docName !== currentDoc) {
			tagList = [...tagList, ...linkStructure.docTags[docName]];
		}
	}

	return buildFindWithRegexFunction(tagList);
};

const findSearchKeyword = (findText, visibleBlockKeys) => {
	return buildFindWithRegexFunction([findText], visibleBlockKeys);
};

export const generateDecorators = (
	linkStructure,
	currentDoc,
	showAllTags,
	findText,
	visibleBlockKeys
) => {
	let decoratorArray = [
		{
			strategy: getEntityStrategy('LINK-SOURCE'),
			component: LinkSourceDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
		},
		{
			strategy: getEntityStrategy('LINK-DEST'),
			component: LinkDestDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
		},
	];

	if (showAllTags) {
		decoratorArray.push({
			strategy: findTagsToHighlight(linkStructure, currentDoc),
			component: HighlightTagDecorator,
		});
	}
	console.log('find text inside the decorator: ', findText);
	if (findText) {
		decoratorArray.push({
			strategy: findSearchKeyword(findText, visibleBlockKeys),
			component: FindReplaceDecorator,
		});
	}
	// console.log('inside our decorator generating function');
	return new CompositeDecorator(decoratorArray);
};

export const defaultDecorator = new CompositeDecorator([
	{
		strategy: getEntityStrategy('LINK-SOURCE'),
		component: LinkSourceDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
	},
	{
		strategy: getEntityStrategy('LINK-DEST'),
		component: LinkDestDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
	},
]);

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

export const updateLinkEntities = (editorState, linkStructure, currentDoc) => {
	let contentState = editorState.getCurrentContent();
	let blockArray = contentState.getBlocksAsArray();

	// Grab all used Link IDs
	let usedLinkIdArray = [];
	let nonAliasedEntities = {};
	for (let block of blockArray) {
		// Looping through all blocks' entities to grab the Link IDs
		block.findEntityRanges(
			(value) => {
				let entityKey = value.getEntity();
				if (!entityKey) {
					return false;
				}

				let entity = contentState.getEntity(entityKey);
				if (entity.getType() === 'LINK-DEST') {
					usedLinkIdArray.push(entity.data.linkId);
					// Only call the second function for links that are not aliased (which we need to synchronize)
					if (linkStructure.links[entity.data.linkId].alias) {
						return false;
					}
					return true;
				}

				return false;
			},
			(start, end) => {
				let blockKey = block.getKey();
				let entityKey = block.getEntityAt(start);
				let entity = contentState.getEntity(entityKey);
				let linkId = entity.data.linkId;

				if (!nonAliasedEntities.hasOwnProperty(entityKey)) {
					nonAliasedEntities[entityKey] = { blockList: [] };
				}
				if (!nonAliasedEntities[entityKey].hasOwnProperty('startBlockKey')) {
					nonAliasedEntities[entityKey].startBlockKey = blockKey;
					nonAliasedEntities[entityKey].startOffset = start;
				}

				nonAliasedEntities[entityKey] = {
					...nonAliasedEntities[entityKey],
					linkId,
					blockList: [...nonAliasedEntities[entityKey].blockList, blockKey],
					endBlockKey: blockKey,
					endOffset: end,
				};
			}
		);
	}

	// Grabbing all links that should be included on the page
	const tagList = linkStructure.docTags[currentDoc] ? linkStructure.docTags[currentDoc] : [];
	let allLinkIdArray = [];
	for (let tag of tagList) {
		allLinkIdArray.push(linkStructure.tagLinks[tag]);
	}

	// Comparing the total with the used to find the unused links
	let unusedLinkIds = [];
	for (let linkId of allLinkIdArray.flat()) {
		if (!usedLinkIdArray.includes(linkId)) {
			unusedLinkIds = [...unusedLinkIds, linkId];
		}
	}

	let newEditorState = editorState;
	// Inserting the unsused links at the bottom of the page
	for (let linkId of unusedLinkIds) {
		// If we have a new line character inside our content, we need to break it up into
		// multiple blocks.

		const linkContentArray = linkStructure.links[linkId].content.split('\n');
		const blockKeys = [];

		for (let content of linkContentArray) {
			let newContentState = newEditorState.getCurrentContent();
			const newBlockKey = genKey();
			blockKeys.push(newBlockKey);

			// Creating a new block with our link content
			const newBlock = new ContentBlock({
				key: newBlockKey,
				type: 'unstyled',
				text: content,
				characterList: List(Repeat(CharacterMetadata.create(), content.length)),
			});

			const newBlockMap = newContentState.getBlockMap().set(newBlockKey, newBlock);

			// Push the new content block into the editorState
			newEditorState = EditorState.push(
				newEditorState,
				ContentState.createFromBlockArray(newBlockMap.toArray()),
				'split-block'
			);

			// TO-DO
			// This createTagDestLink needs to be outside the loop, and it needs to be selecting from the
			//   start of the first block (and offset) to the ending offset of the final block.
			//   This is the only place this function is used, so we can customize it.
		}

		// Apply the LINK-DEST entity to the new block
		newEditorState = createTagDestLink(newEditorState, linkId, blockKeys);
	}

	// filter usedLinkIds down to a list of non-aliased links
	// loop through the non-aliased link ids
	//    grab the linkStructure content for each
	//    grab the editorState content
	//    compare the two. If different, set the editorState content to linkStructure content

	let linkContentState = newEditorState.getCurrentContent();

	for (let entityKey of Object.keys(nonAliasedEntities)) {
		console.log('updating for entityKey: ', entityKey);
		let linkData = nonAliasedEntities[entityKey];
		let structureContent = linkStructure.links[linkData.linkId].content;

		const selectionState = SelectionState.createEmpty();
		const linkSelectionState = selectionState.merge({
			anchorKey: linkData.startBlockKey,
			anchorOffset: linkData.startOffset,
			focusKey: linkData.endBlockKey,
			focusOffset: linkData.endOffset,
		});

		linkContentState = Modifier.replaceText(
			linkContentState,
			linkSelectionState,
			structureContent,
			null,
			entityKey
		);

		const blockList = nonAliasedEntities[entityKey].blockList;
		console.log('blockList: ', blockList);
		// for (let blockKey of blockList) {
		let blockKey = blockList[0];
		console.log(linkContentState.getBlocksAsArray());
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
			console.log(linkContentState.getBlocksAsArray());

			block = linkContentState.getBlockForKey(blockKey);
			blockText = block.getText();
			console.log('blockText: ', blockText);
			newLineIndex = blockText.lastIndexOf('\n');
		}
		// }
	}

	// Push the new content block into the editorState
	newEditorState = EditorState.push(newEditorState, linkContentState, 'insert-characters');

	// X. Pull the relevant tags from docTags
	// X. Pull all the link ids to those tags from tagLinks
	// X. Compare that to our linkIdArray
	// X. Insert any links that aren't already in the page
	//   x. insert our entity for the link
	//     https://jsfiddle.net/levsha/2op5cyxm/ - create block and add link
	//   a. Insert before the last empty block our content from the link and the new entity
	// 5. NEXT  -  Update any links where there is no alias in the linkStructure and the content doesn't match
	//       TO-DO - see the notes on line 145. Need to add the entity to the entire selection, not each block individually.
	// 6. Eventually, any changes we make to content with entities, we need to sync back to linkStructure

	// block.getData() might give us a map with the metadata we need
	// There's the possibility we may have a duplicate issue eventually. If so, use Map to remove duplicates.

	return newEditorState;
};

// Creating a new destination tag link
const createTagDestLink = (editorState, linkId, blockKeys) => {
	const selectionState = editorState.getSelection();
	const contentState = editorState.getCurrentContent();
	const endingBlock = contentState.getBlockForKey(blockKeys[blockKeys.length - 1]);

	// Store these to restore the selection at the end
	const anchorKey = selectionState.getAnchorKey();
	const anchorOffset = selectionState.getAnchorOffset();
	const focusKey = selectionState.getFocusKey();
	const focusOffset = selectionState.getFocusOffset();

	// Selecting the text to apply the entity(link) to
	const selectionStateForEntity = selectionState.merge({
		anchorKey: blockKeys[0], // Starting position
		anchorOffset: 0, // How much to adjust from the starting position
		focusKey: blockKeys[blockKeys.length - 1], // Ending position
		focusOffset: endingBlock.getText().length, // How much to adjust from the ending position.
	});

	// Apply the linkId as an entity to the selection
	const contentStateWithEntity = contentState.createEntity('LINK-DEST', 'MUTABLE', {
		linkId: linkId,
	});
	const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
	const contentStateWithLink = Modifier.applyEntity(
		contentStateWithEntity,
		selectionStateForEntity,
		entityKey
	);

	// Restoring the selection to the original selection
	const restoredSelectionState = selectionState.merge({
		anchorKey: anchorKey, // Starting block (position is the start)
		anchorOffset: anchorOffset, // How much to adjust from the starting position
		focusKey: focusKey, // Ending position (position is the start)
		focusOffset: focusOffset, // We added the space, so add 1 to this.
	});
	const reselectedEditorState = EditorState.forceSelection(
		editorState,
		restoredSelectionState
	);

	const newEditorState = EditorState.push(
		reselectedEditorState,
		contentStateWithLink,
		'apply-entity'
	);

	return newEditorState;
};

export const findVisibleBlocks = (editorRef) => {
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
