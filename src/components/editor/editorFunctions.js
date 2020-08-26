import { CompositeDecorator } from 'draft-js';

import LinkToDecorator from './decorators/linkToDecorator';

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
		strategy: getEntityStrategy('LINK'),
		component: LinkToDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
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

	let linkIdArray = [];
	for (let block of blockArray) {
		console.log(block.getData());

		block.findEntityRanges(
			(value) => {
				let entityKey = value.getEntity();
				if (!entityKey) {
					return false;
				}

				let entity = contentState.getEntity(entityKey);
				if (entity.getType() === 'LINK') {
					linkIdArray.push(entity.data.linkId);
				}

				return false;
			},
			() => {}
		);

		// block.findEntityRanges(
		// 	(value) => {
		// 		let entityKey = value.getEntity();
		// 		if (!entityKey) {
		// 			return false;
		// 		}
		// 		console.log('entityKey: ', entityKey);
		// 		let entity = contentState.getEntity(entityKey);
		// 		console.log('entity: ', entity);
		// 		return entity.getType() === 'LINK';
		// 	},
		// 	(start, end) => {
		// 		let entityKey = block.getEntityAt(start);
		// 		let entity = contentState.getEntity(entityKey);
		// 		console.log('entity from block: ', entity);
		// 		let type = entity.getType();
		// 		if (type === 'LINK') {
		// 			linkIdArray.push(entity.data.linkId);
		// 		}
		// 	}
		// );
	}

	// block.getData() might give us a map with the metadata we need

	console.log(linkIdArray);

	// We've got a problem when switching to documents with no entities - the filter is still showing an array with a tuple in it
	// let filteredEntityArray = entityArray.filter(
	// 	(item) => item[1].getType && item[1].getType() === 'LINK'
	// );
	// console.log(filteredEntityArray);

	// // This works but is returning an array with our link id for every page, not just the one with that link metadata
	// let linkIdArray = filteredEntityArray.map((item) => item[1].data.linkId);
	// console.log(linkIdArray);
};
