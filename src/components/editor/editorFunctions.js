import { CompositeDecorator } from 'draft-js';

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
		// component: TokenSpan, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
	},
]);
