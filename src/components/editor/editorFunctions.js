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

export const decorator = new CompositeDecorator([
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
	let nonAliasedEntities = {
		// enitityKey: {
		//   linkId,
		//   startBlockKey,
		//   startOffset,
		//   endBlockKey,
		//   endOffset
		// }
	};
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
					nonAliasedEntities[entityKey] = {};
				}
				if (!nonAliasedEntities[entityKey].hasOwnProperty('startBlockKey')) {
					nonAliasedEntities[entityKey].startBlockKey = blockKey;
					nonAliasedEntities[entityKey].startOffset = start;
				}

				nonAliasedEntities[entityKey] = {
					...nonAliasedEntities[entityKey],
					linkId,
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
		let newContentState = newEditorState.getCurrentContent();

		// If we have a new line character inside our content, we need to break it up into
		// multiple blocks.

		// Creating a new block with our link content
		const newBlock = new ContentBlock({
			key: genKey(),
			type: 'unstyled',
			text: linkStructure.links[linkId].content,
			characterList: List(
				Repeat(CharacterMetadata.create(), linkStructure.links[linkId].content.length)
			),
		});

		const newBlockMap = newContentState.getBlockMap().set(newBlock.key, newBlock);

		// Push the new content block into the editorState
		newEditorState = EditorState.push(
			newEditorState,
			ContentState.createFromBlockArray(newBlockMap.toArray()),
			'split-block'
		);

		// Apply the LINK-DEST entity to the new block
		newEditorState = createTagDestLink(newEditorState, linkId, newBlock.key);
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
	// 6. Eventually, any changes we make to content with entities, we need to sync back to linkStructure

	// block.getData() might give us a map with the metadata we need
	// There's the possibility we may have a duplicate issue eventually. If so, use Map to remove duplicates.

	return newEditorState;
};

// Creating a new destination tag link
const createTagDestLink = (editorState, linkId, blockKey) => {
	const selectionState = editorState.getSelection();
	const contentState = editorState.getCurrentContent();
	const block = contentState.getBlockForKey(blockKey);

	// Store these to restore the selection at the end
	const anchorKey = selectionState.getAnchorKey();
	const anchorOffset = selectionState.getAnchorOffset();
	const focusKey = selectionState.getFocusKey();
	const focusOffset = selectionState.getFocusOffset();

	// Selecting the text to apply the entity(link) to
	const selectionStateForEntity = selectionState.merge({
		anchorKey: blockKey, // Starting position
		anchorOffset: 0, // How much to adjust from the starting position
		focusKey: blockKey, // Ending position
		focusOffset: block.getText().length, // How much to adjust from the ending position.
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
