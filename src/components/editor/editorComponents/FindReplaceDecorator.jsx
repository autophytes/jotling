import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { Modifier, SelectionState, EditorState } from 'draft-js';

import { FindReplaceContext } from '../../../contexts/findReplaceContext';
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

const FindReplaceDecorator = ({ children, blockKey, start, childDecorator = {} }) => {
	// STATE
	const [isCurrentResult, setIsCurrentResult] = useState(false);

	// CHILD DECORATOR
	const { Component, componentProps, componentIndex } = useChildDecorator(childDecorator);
	let { getNextComponentIndex, getComponentForIndex, getComponentProps } = childDecorator;

	// CONTEXT
	const {
		findText,
		findRegisterRef,
		findIndex,
		queueDecoratorUpdate,
		totalMatches,
	} = useContext(FindReplaceContext);

	// REFS
	const decoratorRef = useRef(null);

	useEffect(() => {
		queueDecoratorUpdate(findText);

		// Runs when the decorator is unmounted
		const cleanupOnUnmount = () => {
			queueDecoratorUpdate(findText);
		};

		return cleanupOnUnmount;
	}, [findText, blockKey, start]);

	// Check if the decorator is the current result
	useEffect(() => {
		if (findIndex !== null) {
			let findObject = findRegisterRef.current[findText.toLowerCase()][findIndex];

			if (
				findObject &&
				findObject.blockKey === blockKey &&
				start >= findObject.start &&
				start < findObject.start + findText.length
			) {
				// This is the current find result
				setIsCurrentResult(true);
			} else {
				setIsCurrentResult(false);
			}
		} else {
			setIsCurrentResult(false);
		}
		// When total matches changes, we need to re-check if we're the new current result
	}, [findIndex, findText, blockKey, start, totalMatches]);

	// If this is the highlighted match, scroll to it
	useEffect(() => {
		if (isCurrentResult) {
			let decoratorRect = decoratorRef.current.getBoundingClientRect();

			if (
				decoratorRect.top < 80 ||
				// window.pageYOffset + document.clientHeight < decoratorRect.top
				window.innerHeight - 25 < decoratorRect.top
			) {
				window.scrollTo({
					left: 0,
					top: Math.floor(decoratorRect.top + window.pageYOffset - 200, 0),
					behavior: 'auto',
				});
			}
		}
	}, [isCurrentResult]);

	return (
		<span
			ref={decoratorRef}
			className={`find-highlight-${isCurrentResult ? 'orange' : 'yellow'}`}
			// style={{ backgroundColor: isCurrentResult ? '#FFA500' : '#FFFF00' }}
		>
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

export { FindReplaceDecorator };
