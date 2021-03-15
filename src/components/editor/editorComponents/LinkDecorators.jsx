import React, { useContext, useState, useEffect, useMemo } from 'react';
import { EditorBlock } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';
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
const LinkSourceDecorator = ({
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
	const {
		setLinkStructure,
		linkStructureRef,
		showAllTags,
		editorStateRef,
		navData,
		scrollToLinkId,
		setScrollToLinkId,
		syncLinkIdList,
		setSyncLinkIdList,
	} = useContext(LeftNavContext);
	const { hoverSourceLinkId, setHoverSourceLinkId } = useContext(DecoratorContext);

	// STATE
	const [linkId, setLinkId] = useState(null);
	const [prevDecoratedText, setPrevDecoratedText] = useState(decoratedText);
	const [queuedTimeout, setQueuedTimeout] = useState(null);
	const [tagName, setTagName] = useState('');
	const [showActive, setShowActive] = useState(false);

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

	// On load (or decorator change - overwriting parts of links does this), grab the entity linkId
	useEffect(() => {
		let newLinkId = getLinkId(entityKey, contentState, blockKey, start);
		setLinkId(newLinkId);

		// Resync the content (needed for when overwriting part of a link with a new one)
		setPrevDecoratedText('');
	}, [entityKey]);
	// }, [entityKey, linkId]);

	useEffect(() => {
		if (syncLinkIdList.includes(linkId)) {
			// Trigger the re-synchronization
			setPrevDecoratedText('');

			// Remove our linkId from the array
			let newSyncLinkIdList = [...syncLinkIdList];
			let idIndex = newSyncLinkIdList.findIndex((item) => item === linkId);
			newSyncLinkIdList.splice(idIndex, 1);

			setSyncLinkIdList(newSyncLinkIdList);
		}
	}, [linkId, syncLinkIdList]);

	// Scroll to the clicked-on link from the right nav
	// NOTE: IS THIS STILL SCROLLING? I DON'T THINK IT IS
	useEffect(() => {
		if (linkId !== null && scrollToLinkId === linkId) {
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
		prevDecoratedText,
	]);

	const handleHoverStart = (e) => {
		e.preventDefault();
		setHoverSourceLinkId(linkId);
	};

	const handleHoverLeave = (e) => {
		e.preventDefault();
		if (hoverSourceLinkId === linkId) {
			setHoverSourceLinkId(null);
		}
	};

	return (
		<span
			className={
				'link-source-decorator' +
				(showAllTags || showActive || hoverSourceLinkId === linkId ? ' active' : '')
			}
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

// DESTINATION LINK
const LinkDestDecorator = ({
	children,
	blockKey,
	contentState,
	decoratedText,
	childDecorator = {},
}) => {
	// CONTEXT
	const { setLinkStructure, linkStructureRef, showAllTags, setPeekWindowLinkId } = useContext(
		LeftNavContext
	);
	const { hoverDestLinkId, setHoverDestLinkId } = useContext(DecoratorContext);

	// STATE
	const [linkId, setLinkId] = useState(null);
	const [prevDecoratedText, setPrevDecoratedText] = useState(decoratedText);
	const [isAliased, setIsAliased] = useState(false);

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

	// On load, grab the entity linkId
	useEffect(() => {
		const block = contentState.getBlockForKey(blockKey);
		const blockData = block.getData();
		const linkId = blockData.get('linkDestId');
		if (linkId) {
			setLinkId(linkId);

			// Check if the link is aliased
			if (linkStructureRef.current.links[linkId].alias) {
				setIsAliased(true);
			}
		}
	}, []);

	// Update our linkStructure if the link is alised
	useEffect(() => {
		if (!isAliased) {
			if (linkId && prevDecoratedText !== decoratedText) {
				let newLinkStructure = JSON.parse(JSON.stringify(linkStructureRef.current));
				newLinkStructure.links[linkId].alias = true;

				setIsAliased(true);
				setLinkStructure(newLinkStructure);
			}
		}
	}, [decoratedText, prevDecoratedText, isAliased, linkId]);

	const handleHoverStart = () => {
		setHoverDestLinkId(linkId);
	};

	const handleHoverLeave = () => {
		if (hoverDestLinkId === linkId) {
			setHoverDestLinkId(null);
		}
	};

	return (
		<>
			<span
				className={
					'link-dest-decorator' + (showAllTags || hoverDestLinkId === linkId ? ' active' : '')
				}
				onMouseEnter={!showAllTags ? handleHoverStart : null}
				onMouseLeave={!showAllTags ? handleHoverLeave : null}
				style={{ position: 'relative' }}>
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
				<div className='peek-wrapper' contentEditable={false}>
					<button
						className='peek-destination-decorator'
						onClick={() => setPeekWindowLinkId(linkId)}>
						Peek
					</button>
				</div>
			</span>
		</>
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

// NOT USING - was causing text issues
const LinkDestBlock = (props) => {
	const { block } = props;

	const { setPeekWindowLinkId, editorStyles } = useContext(LeftNavContext);
	const { hoverDestLinkId, setHoverDestLinkId } = useContext(DecoratorContext);

	const [linkId, setLinkId] = useState(null);

	useEffect(() => {
		console.log('the LinkDestBlock has changed!');
	}, [block]);

	// Grabbing the linkId for the block
	useEffect(() => {
		const blockData = block.getData();
		const linkId = blockData.get('linkDestId');
		if (linkId) {
			setLinkId(linkId);
		}
	}, []);

	const handleHoverStart = () => {
		console.log('hover start');
		setHoverDestLinkId(linkId);
	};

	const handleHoverLeave = () => {
		console.log('hover end');
		if (hoverDestLinkId === linkId) {
			setHoverDestLinkId(null);
		}
	};

	return (
		<div
			className={
				'link-dest-decorator' + (showAllTags || hoverDestLinkId === linkId ? ' active' : '')
			}
			style={{ position: 'relative' }}
			// onMouseEnter={handleHoverStart}
			// onMouseLeave={handleHoverLeave}
		>
			<div className='peek-wrapper' contentEditable={false}>
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
		console.log('syncing the link structure!');
		// Remove any queued updates to linkStructure
		if (queuedTimeout) {
			clearTimeout(queuedTimeout);
		}

		// Queue an update to linkStructure with the updated text
		const newTimeout = setTimeout(() => {
			// Make sure the block exists in the current editorState (that we haven't switched pages)
			if (!editorStateRef.current.getCurrentContent().getBlockForKey(blockKey)) {
				return;
			}

			let newEntityContent = getAllEntityContent(editorStateRef, blockKey, start, end);

			let newLinkStructure = { ...linkStructureRef.current };
			newLinkStructure.links[linkId][linkPropName] = newEntityContent;
			// getAllEntityContent(editorStateRef, blockKey, start, end);

			setLinkStructure(newLinkStructure);
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

	let contentArray = [];

	startingBlock.findEntityRanges(
		(value) => {
			let newEntityKey = value.getEntity();
			if (newEntityKey === entityKey) {
				return true;
			}
			return false;
		},
		(start, end) => {
			contentArray.push(startingBlock.getText().slice(start, end));
		}
	);

	const checkBlocksBeforeAfter = (direction) => {
		let continueForward = true;
		let forwardKey = currentBlockKey;

		while (continueForward) {
			let contentBlock =
				direction === 'BEFORE'
					? contentState.getBlockAfter(forwardKey)
					: contentState.getBlockBefore(forwardKey);

			if (!contentBlock) {
				continueForward = false;
				continue;
			}
			forwardKey = contentBlock.getKey();

			let contentToAdd, linkStart, linkEnd;

			contentBlock.findEntityRanges(
				(value) => {
					let newEntityKey = value.getEntity();
					if (newEntityKey === entityKey) {
						return true;
					}
					return false;
				},
				(start, end) => {
					contentToAdd = contentBlock.getText().slice(start, end);
					linkStart = start;
					linkEnd = end;
				}
			);

			if (contentToAdd) {
				if (direction === 'BEFORE') {
					contentArray.push(contentToAdd);
					if (linkEnd !== contentBlock.getLength()) {
						continueForward = false;
					}
				} else {
					contentArray.unshift(contentToAdd);
					if (linkStart !== 0) {
						continueForward = false;
					}
				}
			} else {
				continueForward = false;
			}
		}
	};

	checkBlocksBeforeAfter('BEFORE');
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
