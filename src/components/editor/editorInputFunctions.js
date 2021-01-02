import { EditorState, SelectionState, Modifier } from 'draft-js';

// let _lastSelection = null;

let skipEditorStatesBeforeMS = null;

// // Save document selection changes if not collapsed
// export const handleSelectionChange = (e, editorRef) => {
// 	console.log('in handleSelectionChange:', Date.now() - skipEditorStatesBeforeMS);
// 	if (Date.now() - skipEditorStatesBeforeMS < 200) {
// 		console.log('trying to prevent');
// 		e.preventDefault();
// 		skipEditorStatesBeforeMS = null;
// 	}

// 	// let selection = document.getSelection();
// 	// console.log('selection:', selection);
// 	// // Note the triple click will need to be handled differently
// 	// // Also ensure we're only registering selection inside the editor

// 	// // Note this is a property of the document selection, not the selectionState function
// 	// if (!selection.isCollapsed) {
// 	// 	// Ensure the selection is in the editor
// 	// 	if (editorRef.current && editorRef.current.editor.contains(selection.focusNode)) {
// 	// 		_lastSelection = selection;
// 	// 	}
// 	// } else {
// 	// 	_lastSelection = null;
// 	// }
// };

// Updates the editorState with the browser's native selection
export const fetchCorrectSelection = (editorState, editorRef) => {
	// Fetch the documents native selection
	const docSelection = document.getSelection();
	console.log('docSelection:', docSelection);

	// Only modify the editorState if not collapsed and inside the editor
	if (
		docSelection.isCollapsed || // Not collapsed
		!editorRef.current || // No valid editorRef
		!editorRef.current.editor.contains(docSelection.focusNode) || // Selection not in editor
		typeof docSelection.focusOffset !== 'number' || // Invalid offset
		typeof docSelection.anchorOffset !== 'number' // Invalid offset
	) {
		return editorState;
	}

	// Returns the blockKey or FALSE if none found
	const findParentElementBlockKey = (startElement, initialOffset) => {
		let blockKey;
		let element = startElement;

		// Loop through parent nodes until the blockKey is found or no parents
		while (!blockKey && element) {
			// If this node doesn't contain the offsetKey (with the blockKey)
			if (!element.dataset || !element.dataset.offsetKey) {
				// If this is the last element, stop searching.
				if (!element.parentElement) {
					return { key: false, offset: false };
				}

				// Continue to the next parent
				element = element.parentElement;
				continue;
			}

			// If found an offsetKey, grab the blockKey
			if (
				typeof element.dataset.offsetKey === 'string' &&
				element.dataset.offsetKey.length > 5
			) {
				let extraOffset = 0;

				// If this isn't the first child node, the offset will be wrong.
				if (element.dataset.offsetKey.slice(-4) !== '-0-0') {
					const parentElement = element.parentElement;
					const childrenCollection = parentElement.children;

					let foundMatch = false;
					for (let i = 0; i < childrenCollection.length; i++) {
						if (childrenCollection.item(i) !== element) {
							// Until we find the selected element, add the prev. elements length
							extraOffset += childrenCollection.item(i).innerText
								? childrenCollection.item(i).innerText.length
								: 0;
						} else {
							foundMatch = true;
						}
					}

					if (!foundMatch) {
						return { key: false, offset: false };
					}
				}

				// Return the key and the new offset
				return {
					key: element.dataset.offsetKey.slice(0, 5),
					offset: initialOffset + extraOffset,
				};
			} else {
				// offsetKey didn't contain a valid key
				return { key: false, offset: false };
			}
		}
	};

	// Find the blockKey. If none found, return the unmodified editorState.
	const { key: anchorBlockKey, offset: anchorOffset } = findParentElementBlockKey(
		docSelection.anchorNode,
		docSelection.anchorOffset
	);
	if (!anchorBlockKey) {
		return editorState;
	}

	// Find the blockKey. If none found, return the unmodified editorState.
	const { key: focusBlockKey, offset: focusOffset } = findParentElementBlockKey(
		docSelection.focusNode,
		docSelection.focusOffset
	);
	if (!focusBlockKey) {
		return editorState;
	}

	// Determine if focus is before the anchor (thus, selection is backwards)
	let isBackward = focusOffset < anchorOffset;
	if (focusBlockKey !== anchorBlockKey) {
		const currentContent = editorState.getCurrentContent();
		const blockArray = currentContent.getBlocksAsArray();

		const focusIndex = blockArray.findIndex((block) => block.getKey() === focusBlockKey);
		const anchorIndex = blockArray.findIndex((block) => block.getKey() === anchorBlockKey);
		isBackward = focusIndex < anchorIndex;
	}

	// Lets grab the initial selection state and reset it when we're done
	const emptySelectionState = SelectionState.createEmpty();
	const selectionState = emptySelectionState.merge({
		anchorKey: anchorBlockKey,
		anchorOffset: anchorOffset,
		focusKey: focusBlockKey,
		focusOffset: focusOffset,
		hasFocus: true,
		isBackward: isBackward,
	});

	const newEditorState = EditorState.acceptSelection(editorState, selectionState);
	console.log('newEditorState selection:', newEditorState.getSelection());
	console.log('selectionState:', selectionState);

	return newEditorState;
};

export const manuallyHandleReplaceText = (editorState, char) => {
	const currentContent = editorState.getCurrentContent();
	const selection = editorState.getSelection();
	const entityKey = currentContent
		.getBlockForKey(selection.getStartKey())
		.getEntityAt(selection.getStartOffset());
	console.log('entityKey:', entityKey);

	const newContentState = Modifier.replaceText(
		currentContent,
		selection,
		char,
		editorState.getCurrentInlineStyle(),
		entityKey
	);

	// Lets grab the initial selection state and reset it when we're done
	const emptySelectionState = SelectionState.createEmpty();
	const newSelectionState = emptySelectionState.merge({
		anchorKey: selection.getAnchorKey(),
		anchorOffset: selection.getAnchorOffset() + 1,
		focusKey: selection.getAnchorKey(),
		focusOffset: selection.getAnchorOffset() + 1,
	});

	const newEditorState = EditorState.forceSelection(editorState, newSelectionState);
	console.log('final seleciton state: ', newEditorState.getSelection());

	const finalEditorState = EditorState.push(
		newEditorState,
		newContentState,
		'insert-characters'
	);

	skipEditorStatesBeforeMS = Date.now();
	console.log('skipEditorStatesBeforeMS set:', skipEditorStatesBeforeMS);

	return finalEditorState;
};

// Skip the late selection if we're overriding it
export const shouldSkipEditorState = () => {
	if (!skipEditorStatesBeforeMS) {
		return false;
	} else {
		const shouldSkip = Date.now() - skipEditorStatesBeforeMS < 200;
		console.log(
			'Date.now() - skipEditorStatesBeforeMS:',
			Date.now() - skipEditorStatesBeforeMS
		);
		// skipEditorStatesBeforeMS = null;
		return shouldSkip;
	}
};

// Converts '1. ', '* ', and '- ' to lists
export const spaceToAutoList = (editorState, setEditorState) => {
	// EVENTUAL TO-DOs
	//  If you add a '3. ' and the block immediately before it is '2. ', then make the list

	const currentSelection = editorState.getSelection();
	const currentPosition = currentSelection.getStartOffset();

	// If the 2nd or 3rd position (ignore spaces later in paragraphs)
	if (currentPosition === 1 || currentPosition === 2) {
		const blockKey = editorState.getSelection().getAnchorKey();
		const block = editorState.getCurrentContent().getBlockForKey(blockKey);
		const blockText = block.getText().slice(0, 2); // Just the first 2 characters of text

		// If all that is typed is one of our shortcuts
		if (blockText === '1.' || blockText.charAt(0) === '*' || blockText.charAt(0) === '-') {
			const blockType = block.getType();

			// And it's just a basic block type (not headers, lists, etc.)
			if (blockType === 'unstyled' || blockType === 'paragraph') {
				// Push the space (for the undo stack);
				const currentContent = editorState.getCurrentContent();
				const contentWSpace = Modifier.insertText(currentContent, currentSelection, ' ');
				const editorStateWSpace = EditorState.push(
					editorState,
					contentWSpace,
					'insert-characters'
				);

				// Clear out the typed text we're replacing for a list
				const selectionState = SelectionState.createEmpty();
				const entireBlockSelectionState = selectionState.merge({
					anchorKey: blockKey, // Starting block (position is the start)
					anchorOffset: 0, // How much to adjust from the starting position
					focusKey: blockKey, // Ending position (position is the start)
					focusOffset: currentPosition + 1, // We added the space, so add 1 to this.
				});
				const contentCleared = Modifier.removeRange(
					editorStateWSpace.getCurrentContent(),
					entireBlockSelectionState,
					'forward'
				);

				// Change the block type to the appropriate list
				let newBlockType = blockText === '1.' ? 'ordered-list-item' : 'unordered-list-item';
				const contentWList = Modifier.setBlockType(
					contentCleared,
					entireBlockSelectionState,
					newBlockType
				);
				const listEditorState = EditorState.push(
					editorStateWSpace,
					contentWList,
					'change-block-type'
				);

				// Move the cursor to the new list item
				const finalSelectionState = SelectionState.createEmpty(blockKey);
				const finalEditorState = EditorState.forceSelection(
					listEditorState,
					finalSelectionState
				);
				setEditorState(finalEditorState);
				return 'handled-in-binding-fn';
			}
		}
	}
	return false;
};

// Unindents empty list items when hitting the 'enter' key
export const enterToUnindentList = (editorState, setEditorState) => {
	const currentSelection = editorState.getSelection();
	const currentPosition = currentSelection.getStartOffset();

	// I suspect current position is quicker to access than the block text,
	//     so I use that to determine if I should go on.
	if (currentPosition === 0) {
		const blockKey = editorState.getSelection().getAnchorKey();
		const block = editorState.getCurrentContent().getBlockForKey(blockKey);
		const blockType = block.getType();
		const isListBlockType =
			blockType === 'unordered-list-item' || blockType === 'ordered-list-item';

		// If the block is a list
		if (isListBlockType) {
			const hasText = block.getText().length === 0;

			// And the block is empty
			if (hasText) {
				const blockDepth = block.getDepth();

				if (blockDepth > 0) {
					// Content Blocks are Immutable Map objects, with properties like depth
					//     as well as getters, setters, etc.
					const newBlock = block.set('depth', blockDepth - 1);
					const contentState = editorState.getCurrentContent();
					const blockMap = contentState.getBlockMap();
					const newBlockMap = blockMap.set(blockKey, newBlock);
					const newEditorState = EditorState.push(
						editorState,
						contentState.merge({ blockMap: newBlockMap }),
						'adjust-depth'
					);

					setEditorState(newEditorState);
					return 'handled-in-binding-fn';
				}
			}
		}
	}
	return false;
};

// Replace '-- ' with '– ' (a long dash vs two short)
export const doubleDashToLongDash = (editorState, setEditorState) => {
	const currentSelection = editorState.getSelection();
	const currentPosition = currentSelection.getStartOffset();
	const blockKey = currentSelection.getAnchorKey();

	// Ensure the previous 2 characters are '--'. If not, exit.
	const block = editorState.getCurrentContent().getBlockForKey(blockKey);
	const blockText = block.getText().slice(currentPosition - 2, currentPosition); // Just the first 2 characters of text
	if (blockText !== '--') {
		return;
	}

	// Push the new space (for the undo stack);
	const currentContent = editorState.getCurrentContent();
	const contentWSpace = Modifier.insertText(currentContent, currentSelection, ' ');
	const editorStateWSpace = EditorState.push(editorState, contentWSpace, 'insert-characters');

	// Clear out the typed text we're replacing for a list
	const selectionState = SelectionState.createEmpty(blockKey);
	const doubleDashSelectionState = selectionState.merge({
		anchorOffset: currentPosition - 2, // Capture the two dashes before the space we inserted
		focusOffset: currentPosition + 1, // We added the space, so add 1 to this.
	});

	// Replace the double dash with the long dash
	const longDashContent = Modifier.replaceText(
		editorStateWSpace.getCurrentContent(),
		doubleDashSelectionState,
		'– '
	);

	// Push it to a new editor state
	const longDashEditorState = EditorState.push(
		editorStateWSpace,
		longDashContent,
		'change-block-type'
	);

	// Move the cursor to the new list item
	const finalSelectionState = SelectionState.createEmpty(blockKey).merge({
		anchorOffset: currentPosition,
		focusOffset: currentPosition,
	});
	const finalEditorState = EditorState.forceSelection(
		longDashEditorState,
		finalSelectionState
	);

	setEditorState(finalEditorState);
	return 'handled-in-binding-fn';
};

// If adding a new line from the start/end of a wiki-section,
// change the new block to unstyled
export const checkWikiSectionSplitBlock = (editorState) => {
	const selection = editorState.getSelection();
	const currentContent = editorState.getCurrentContent();

	// If selecting the start of the block
	if (selection.getStartOffset() === 0) {
		const startBlockKey = selection.getStartKey();
		const startBlock = currentContent.getBlockForKey(startBlockKey);
		const blockType = startBlock.getType();

		// And the block type is a wiki-section, then change the first block to unstyled
		if (blockType === 'wiki-section') {
			// Split the block
			let newContentState = Modifier.splitBlock(currentContent, selection);

			// Selecting the block we're going to change the type of
			const blockToChange = newContentState.getBlockForKey(startBlockKey);
			const emptySelectionState = SelectionState.createEmpty();
			const blockToChangeSelection = emptySelectionState.merge({
				anchorKey: startBlockKey,
				anchorOffset: 0,
				focusKey: startBlockKey,
				focusOffset: blockToChange.getLength(),
			});

			// Change to unstyled
			newContentState = Modifier.setBlockType(
				newContentState,
				blockToChangeSelection,
				'unstyled'
			);

			// Select the final cursor position
			const newBlockKey = newContentState.getBlockAfter(startBlockKey).getKey();
			const finalSelection = emptySelectionState.merge({
				anchorKey: newBlockKey,
				anchorOffset: 0,
				focusKey: newBlockKey,
				focusOffset: 0,
			});

			// Push the block changes to the editorState
			const editorStateBeforeSelect = EditorState.push(
				editorState,
				newContentState,
				'split-block'
			);

			// Force the final selection
			return EditorState.forceSelection(editorStateBeforeSelect, finalSelection);
		}
	}

	// If selecting the end of the block
	const endBlock = currentContent.getBlockForKey(selection.getEndKey());
	if (
		endBlock.getType() === 'wiki-section' &&
		selection.getEndOffset() === endBlock.getLength()
	) {
		const endBlockKey = endBlock.getKey();

		// Split the block
		let newContentState = Modifier.splitBlock(currentContent, selection);

		// Selecting the block we're going to change the type of
		const blockToChange = newContentState.getBlockAfter(endBlockKey);
		const emptySelectionState = SelectionState.createEmpty();
		const blockToChangeSelection = emptySelectionState.merge({
			anchorKey: blockToChange.getKey(),
			anchorOffset: 0,
			focusKey: blockToChange.getKey(),
			focusOffset: 0,
		});

		// Change to unstyled
		newContentState = Modifier.setBlockType(
			newContentState,
			blockToChangeSelection,
			'unstyled'
		);

		// Push the block changes to the editorState
		const editorStateBeforeSelect = EditorState.push(
			editorState,
			newContentState,
			'split-block'
		);

		// Force the final selection
		return EditorState.forceSelection(editorStateBeforeSelect, blockToChangeSelection);
	}
	// If selecting the end of the block
	// wiki-section block
	// If the selection start is at the beginning
	// The original block needs to be converted to unstyled
	// or the selection end is at the end
	// The new block needs to be converted to unstyled
};

// Check the editor keyCommand to see if and how to update the word count.
export const checkCommandForUpdateWordCount = (command) => {
	const updateCommandOptions = [
		{ array: ['delete', 'delete-word'], option: 'add-block-to-end' },
		{
			array: ['backspace', 'backspace-word', 'backspace-to-start-of-line'],
			option: 'add-block-to-start',
		},
		// { array: ['undo', 'redo'], option: 'update-all' }, // Undo not triggering, redo can wait
		{ array: ['split-block'], option: 'add-new-end-block' },
	];

	for (let item of updateCommandOptions) {
		if (item.array.includes(command)) {
			return item.option;
		}
	}

	return null;
};

// Check if the selectionState ends on a newline character
export const removeEndingNewline = (editorState) => {
	// Only check if we need to update the selection if the selection isn't collapsed
	if (!editorState.getSelection().isCollapsed()) {
		const selectionState = editorState.getSelection();
		const start = selectionState.getStartOffset();
		const end = selectionState.getEndOffset();

		// If the start and end are 0, we need to update the end
		if (
			start === 0 &&
			end === 0 &&
			selectionState.getStartKey() !== selectionState.getEndKey()
		) {
			const endKey = selectionState.getEndKey();
			const newEndBlock = editorState.getCurrentContent().getBlockBefore(endKey);
			const newEndKey = newEndBlock.getKey();

			// Select the block to update the data for
			const emptySelectionState = SelectionState.createEmpty();
			const newSelectionState = emptySelectionState.merge({
				anchorKey: selectionState.getStartKey(),
				anchorOffset: 0,
				focusKey: newEndKey,
				focusOffset: newEndBlock.getLength(),
			});

			console.log('Updated selection - removed newline character from end.');
			return EditorState.forceSelection(editorState, newSelectionState);
		}
	}

	return editorState;
};

// If we're typing at the end of a line and inside a link, continue that link
export const continueMultiBlockLinkSource = (editorState, selection, char) => {
	const contentState = editorState.getCurrentContent();
	const blockKey = selection.getStartKey();
	const block = contentState.getBlockForKey(blockKey);
	const blockLength = block.getLength();

	// Note we've already ensured the selection is collapsed before calling the fn
	if (blockLength !== selection.getStartOffset()) {
		return 'not-handled';
	}

	const start = Math.max(selection.getStartOffset() - 1, 0);

	// Ensure the character before has an entity
	let startEntityKey = null;
	if (blockLength) {
		startEntityKey = block.getEntityAt(start);
	} else {
		const prevBlock = contentState.getBlockBefore(blockKey);
		if (prevBlock) {
			startEntityKey = prevBlock.getEntityAt(prevBlock.getLength() - 1);
		}
	}

	if (startEntityKey === null) {
		return 'not-handled';
	}

	// Ensuring we're typing at the end of the block
	const selectionEnd = selection.getEndOffset();
	if (blockLength !== selectionEnd) {
		return 'not-handled';
	}

	// Ensure the entity is a link source or dest
	const entity = contentState.getEntity(startEntityKey);
	if (entity && !['LINK-SOURCE', 'LINK-DEST'].includes(entity.getType())) {
		return 'not-handled';
	}

	// Ensure the next block starts with the same entity
	const nextBlock = contentState.getBlockAfter(blockKey);
	if (nextBlock && nextBlock.getEntityAt(0) !== startEntityKey) {
		return 'not-handled';
	}

	const style = editorState.getCurrentInlineStyle();
	const newContent = Modifier.insertText(contentState, selection, char, style, startEntityKey);

	console.log('handleBeforeInput - continuing link');
	const newEditorState = EditorState.push(editorState, newContent, 'insert-characters');
	setEditorState(newEditorState);
	return 'handled';
};
