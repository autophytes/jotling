import React, { useState, useEffect, useMemo } from 'react';

// PROPS INCLUDE
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

const HighlightTagDecorator = ({ children, decoratedText, childDecorator = {} }) => {
	// CHILD DECORATOR
	let {
		currentIndex,
		getNextComponentIndex,
		getComponentForIndex,
		getComponentProps,
	} = childDecorator;
	const [componentIndex, setComponentIndex] = useState(-1);

	console.log('HIGHLIGHT TAG DECORATOR rendered');

	useEffect(() => {
		if (getNextComponentIndex) {
			const newComponentIndex = getNextComponentIndex(currentIndex);
			setComponentIndex(newComponentIndex);
		}
	}, [getNextComponentIndex, currentIndex]);

	const Component = useMemo(
		() => (componentIndex !== -1 ? getComponentForIndex(componentIndex) : null),
		[componentIndex, getComponentForIndex]
	);

	return (
		<span style={{ fontWeight: 'bold' }}>
			{Component ? (
				<Component
					{...getComponentProps(componentIndex)}
					childDecorator={{
						currentIndex: componentIndex,
						getNextComponentIndex,
						getComponentForIndex,
						getComponentProps,
					}}
				/>
			) : (
				children
			)}
		</span>
	);
};

export { HighlightTagDecorator };
