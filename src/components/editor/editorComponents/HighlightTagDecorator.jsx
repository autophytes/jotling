import React, { useState, useEffect, useMemo, useContext } from 'react';
import { LeftNavContext } from '../../../contexts/leftNavContext';
import { useChildDecorator } from '../editorCustomHooks';

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
	const { showAllTags } = useContext(LeftNavContext);

	// CHILD DECORATOR
	const { Component, componentProps } = useChildDecorator(childDecorator);
	let { getNextComponentIndex, getComponentForIndex, getComponentProps } = childDecorator;

	return (
		<span
			className={showAllTags ? 'highlight-tag-decorator' : ''}
			// style={{ fontWeight: 'bold' }}
			data-context-menu-show-tag-name={decoratedText}>
			{Component ? (
				<Component
					{...componentProps}
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
