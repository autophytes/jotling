import React, { useContext, useState, useEffect, useRef } from 'react';
import { EditorBlock } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';

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
const LinkSourceDecorator = ({
	children,
	blockKey,
	entityKey,
	contentState,
	start,
	end,
	decoratedText,
}) => {
	// CONTEXT
	const {
		setLinkStructure,
		linkStructureRef,
		editorStyles,
		editorStateRef,
		navData,
		scrollToLinkId,
		setScrollToLinkId,
		scrollToLinkIdRef,
	} = useContext(LeftNavContext);

	// STATE
	const [linkId, setLinkId] = useState(null);
	const [prevDecoratedText, setPrevDecoratedText] = useState(decoratedText);
	const [queuedTimeout, setQueuedTimeout] = useState(null);
	const [tagName, setTagName] = useState('');
	const [showActive, setShowActive] = useState(false);

	// REF
	const decoratorRef = useRef(null);

	// On load, grab the entity linkId
	useEffect(() => {
		setLinkId(getLinkId(entityKey, contentState, blockKey, start));
	}, []);

	// Scroll to the clicked-on link from the right nav
	useEffect(() => {
		if (linkId !== null && scrollToLinkId === linkId) {
			// if (scrollToLinkIdRef.current === linkId) {
			// 	scrollToLinkIdRef.current = null;

			// 	let decoratorRect = decoratorRef.current.getBoundingClientRect();

			// 	window.scrollTo({
			// 		left: 0,
			// 		top: Math.floor(decoratorRect.top + window.pageYOffset - 200, 0),
			// 		behavior: 'smooth',
			// 	});
			// }
			setScrollToLinkId(null);
			setShowActive(true);
		}
	}, [scrollToLinkId, linkId]);

	// Turn off the hover state flicker for the decorator
	useEffect(() => {
		if (showActive) {
			setShowActive(false);
		}
	}, [showActive]);

	useEffect(() => {
		if (linkId || linkId === 0) {
			let newTagName = linkStructureRef.current.docLinks[navData.currentDoc][linkId];
			setTagName(newTagName);
		}
		// Deliberately leaving navData.currentDoc out of the variables we're monitoring
	}, [linkStructureRef, linkId]);

	// Update our linkStructure with the changes in the link text
	useEffect(() => {
		syncLinkStructureOnDelay({
			linkId,
			linkPropName: 'content',
			prevDecoratedText,
			decoratedText,
			queuedTimeout,
			linkStructureRef,
			setLinkStructure,
			setQueuedTimeout,
			setPrevDecoratedText,
			editorStateRef,
			blockKey,
			start,
			end,
		});
	}, [
		decoratedText,
		setLinkStructure,
		linkId,
		queuedTimeout,
		linkStructureRef,
		editorStateRef,
		blockKey,
		start,
		end,
	]);

	return (
		<span
			ref={decoratorRef}
			className={
				'link-source-decorator' +
				(editorStyles.showAllTags || editorStyles.showIndTags.includes(tagName) || showActive
					? ' active'
					: '')
			}>
			{children}
		</span>
	);
};

// DESTINATION LINK
const LinkDestDecorator = ({
	children,
	blockKey,
	entityKey,
	contentState,
	start,
	end,
	decoratedText,
}) => {
	// CONTEXT
	const {
		setLinkStructure,
		linkStructureRef,
		editorStyles,
		editorStateRef,
		navData,
		setPeekWindowLinkId,
	} = useContext(LeftNavContext);

	// STATE
	const [linkId, setLinkId] = useState(null);
	const [prevDecoratedText, setPrevDecoratedText] = useState(decoratedText);
	const [queuedTimeout, setQueuedTimeout] = useState(null);

	// On load, grab the entity linkId
	useEffect(() => {
		setLinkId(getLinkId(entityKey, contentState, blockKey, start));
	}, []);

	// Update our linkStructure with the changes in the link text
	useEffect(() => {
		syncLinkStructureOnDelay({
			linkId,
			linkPropName: 'alias',
			prevDecoratedText,
			decoratedText,
			queuedTimeout,
			linkStructureRef,
			setLinkStructure,
			setQueuedTimeout,
			setPrevDecoratedText,
			editorStateRef,
			blockKey,
			start,
			end,
		});
	}, [
		decoratedText,
		setLinkStructure,
		linkId,
		queuedTimeout,
		linkStructureRef,
		editorStateRef,
		blockKey,
		start,
		end,
	]);

	return (
		<span className={'link-dest-decorator' + (editorStyles.showAllTags ? ' active' : '')}>
			{/* <div className='peek-wrapper'>
				<button
					className='peek-destination-decorator'
					onClick={() => setPeekWindowLinkId(linkId)}>
					Peek
				</button>
			</div> */}
			{/* {showPeekWindow && <PeekDocument {...{ linkId, linkStructureRef }} />} */}
			{children}
		</span>
	);
};

// block: ContentBlock {_map: Map, __ownerID: undefined}
// blockProps: undefined
// blockStyleFn: block => {…}
// contentState: ContentState {_map: Map, __ownerID: undefined}
// customStyleFn: undefined
// customStyleMap: {BOLD: {…}, CODE: {…}, ITALIC: {…}, STRIKETHROUGH: {…}, UNDERLINE: {…}, …}
// decorator: CompositeDraftDecorator {_decorators: Array(2)}
// direction: "LTR"
// forceSelection: true
// offsetKey: "ah7m4-0-0"
// preventScroll: undefined
// selection: SelectionState {_map: Map, __ownerID: undefined}
// tree: List

// We need to compose a draft editor block inside our component. The props look the same.
// https://draftjs.org/docs/advanced-topics-block-components
// https://github.com/facebook/draft-js/issues/132
// WE NEED TO GET THE BUTTON SET UP
const LinkDestBlock = (props) => {
	const { setPeekWindowLinkId } = useContext(LeftNavContext);

	const [linkId, setLinkId] = useState(null);

	useEffect(() => {
		const { block, contentState } = props;

		const entityKey = block.getEntityAt(0);
		if (entityKey) {
			const entity = contentState.getEntity(entityKey);
			const entityData = entity.get('data');
			console.log('entity data in LinkDestBlock: ', entityData);
			setLinkId(entityData.linkId);
		}
	}, []);

	return (
		<div className='link-dest-decorator' style={{ position: 'relative' }}>
			<div className='peek-wrapper'>
				<button
					className='peek-destination-decorator'
					onClick={() => setPeekWindowLinkId(linkId)}>
					Peek
				</button>
			</div>
			<EditorBlock {...props} />
		</div>
	);
};

// Gets the Link ID for the entity
const getLinkId = (entityKey, contentState, blockKey, start) => {
	if (entityKey) {
		return contentState.getEntity(entityKey).data.linkId;
	}

	const block = contentState.getBlockForKey(blockKey);
	const retrievedEntityKey = block.getEntityAt(start);
	return contentState.getEntity(retrievedEntityKey).data.linkId;
};

// Queues a delayed update of the link 'alias' or 'content'
const syncLinkStructureOnDelay = ({
	linkId,
	linkPropName,
	prevDecoratedText,
	decoratedText,
	queuedTimeout,
	linkStructureRef,
	setLinkStructure,
	setQueuedTimeout,
	setPrevDecoratedText,
	editorStateRef,
	blockKey,
	start,
	end,
}) => {
	if (linkId !== null && prevDecoratedText !== decoratedText) {
		// Remove any queued updates to linkStructure
		if (queuedTimeout) {
			clearTimeout(queuedTimeout);
		}

		// Queue an update to linkStructure with the updated text
		const newTimeout = setTimeout(() => {
			let newLinkStructure = { ...linkStructureRef.current };
			newLinkStructure.links[linkId][linkPropName] = getAllEntityContent(
				editorStateRef,
				blockKey,
				start,
				end
			);
			// getAllEntityContent(editorStateRef, blockKey, start, end);
			setLinkStructure({ ...newLinkStructure });
		}, 500);

		// Save the timeout (for potential clearing on changes)
		setQueuedTimeout(newTimeout);
		// Update the text we've queued updates for
		setPrevDecoratedText(decoratedText);
	}
};

// Gets all content for the entity, including blocks before and after the decorated block
const getAllEntityContent = (editorStateRef, currentBlockKey, currentStart, currentEnd) => {
	const contentState = editorStateRef.current.getCurrentContent();
	const startingBlock = contentState.getBlockForKey(currentBlockKey);
	const entityKey = startingBlock.getEntityAt(currentStart);

	let contentArray = [startingBlock.getText().slice(currentStart, currentEnd)];

	const checkBlocksBeforeAfter = (direction) => {
		let continueForward = true;
		let forwardKey = currentBlockKey;

		while (continueForward) {
			let forwardBlock =
				direction === 'FORWARD'
					? contentState.getBlockAfter(forwardKey)
					: contentState.getBlockBefore(forwardKey);

			if (!forwardBlock) {
				continueForward = false;
				continue;
			}
			forwardKey = forwardBlock.getKey();

			forwardBlock.findEntityRanges(
				(value) => {
					let newEntityKey = value.getEntity();
					if (newEntityKey === entityKey) {
						return true;
					}
					return false;
				},
				(start, end) => {
					if (direction === 'FORWARD') {
						contentArray.push(forwardBlock.getText().slice(start, end));
						if (end !== forwardBlock.getLength()) {
							continueForward = false;
						}
					} else {
						contentArray.unshift(forwardBlock.getText().slice(start, end));
						if (start !== 0) {
							continueForward = false;
						}
					}
				}
			);
		}
	};

	checkBlocksBeforeAfter('FORWARD');
	checkBlocksBeforeAfter('AFTER');

	// console.log('blockPropArray: ', blockPropArray);
	// console.log('contentArray: ', contentArray);

	// console.log(contentArray.join('\n'));
	return contentArray.join('\n');

	// Get the entity key from the block at "start"
	// Add {blockKey, start, end} to an array
	// From our starting block (decorator block), if end is length, check next block
	// If contains entity, add to the END of the array and check the next block. Repeat.
	// From starting block, if start is 0, check the block before to see if it has that key
	// If so, add {blockKey, start, end} to the START of the array as well
};

export { LinkSourceDecorator, LinkDestDecorator, LinkDestBlock };
