import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { SelectionState, EditorState, Modifier } from 'draft-js';

import { FindReplaceContext } from '../../contexts/findReplaceContext';
import { LeftNavContext } from '../../contexts/leftNavContext';
import { SettingsContext } from '../../contexts/settingsContext';

// import { findVisibleBlocks } from './editorFunctions';

import CaratDownSVG from '../../assets/svg/CaratDownSVG';
import CloseSVG from '../../assets/svg/CloseSVG';

import { getTextSelection } from '../../utils/draftUtils';

import Collapse from 'react-css-collapse';
// import { replace } from 'tar';

const repositionFindPopper = (editorStyles, editorSettings, setRightOffset) => {
	let rootSize = Number(
		window
			.getComputedStyle(document.querySelector(':root'))
			.getPropertyValue('font-size')
			.replace('px', '')
	);

	let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
	let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;
	let maxEditor = editorSettings.editorMaxWidth * rootSize;
	let windowWidth = window.innerWidth;
	let gutter = Math.max(windowWidth - leftNav - rightNav - maxEditor, 0);
	// let newLeftOffset = leftNav + gutter / 2;
	let newRightOffset = rightNav + gutter / 2 + 0.5 * rootSize;

	// setLeftOffset(newLeftOffset);
	setRightOffset(newRightOffset);
};

const EditorFindReplace = () => {
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
		// setFindIndex,
		totalMatches,
		setReplaceSingleQueue,
		queueDecoratorUpdate,
		setReplaceAll,
		updateFindIndex,
		contextEditorRef,
	} = useContext(FindReplaceContext);
	const { editorStyles, editorStateRef, setEditorStateRef } = useContext(LeftNavContext);
	const { editorSettings } = useContext(SettingsContext);

	// REFS
	const findInputRef = useRef(null);
	const replaceInputRef = useRef(null);

	const findEditorStateSelection = () => {
		const selection = editorStateRef.current.getSelection();
		if (!selection.getHasFocus()) {
			return;
		}

		const contentState = editorStateRef.current.getCurrentContent();
		const selectedText = getTextSelection(contentState, selection);

		if (selectedText && !selectedText.includes('\n')) {
			findRegisterRef.current[selectedText.toLowerCase()] = [];
			setFindText(selectedText);
			setContextFindText(selectedText);
		}
	};

	// Set the initial find text to the current document selection
	useEffect(() => {
		findEditorStateSelection();
	}, []);

	// Focus the find input
	useEffect(() => {
		if (refocusFind) {
			// Focus on the find input
			findEditorStateSelection();
			findInputRef.current.focus();
			setRefocusFind(false);
		}
	}, [refocusFind]);

	// Focus the replace input
	useEffect(() => {
		if (refocusReplace) {
			// Focus on the replace input
			findEditorStateSelection();
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
			repositionFindPopper(editorStyles, editorSettings, setRightOffset);
		};

		window.addEventListener('resize', reposition);

		return () => {
			window.removeEventListener('resize', reposition);
		};
	}, [editorStyles, editorSettings]);

	// Recalculate the position of the popper
	useEffect(() => {
		repositionFindPopper(editorStyles, editorSettings, setRightOffset);
	}, [editorStyles, editorSettings]);

	// Close the find popper on ESCAPE
	useEffect(() => {
		const closeEventListener = (e) => {
			if (e.keyCode === 27) {
				// Clear our search variable
				// e.stopImmediatePropagation();
				setContextFindText('');
				setShowFindReplace(false);
			}
		};
		document.addEventListener('keyup', closeEventListener);

		return () => document.removeEventListener('keyup', closeEventListener);
	}, []);

	// Move the find selection forwards/backwards
	const handleInputEnter = useCallback(
		(e) => {
			// If enter was pressed
			if (e.key === 'Enter') {
				if (e.shiftKey) {
					updateFindIndex('DECREMENT');
				} else {
					updateFindIndex('INCREMENT');
				}
			}
		},
		[updateFindIndex]
	);

	const replaceSingle = useCallback((findText, replaceText, blockKey, start, editorState) => {
		const contentState = editorState.getCurrentContent();
		const contentBlock = contentState.getBlockForKey(blockKey);
		const entityKey = contentBlock.getEntityAt(start);

		// Find content block with block key
		// Find the entity at the start index
		// On content state, get the entity for the entity key
		// Somehow apply this entity to the new selection

		// Lets grab the initial selection state and reset it when we're done
		const emptySelectionState = SelectionState.createEmpty();
		const selectionState = emptySelectionState.merge({
			anchorKey: blockKey, // Starting block (position is the start)
			anchorOffset: start, // How much to adjust from the starting position
			focusKey: blockKey, // Ending position (position is the start)
			focusOffset: start + findText.length,
		});

		const newContentState = Modifier.replaceText(contentState, selectionState, replaceText);

		// If we have an entity, apply that entity to the new text
		let contentStateWithLink;
		if (entityKey !== null) {
			const selectionStateForEntity = emptySelectionState.merge({
				anchorKey: blockKey,
				anchorOffset: start,
				focusKey: blockKey,
				focusOffset: start + replaceText.length,
			});

			contentStateWithLink = Modifier.applyEntity(
				newContentState,
				selectionStateForEntity,
				entityKey
			);
		}

		const newEditorState = EditorState.push(
			editorState,
			contentStateWithLink ? contentStateWithLink : newContentState,
			'insert-characters'
		);

		return newEditorState;
	}, []);

	// Replace a single find match
	const handleReplaceSingle = useCallback(() => {
		if (
			findRegisterRef.current[findText.toLowerCase()] &&
			findRegisterRef.current[findText.toLowerCase()].length &&
			findIndex !== null
		) {
			// Finds the object to replace
			let findObject = findRegisterRef.current[findText.toLowerCase()][findIndex];

			const newEditorState = replaceSingle(
				findText,
				replaceText,
				findObject.blockKey,
				findObject.start,
				editorStateRef.current
			);
			setEditorStateRef.current(newEditorState);

			// If the replacement still matches our find, increment to the next index.
			if (findText.toLowerCase() === replaceText.toLowerCase()) {
				updateFindIndex('INCREMENT');
			}

			queueDecoratorUpdate(findText);
		}
	}, [findIndex, queueDecoratorUpdate, findText, replaceText]);

	const handleReplaceAll = useCallback(() => {
		let registerArray = [...findRegisterRef.current[findText.toLowerCase()]].reverse();

		let editorStateArray = [editorStateRef.current];
		// let newEditorState = { ...editorStateRef.current };
		for (let match of registerArray) {
			let newEditorState = replaceSingle(
				findText,
				replaceText,
				match.blockKey,
				match.start,
				editorStateArray[editorStateArray.length - 1]
			);
			editorStateArray.push(newEditorState);
		}

		if (registerArray.length) {
			setEditorStateRef.current(editorStateArray[editorStateArray.length - 1]);
		}
	}, [replaceText, findText]);

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
							findRegisterRef.current[e.target.value.toLowerCase()] = [];
							setFindText(e.target.value);
							setContextFindText(e.target.value);
						}}
						onKeyDown={handleInputEnter}
					/>
					<p className='find-containter-counter'>
						{findText && findRegisterRef.current[findText.toLowerCase()] && totalMatches
							? `${findIndex === null ? 1 : findIndex + 1} of ${totalMatches}`
							: '0 matches'}
					</p>
					<div className='find-container-svg' onClick={() => updateFindIndex('DECREMENT')}>
						<CaratDownSVG rotate='90' />
					</div>
					<div className='find-container-svg' onClick={() => updateFindIndex('INCREMENT')}>
						<CaratDownSVG rotate='-90' />
					</div>
					<div
						className='find-container-svg'
						onClick={() => {
							setContextFindText('');
							setShowFindReplace(false);
						}}>
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
						<button className='find-container-replace-button' onClick={handleReplaceAll}>
							Replace All
						</button>
					</div>
				</Collapse>
			</div>
		</div>
	);
};

export default EditorFindReplace;
