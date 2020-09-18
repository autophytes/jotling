import React, { useContext, useEffect, useState, useRef } from 'react';
import { Modifier, SelectionState, EditorState } from 'draft-js';

import { FindReplaceContext } from '../../../contexts/findReplaceContext';
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

const FindReplaceDecorator = ({ children, decoratedText, blockKey, start, end }) => {
	// STATE
	const [isCurrentResult, setIsCurrentResult] = useState(false);
	const [prev, setPrev] = useState({});

	// CONTEXT
	const {
		findRegisterRef,
		findIndex,
		queueDecoratorUpdate,
		queueIncrement,
		replaceSingleQueue,
		resetReplaceAll,
		replaceText,
		setFindIndex,
		totalMatches,
		replaceAll,
		replaceAllCharacterOffsetRef,
	} = useContext(FindReplaceContext);
	const { setEditorStateRef, editorStateRef } = useContext(LeftNavContext);

	// REFS
	const decoratorRef = useRef(null);

	useEffect(() => {
		if (
			prev.blockKey !== blockKey ||
			prev.start !== start ||
			prev.decoratedText !== decoratedText
		) {
			let registerArray = [...findRegisterRef.current[decoratedText.toLowerCase()].array];
			const updatedMatch = { blockKey, start };

			let matchIndex = registerArray.findIndex(
				(item) => item.blockKey === prev.blockKey && item.start === prev.start
			);

			// If our current block is aready in the array, update it
			if (matchIndex !== -1) {
				registerArray.splice(matchIndex, 1, updatedMatch);
				// If it's not in the array, find where to insert it
			} else {
				let blockMap = editorStateRef.current.getCurrentContent().getBlockMap();
				let blockKeyOrder = [...blockMap.keys()];

				let matchingBlockKeyIndex = registerArray.findIndex(
					(item) => item.blockKey === blockKey
				);
				// If we found a block with a MATCHING BLOCK KEY
				if (matchingBlockKeyIndex !== -1) {
					// If that block is AFTER ours, insert it before
					if (registerArray[matchingBlockKeyIndex].start > start) {
						// Insert our updatedMatch
						registerArray.splice(matchingBlockKeyIndex, 0, updatedMatch);
					} else {
						// Otherwise, check blocks after until find a new blockKey OR the start is after ours
						let foundMatch = false;
						while (!foundMatch && matchingBlockKeyIndex <= registerArray.length - 1) {
							// If find a new blockKey OR the start is after ours
							if (
								registerArray[matchingBlockKeyIndex].blockKey !== blockKey ||
								registerArray[matchingBlockKeyIndex].start > start
							) {
								// Insert our updatedMatch
								registerArray.splice(matchingBlockKeyIndex, 0, updatedMatch);
								foundMatch = true;
							} else {
								matchingBlockKeyIndex += 1;
							}
						}
						// If we hit the end of the array, just push it onto the end
						if (!foundMatch) {
							registerArray.push(updatedMatch);
						}
					}
					// If we found NO MATCHING BLOCK KEY
				} else {
					// Find where the next block is in the block order
					let blockKeyIndex = blockKeyOrder.findIndex((item) => item === blockKey) + 1;
					if (blockKeyIndex === 0) {
						console.error('Our block key was NOT found in the blockKeyOrder array.');
						return;
					}

					// Check if that next block has a match. If so, inject our updatedMatch before it.
					let foundMatch = false;
					while (!foundMatch && blockKeyIndex <= blockKeyOrder.length - 1) {
						let nextBlockIndex = registerArray.findIndex(
							(item) => item.blockKey === blockKeyOrder[blockKeyIndex]
						);
						if (nextBlockIndex !== -1) {
							registerArray.splice(nextBlockIndex, 0, updatedMatch);
							foundMatch = true;
						}
						blockKeyIndex += 1;
					}

					if (!foundMatch) {
						registerArray.push(updatedMatch);
					}
				}
			}

			console.log('register array: ', registerArray);

			findRegisterRef.current[decoratedText.toLowerCase()].array = [...registerArray];
			setPrev({ blockKey, start, decoratedText });
			queueDecoratorUpdate(decoratedText);
			// queueIncrement();
		}
	}, [decoratedText, blockKey, start, prev]);

	// Check if the decorator is the current result
	useEffect(() => {
		if (findIndex !== null) {
			let findObject = findRegisterRef.current[decoratedText.toLowerCase()].array[findIndex];

			if (findObject.blockKey === blockKey && findObject.start === start) {
				// This is the current find result
				setIsCurrentResult(true);
			} else {
				setIsCurrentResult(false);
			}
		} else {
			setIsCurrentResult(false);
		}
		// When total matches changes, we need to re-check if we're the new current result
	}, [findIndex, decoratedText, blockKey, start, totalMatches]);

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

	// Replace - single && replace all
	useEffect(() => {
		if ((replaceSingleQueue && replaceSingleQueue[`${blockKey}-${start}`]) || replaceAll) {
			let localStart = start;
			let localEnd = end;

			// If replacing all with text of a different length, adjust the start/end indexes.
			if (replaceAll && replaceAllCharacterOffsetRef.current[blockKey]) {
				localStart += replaceAllCharacterOffsetRef.current[blockKey];
				localEnd += replaceAllCharacterOffsetRef.current[blockKey];
			}

			// Lets grab the initial selection state and reset it when we're done
			const selectionState = SelectionState.createEmpty();
			const newSelectionState = selectionState.merge({
				anchorKey: blockKey, // Starting block (position is the start)
				anchorOffset: localStart, // How much to adjust from the starting position
				focusKey: blockKey, // Ending position (position is the start)
				focusOffset: localEnd,
			});

			const contentState = editorStateRef.current.getCurrentContent();
			const newContentState = Modifier.replaceText(
				contentState,
				newSelectionState,
				replaceText
			);

			const newEditorState = EditorState.push(
				editorStateRef.current,
				newContentState,
				'insert-characters'
			);

			editorStateRef.current = newEditorState;
			setEditorStateRef.current(newEditorState);

			// If we have changed the match, we need to update any subsequent matches in the block and remove
			//   this one from the match registerArray.
			if (replaceText.toLowerCase() !== decoratedText.toLowerCase()) {
				// Copy the array of all matches
				let registerArray = [...findRegisterRef.current[decoratedText.toLowerCase()].array];
				const originalLength = registerArray.length;

				// Remove the replaced match and any AFTER it in that same block
				const updateRemoveIndex = () =>
					registerArray.findIndex((item) => item.blockKey === blockKey && item.start >= start);
				let removeIndex = updateRemoveIndex();
				while (removeIndex !== -1) {
					registerArray.splice(removeIndex, 1);
					removeIndex = updateRemoveIndex();
				}

				// If we replaced the last match, select the first match
				if (findIndex && findIndex === originalLength - 1) {
					setFindIndex(0);
				}
				// Replace our register array with the new array
				findRegisterRef.current[decoratedText.toLowerCase()].array = [...registerArray];
			}

			if (replaceAll) {
				// Register an offset for later text matches in the block
				if (replaceText.length - decoratedText.length) {
					// If the offset has already been initialized, increment it
					if (replaceAllCharacterOffsetRef.current[blockKey]) {
						replaceAllCharacterOffsetRef.current[blockKey] +=
							replaceText.length - decoratedText.length;
					} else {
						// Otherwise, set the initial offset
						replaceAllCharacterOffsetRef.current[blockKey] =
							replaceText.length - decoratedText.length;
					}
				}
				// Resets the replaceAll text after a debounce
				resetReplaceAll();
			}
		}
	}, [replaceSingleQueue, replaceText, blockKey, start, findIndex, replaceAll, decoratedText]); // INCLUDE blockKey && start

	return (
		<span
			ref={decoratorRef}
			style={{ backgroundColor: isCurrentResult ? '#FFA500' : '#FFFF00' }}>
			{children}
		</span>
	);
};

export { FindReplaceDecorator };
