import { EditorState, SelectionState, Modifier } from 'draft-js';

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
