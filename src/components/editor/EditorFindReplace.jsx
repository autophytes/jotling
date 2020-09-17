import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';

import { FindReplaceContext } from '../../contexts/findReplaceContext';
import { LeftNavContext } from '../../contexts/leftNavContext';

import { findVisibleBlocks } from './editorFunctions';

import CaratDownSVG from '../../assets/svg/CaratDownSVG';
import CloseSVG from '../../assets/svg/CloseSVG';

import Collapse from 'react-css-collapse';

const repositionFindPopper = (editorStyles, setRightOffset) => {
	let rootSize = Number(
		window
			.getComputedStyle(document.querySelector(':root'))
			.getPropertyValue('font-size')
			.replace('px', '')
	);

	let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
	let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;
	let maxEditor = editorStyles.editorMaxWidth * rootSize;
	let windowWidth = window.innerWidth;
	let gutter = Math.max(windowWidth - leftNav - rightNav - maxEditor, 0);
	// let newLeftOffset = leftNav + gutter / 2;
	let newRightOffset = rightNav + gutter / 2 + 0.5 * rootSize;

	// setLeftOffset(newLeftOffset);
	setRightOffset(newRightOffset);
};

const EditorFindReplace = ({ editorRef }) => {
	// STATE
	const [showReplace, setShowReplace] = useState(false);
	const [findText, setFindText] = useState('');
	const [replaceText, setReplaceText] = useState('');
	const [rightOffset, setRightOffset] = useState(13);

	// CONTEXT
	const {
		setFindText: setContextFindText,
		setReplaceText: setContextReplaceText,
		setShowFindReplace,
		refocusFind,
		setRefocusFind,
		refocusReplace,
		setRefocusReplace,
		findRegisterRef,
		findIndex,
		setFindIndex,
		totalMatches,
		setReplaceSingleQueue,
		queueDecoratorUpdate,
	} = useContext(FindReplaceContext);
	const { editorStyles, editorStateRef } = useContext(LeftNavContext);

	// REFS
	const findInputRef = useRef(null);
	const replaceInputRef = useRef(null);

	// Focus the find input
	useEffect(() => {
		if (refocusFind) {
			// Focus on the find input
			findInputRef.current.focus();
			setRefocusFind(false);
		}
	}, [refocusFind]);

	// Focus the replace input
	useEffect(() => {
		if (refocusReplace) {
			// Focus on the replace input
			setShowReplace(true);
			setRefocusReplace(false);
			setTimeout(() => {
				replaceInputRef.current.focus();
			}, 0);
		}
	}, [refocusReplace]);

	// Reregister window resize listener to reposition the popper
	useEffect(() => {
		const reposition = () => {
			repositionFindPopper(editorStyles, setRightOffset);
		};

		window.addEventListener('resize', reposition);

		return () => {
			window.removeEventListener('resize', reposition);
		};
	}, [editorStyles]);

	// Recalculate the position of the popper
	useEffect(() => {
		repositionFindPopper(editorStyles, setRightOffset);
	}, [editorStyles]);

	// Close the find popper on ESCAPE
	useEffect(() => {
		const closeEventListener = (e) => {
			if (e.keyCode === 27) {
				// Clear our search variable
				setContextFindText('');
				setShowFindReplace(false);
			}
		};
		document.addEventListener('keyup', closeEventListener);

		return () => document.removeEventListener('keyup', closeEventListener);
	}, []);

	const updateFindIndex = useCallback(
		(direction) => {
			if (
				!findRegisterRef.current[findText.toLowerCase()] ||
				!findRegisterRef.current[findText.toLowerCase()].array.length
			) {
				return;
			}

			// For the first search, find the match on screen (or the next off screen)
			if (findIndex === null) {
				let visibleBlocks = findVisibleBlocks(editorRef);

				// Check the visible blocks for the first match
				for (const [i, match] of findRegisterRef.current[
					findText.toLowerCase()
				].array.entries()) {
					if (visibleBlocks.includes(match.blockKey)) {
						setFindIndex(i);
						return;
					}
				}

				// If not on screen, iterate through the off-screen blocks to find the first mach
				let contentState = editorStateRef.current.getCurrentContent();
				let blockKey = visibleBlocks[visibleBlocks.length - 1].blockKey;
				while (!visibleMatch) {
					let block = contentState.getBlockAfter(blockKey);
					if (!block) {
						block = contentState.getFirstBlock();
					}
					blockKey = block.getKey();

					if (findRegisterRef.current[findText.toLowerCase()].blockList[blockKey]) {
						let matchIndex = findRegisterRef.current[findText.toLowerCase()].array.findIndex(
							(item) => item.blockKey === blockKey
						);
						setFindIndex(matchIndex);
						return;
					}
				}
			}

			if (direction === 'INCREMENT') {
				if (findIndex === findRegisterRef.current[findText.toLowerCase()].array.length - 1) {
					setFindIndex(0);
				} else {
					setFindIndex(findIndex + 1);
				}
			}

			if (direction === 'DECREMENT') {
				if (findIndex === 0) {
					setFindIndex(findRegisterRef.current[findText.toLowerCase()].array.length - 1);
				} else {
					setFindIndex(findIndex - 1);
				}
			}
		},
		[findIndex, setFindIndex, findText]
	);

	// Move the find selection forwards/backwards
	const handleInputEnter = useCallback(
		(e) => {
			// If enter was pressed
			if (e.key === 'Enter') {
				console.log('handle input enter');
				if (e.shiftKey) {
					updateFindIndex('DECREMENT');
				} else {
					updateFindIndex('INCREMENT');
				}
			}
		},
		[updateFindIndex]
	);

	// Replace a single find match
	const handleReplaceSingle = useCallback(() => {
		if (
			findRegisterRef.current[findText.toLowerCase()] &&
			findRegisterRef.current[findText.toLowerCase()].array.length &&
			findIndex !== null
		) {
			// Finds the object to replace
			let findObject = findRegisterRef.current[findText.toLowerCase()].array[findIndex];

			// Queues the replacement of that match
			setReplaceSingleQueue({
				[`${findObject.blockKey}-${findObject.start}`]: true,
			});

			// If the replacement still matches our find, increment to the next index.
			if (findText.toLowerCase() === replaceText.toLowerCase()) {
				console.log('incremented because replaceText === findText');
				updateFindIndex('INCREMENT');
			}

			queueDecoratorUpdate(findText);
		}
	}, [findIndex, queueDecoratorUpdate]);

	// NEXT
	// DONE - Implement the replace
	// Implement replace all
	// https://reactrocket.com/post/draft-js-search-and-replace/
	// https://jsfiddle.net/levsha/o3xyvkw7/

	return (
		<div className='editor-find-container' style={{ right: rightOffset }}>
			<div
				className={'find-container-svg' + (showReplace ? ' expanded' : '')}
				onClick={() => setShowReplace(!showReplace)}>
				<CaratDownSVG rotate='-90' />
			</div>
			<div>
				<div style={{ display: 'flex' }}>
					<input
						type='text'
						placeholder='Find'
						ref={findInputRef}
						value={findText}
						onChange={(e) => {
							console.log('on change fired');
							setFindText(e.target.value);
							setContextFindText(e.target.value);
						}}
						onKeyDown={handleInputEnter}
					/>
					<p className='find-containter-counter'>
						{findText && findRegisterRef.current[findText.toLowerCase()]
							? `${findIndex === null ? 1 : findIndex + 1} of ${totalMatches}`
							: ''}
					</p>
					<div className='find-container-svg' onClick={() => updateFindIndex('DECREMENT')}>
						<CaratDownSVG rotate='90' />
					</div>
					<div className='find-container-svg' onClick={() => updateFindIndex('INCREMENT')}>
						<CaratDownSVG rotate='-90' />
					</div>
					<div className='find-container-svg' onClick={() => setShowFindReplace(false)}>
						<CloseSVG />
					</div>
				</div>
				<Collapse isOpen={showReplace}>
					<div
						style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<input
							type='text'
							placeholder='Replace'
							ref={replaceInputRef}
							value={replaceText}
							onChange={(e) => {
								setReplaceText(e.target.value);
								setContextReplaceText(e.target.value);
							}}
						/>
						<button className='find-container-replace-button' onClick={handleReplaceSingle}>
							Replace
						</button>
						<button className='find-container-replace-button'>Replace All</button>
					</div>
				</Collapse>
			</div>
		</div>
	);
};

export default EditorFindReplace;
