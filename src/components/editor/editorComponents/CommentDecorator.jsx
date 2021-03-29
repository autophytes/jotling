import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { EditorBlock } from 'draft-js';
import { usePopper } from 'react-popper';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { RightNavContext } from '../../../contexts/rightNavContext';
import { DecoratorContext } from '../../../contexts/decoratorContext';
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

// Get the entity key from the block at "start"
// Add {blockKey, start, end} to an array
// From our starting block (decorator block), if end is length, check next block
// If contains entity, add to the END of the array and check the next block. Repeat.
// From starting block, if start is 0, check the block before to see if it has that key
// If so, add {blockKey, start, end} to the START of the array as well

function generateGetBoundingClientRect(x = 0, y = 0) {
	return () => ({
		width: 0,
		height: 0,
		top: y - 20,
		right: x,
		bottom: y - 20,
		left: x,
	});
}

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
	const { commentStructure, setCommentStructure, showAllTags } = useContext(LeftNavContext);
	const { scrollToCommentId, setScrollToCommentId } = useContext(RightNavContext);
	const { hoverCommentId, setHoverCommentId } = useContext(DecoratorContext);

	// STATE
	const [commentId, setCommentId] = useState(null);
	const [comment, setComment] = useState('');
	const [showPopper, setShowPopper] = useState(false);

	const [virtualMouseEl, setVirtualMouseEl] = useState({
		getBoundingClientRect: generateGetBoundingClientRect(),
	});

	// POPPER
	//   Note - using state is to monitor for changes - https://popper.js.org/react-popper/v2/
	const [commentDecoratorEl, setCommentDecoratorEl] = useState(null);
	const [popperEl, setPopperEl] = useState(null);
	const [popperArrowEl, setPopperArrowEl] = useState(null);

	const { styles, attributes } = usePopper(virtualMouseEl, popperEl, {
		modifiers: [{ name: 'arrow', options: { element: popperArrowEl } }],
		placement: 'top',
	});

	// CHILD DECORATOR
	const { Component, componentProps, componentIndex } = useChildDecorator(childDecorator);
	let { getNextComponentIndex, getComponentForIndex, getComponentProps } = childDecorator;

	// On load, grab the commentId
	useEffect(() => {
		// NOTE: if we remove the old comment and add a new one simultaneously,
		// this component may not be recreated.

		// Our comment ID is stored in a custom style. Parse that id.
		const block = contentState.getBlockForKey(blockKey);
		const styles = block.getInlineStyleAt(start).toArray();

		// Find the COMMENT style, pull the commentId
		const commentStyle = styles.find((item) => item.slice(0, 8) === 'COMMENT-');
		const newCommentId = Number(commentStyle.slice(8));

		setCommentId(newCommentId);

		// Remove shouldDelete property
		setCommentStructure((prev) => {
			// If the comment is flagged for deletion, clean it up
			if (prev[newCommentId].shouldDelete) {
				return {
					...prev,
					[newCommentId]: {
						...prev[newCommentId],
						shouldDelete: false,
					},
				};
			} else {
				// Otherwise, return the original structure
				return prev;
			}
		});
	}, []);

	// Load in the comment
	useEffect(() => {
		if (commentId) {
			const newComment = commentStructure[commentId];
			if (newComment) {
				setComment(newComment.comment);
			}
		}
		// We want to refresh the comment whenever the commentStructure changes
	}, [commentId, commentStructure]);

	// TO-DO: Scroll to the clicked-on link from the right nav
	useEffect(() => {
		if (commentId !== null && scrollToCommentId === commentId) {
			setScrollToCommentId(null);
			// TO DO:  SCROLL TO THIS SPOT ON THE SCREEN
		}
	}, [scrollToCommentId, commentId]);

	const handleHoverMouseMove = useCallback(({ clientX: x, clientY: y }) => {
		setVirtualMouseEl({ getBoundingClientRect: generateGetBoundingClientRect(x, y) });
	}, []);

	// Display the popper over the mouse on hover
	const handleHoverStart = (e) => {
		e.persist();
		e.preventDefault();

		// INITIALIZE MOUSE POSITION
		handleHoverMouseMove(e);

		// Add listener to position the popper with the mouse
		document.addEventListener('mousemove', handleHoverMouseMove);

		setShowPopper(true);
		setHoverCommentId(commentId);
	};

	const handleHoverLeave = (e) => {
		e.preventDefault();

		document.removeEventListener('mousemove', handleHoverMouseMove);
		setShowPopper(false);
		setHoverCommentId((prev) => (prev === commentId ? false : prev));
	};

	// Remove listener on unmount
	useEffect(() => {
		return () => document.removeEventListener('mousemove', handleHoverMouseMove);
	}, []);

	return (
		<>
			<span
				style={
					showAllTags || hoverCommentId === commentId
						? { borderBottom: '2px solid rgba(var(--color-primary-rgb), 0.3)' }
						: {}
				}
				ref={setCommentDecoratorEl}
				onMouseEnter={handleHoverStart}
				onMouseLeave={handleHoverLeave}
				data-context-menu-comment-id={commentId}
				data-context-menu-block-key={blockKey}>
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

			{/* COMMENT POPPER */}
			{!!showPopper && (
				<div
					ref={setPopperEl}
					className='comment-decorator-popper'
					style={styles.popper}
					{...attributes.popper}>
					{comment}
					<div
						ref={setPopperArrowEl}
						className='comment-decorator-popper-arrow'
						style={styles.arrow}
					/>
				</div>
			)}
		</>
	);
};

export default CommentDecorator;
