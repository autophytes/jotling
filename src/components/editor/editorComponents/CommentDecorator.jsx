import React, { useContext, useState, useEffect, useMemo } from 'react';
import { EditorBlock } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { RightNavContext } from '../../../contexts/rightNavContext';
import { DecoratorContext } from '../../../contexts/decoratorContext';

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

// Get the entity key from the block at "start"
// Add {blockKey, start, end} to an array
// From our starting block (decorator block), if end is length, check next block
// If contains entity, add to the END of the array and check the next block. Repeat.
// From starting block, if start is 0, check the block before to see if it has that key
// If so, add {blockKey, start, end} to the START of the array as well

// SOURCE LINK
const CommentDecorator = ({
	children,
	blockKey,
	entityKey,
	contentState,
	start,
	end,
	decoratedText,
	childDecorator = {},
}) => {
	// CONTEXT
	const { scrollToCommentId, setScrollToCommentId } = useContext(RightNavContext);
	const { hoverCommentId, setHoverCommentId } = useContext(DecoratorContext);

	// STATE
	const [commentId, setCommentId] = useState(null);

	// CHILD DECORATOR
	let {
		currentIndex,
		getNextComponentIndex,
		getComponentForIndex,
		getComponentProps,
	} = childDecorator;
	const [componentIndex, setComponentIndex] = useState(-1);
	useEffect(() => {
		if (getNextComponentIndex) {
			const newComponentIndex = getNextComponentIndex(currentIndex);
			console.log('newComponentIndex:', newComponentIndex);
			setComponentIndex(newComponentIndex);
		}
	}, [getNextComponentIndex, currentIndex]);

	const Component = useMemo(
		() => (componentIndex !== -1 ? getComponentForIndex(componentIndex) : null),
		[componentIndex, getComponentForIndex]
	);
	const componentProps = useMemo(
		() => (componentIndex !== -1 ? getComponentProps(componentIndex) : {}),
		[componentIndex, getComponentProps]
	);
	// END CHILD DECORATOR

	// On load, grab the commentId
	useEffect(() => {
		// NOTE: if we remove the old comment and add a new one simultaneously,
		// this component may not be recreated.

		// Our comment ID is stored in a custom style. Parse that id.
		const block = contentState.getBlockForKey(blockKey);
		const styles = block.getInlineStyleAt(start).toArray();

		// Find the COMMENT style, pull the commentId
		const commentStyle = styles.find((item) => item.slice(0, 7) === 'COMMENT');
		const newCommentId = Number(commentStyle.slice(7));

		setCommentId(newCommentId);
	}, []);
	// }, [entityKey, linkId]);

	// TO-DO: Scroll to the clicked-on link from the right nav
	useEffect(() => {
		if (commentId !== null && scrollToCommentId === commentId) {
			setScrollToCommentId(null);
			// TO DO:  SCROLL TO THIS SPOT ON THE SCREEN
		}
	}, [scrollToCommentId, commentId]);

	// TO DO - display a popper on hover
	// Since possible multi-decorator, display popper from parent somewhere
	// Find the full range of the comment and display
	const handleHoverStart = (e) => {
		e.preventDefault();
		setHoverCommentId(commentId);
	};

	const handleHoverLeave = (e) => {
		e.preventDefault();
		if (hoverCommentId === commentId) {
			setHoverCommentId(null);
		}
	};

	return (
		<span
			style={{ borderBottom: '1px solid red' }}
			onMouseEnter={!showAllTags ? handleHoverStart : null}
			onMouseLeave={!showAllTags ? handleHoverLeave : null}>
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

export default CommentDecorator;
