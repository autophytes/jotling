import {
	RichUtils,
	EditorState,
	SelectionState,
	Modifier,
	DefaultDraftBlockRenderMap,
} from 'draft-js';
import Immutable from 'immutable';

import { setBlockData, getSelectedBlocksList } from 'draftjs-utils';
import { forEachBlockInSelection, getBlocksForSelection } from '../../utils/draftUtils';
import { BlockImageContainer } from './editorComponents/BlockImageContainer';
import { selectionInMiddleOfStylePrefix } from './editorFunctions';

export const defaultCustomStyleMap = {
	STRIKETHROUGH: {
		textDecoration: 'line-through',
	},
	SUBSCRIPT: {
		// LINE HEIGHT ISSUES. FIX LATER.
		verticalAlign: 'sub',
		fontSize: '60%',
	},
	SUPERSCRIPT: {
		// LINE HEIGHT ISSUES. FIX LATER.
		verticalAlign: 'super',
		fontSize: '60%',
	},
};

// Define our custom blocks and merge with the default blocks
// const blockRenderMap = Immutable.Map({
// 	'wiki-section': {
// 		element: 'div',
// 		wrapper: <WikiSectionTitle />,
// 	},
// });
// export const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);

// Add custom style properties to the customStyleMap
export const updateCustomStyleMap = (customStyles) => {
	let customStyleMap = JSON.parse(JSON.stringify(defaultCustomStyleMap));

	// HIGHLIGHT
	if (customStyles.highlight && customStyles.highlight.length) {
		for (let hexColor of customStyles.highlight) {
			customStyleMap[`HIGHLIGHT-${hexColor}`] = {
				backgroundColor: 'inherit',
				backgroundColor: hexColor,
			};
		}
	}

	// TEXT COLOR
	if (customStyles.textColor && customStyles.textColor.length) {
		for (let hexColor of customStyles.textColor) {
			customStyleMap[`TEXTCOLOR-${hexColor}`] = { color: hexColor };
		}
	}

	console.log('customStyleMap: ', customStyleMap);

	return customStyleMap;
};

// Applies classes to certain blocks
export const blockStyleFn = (block) => {
	// If the block data for a text-align property, add a class
	const blockData = block.getData();
	if (blockData) {
		let blockClass = '';

		const blockAlignment = blockData.get('text-align');
		if (blockAlignment) {
			blockClass = `${blockAlignment}-aligned-block`;
		}

		return blockClass;
	}

	return '';
};

// I'll use this and the one above in my EditorNav buttons
export const toggleInlineStyle = (
	e,
	inlineStyle,
	removeStyle,
	editorState,
	setEditorState
) => {
	!!e && e.preventDefault();

	// Toggle the style to add
	let newEditorState = RichUtils.toggleInlineStyle(editorState, inlineStyle);

	// Remove a style if needed (ex: when adding subscript, remove superscript)
	if (removeStyle) {
		newEditorState = RichUtils.toggleInlineStyle(newEditorState, inlineremoveStyleStyle);
	}

	// If the command was handled, set the editorState
	if (newEditorState) {
		setEditorState(newEditorState);
	}
};

// I'll use this and the one below in my EditorNav buttons
export const toggleBlockType = (e, blockType, editorState, setEditorState) => {
	e.preventDefault();

	// Used to reset the selection after the updates
	const initialSelection = editorState.getSelection();

	// Update the block type
	const newEditorState = RichUtils.toggleBlockType(editorState, blockType);

	// Set the selection back to the initial selection
	const finalEditorState = EditorState.forceSelection(newEditorState, initialSelection);

	setEditorState(finalEditorState);
};

// Handles Text Alignment
export const toggleTextAlign = (
	e,
	newAlignment,
	currentAlignment,
	editorState,
	setEditorState
) => {
	e.preventDefault();

	let newContentState = editorState.getCurrentContent();
	const emptySelectionState = SelectionState.createEmpty();

	// Used to reset the selection after the updates
	const initialSelection = editorState.getSelection();

	// Loop through each selected block
	forEachBlockInSelection(editorState, (block) => {
		// Pull the existing data
		const data = block.getData();

		// Update the data with the alignment
		const alignData = Immutable.Map({
			'text-align': currentAlignment !== newAlignment ? newAlignment : undefined,
		});
		const newData = data.merge(alignData);

		// Select the block to update
		const blockSelectionState = emptySelectionState.merge({
			anchorKey: block.getKey(),
			anchorOffset: 0,
			focusKey: block.getKey(),
			focusOffset: block.getLength(),
		});

		// Update the block data
		newContentState = Modifier.setBlockData(newContentState, blockSelectionState, newData);
	});

	const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');

	// Reset the selection to the initial selection
	const finalEditorState = EditorState.forceSelection(newEditorState, initialSelection);

	setEditorState(finalEditorState);
};

// CURRENTLY UNUSED
export const toggleBlockStyle = (e, blockStyle, editorState, setEditorState) => {
	e.preventDefault();

	// Gets the starting and ending cursor locations (keys)
	const anchorKey = editorState.getSelection().getAnchorKey();
	const focusKey = editorState.getSelection().getFocusKey();

	// Selects the ending block
	const focusBlock = editorState.getCurrentContent().getBlockForKey(focusKey);

	// Create a new selection state to add our selection to
	const selectionState = SelectionState.createEmpty();
	const entireBlockSelectionState = selectionState.merge({
		anchorKey: anchorKey, // Starting position
		anchorOffset: 0, // How much to adjust from the starting position
		focusKey: focusKey, // Ending position
		focusOffset: focusBlock.getText().length, // How much to adjust from the ending position.
	});

	// Creates a new EditorState to style
	const newEditorState = EditorState.forceSelection(editorState, entireBlockSelectionState);

	// Sets the editor state to our new
	setEditorState(RichUtils.toggleInlineStyle(newEditorState, blockStyle));
};

export const toggleTextCustomStyle = (
	e,
	color,
	styleName,
	editorState,
	setEditorState,
	setDocStructure,
	removeOnly = ''
) => {
	e.preventDefault();

	// Update the list of styleName colors used.
	setDocStructure((docStructure) => {
		let newDocStructure = JSON.parse(JSON.stringify(docStructure));

		// Ensure customStyles and styleName exist
		// And I quote: "cryogi humbly defers to the superior coding chops of Autophytes"
		!newDocStructure.customStyles && (newDocStructure.customStyles = {});
		!newDocStructure.customStyles[styleName] && (newDocStructure.customStyles[styleName] = []);

		// If the color is already in the style map, no changes
		if (newDocStructure.customStyles[styleName].includes(color)) {
			return docStructure;
		}

		// Add the new color
		let newStyleColors = [...newDocStructure.customStyles[styleName]];
		newStyleColors.push(color);
		newDocStructure.customStyles[styleName] = newStyleColors;

		return newDocStructure;
	});

	const selectionState = editorState.getSelection();

	let usedStyleSet = new Set();
	let isEntireSelectionCurrentColor = true;
	const fullStyleName = `${styleName.toUpperCase()}-${color}`;

	// Accumulate all styles from all characters in the selection
	const start = selectionState.getStartOffset();
	const end = selectionState.getEndOffset();
	const selectedBlocks = getSelectedBlocksList(editorState);
	if (selectedBlocks.size > 0) {
		// Loop through each block
		for (let i = 0; i < selectedBlocks.size; i += 1) {
			// If the first block, start at the selection start. Otherwise, 0.
			let blockStart = i === 0 ? start : 0;

			// If the last block, use the selection end. Otherwise, full block length.
			let blockEnd =
				i === selectedBlocks.size - 1 ? end : selectedBlocks.get(i).getText().length;

			// If selection is collapsed, don't run for block.
			if (blockStart !== blockEnd) {
				// Loop through each character
				for (let j = blockStart; j < blockEnd; j += 1) {
					const inlineStylesAtOffset = selectedBlocks.get(i).getInlineStyleAt(j).toSet();
					// At first character that doesn't have the style, enable adding the new color
					if (isEntireSelectionCurrentColor && !inlineStylesAtOffset.has(fullStyleName)) {
						isEntireSelectionCurrentColor = false;
					}

					inlineStylesAtOffset.forEach((item) => usedStyleSet.add(item));
				}
			}
		}
	}

	// Remove any colors of this style currently in the selection
	let contentState = editorState.getCurrentContent();
	for (let style of usedStyleSet) {
		if (style.slice(0, styleName.length + 1) === `${styleName.toUpperCase()}-`) {
			contentState = Modifier.removeInlineStyle(contentState, selectionState, style);
		}
	}

	// If all characters already have the color, don't apply. Let the remove above clear the color.
	if (!isEntireSelectionCurrentColor && removeOnly !== 'REMOVE') {
		contentState = Modifier.applyInlineStyle(
			contentState,
			selectionState,
			`${styleName.toUpperCase()}-${color}`
		);
	}

	const newEditorState = EditorState.push(editorState, contentState, 'change-inline-style');
	const finalEditorState = EditorState.forceSelection(newEditorState, selectionState);

	setEditorState(finalEditorState);
	// DONE Need to generate a customStyleMap off of the customStyles in the docStructure

	// Function that takes in the editorState, highlight/textColor, color itself
	// Ensure the type is in the style map. If not, add it.
	// List of all the applied styles for the selection
	// If the entire selection is the new color we're applying, toggle off the highlight.

	// Remove all highlight styles
	// Apply the new highlight style
};

export const blockRendererFn = (contentBlock) => {
	// if (contentBlock.getType() === 'wiki-section') {
	// 	return {
	// 		component: WikiSectionTitle,
	// 		editable: true,
	// 	};
	// }

	// NOT USING - was causing text issues
	// const blockData = contentBlock.getData();
	// if (blockData.has('linkDestId')) {
	// 	return {
	// 		component: LinkDestBlock,
	// 		editable: true,
	// 	};
	// }

	const imagesArray = contentBlock.getData().get('images', []);
	if (imagesArray.length) {
		return {
			component: BlockImageContainer,
			editable: true,
		};
	}
};

export const toggleTextComment = (
	commentId = 0,
	editorState,
	setEditorState,
	setCommentStructure,
	selection = null,
	removeOnly = ''
) => {
	const selectionState = selection ? selection : editorState.getSelection();
	const initialEditorState = EditorState.acceptSelection(editorState, selectionState);

	let usedStyleSet = new Set();
	const fullStyleName = `COMMENT-${commentId}`;

	// Accumulate all styles from all characters in the selection
	const start = selectionState.getStartOffset();
	const end = selectionState.getEndOffset();
	const selectedBlocks = getSelectedBlocksList(initialEditorState);
	if (selectedBlocks.size > 0) {
		// Loop through each block
		for (let i = 0; i < selectedBlocks.size; i += 1) {
			// If the first block, start at the selection start. Otherwise, 0.
			let blockStart = i === 0 ? start : 0;

			// If the last block, use the selection end. Otherwise, full block length.
			let blockEnd =
				i === selectedBlocks.size - 1 ? end : selectedBlocks.get(i).getText().length;

			// If selection is collapsed, don't run for block.
			if (blockStart !== blockEnd) {
				// Loop through each character
				for (let j = blockStart; j < blockEnd; j += 1) {
					const inlineStylesAtOffset = selectedBlocks.get(i).getInlineStyleAt(j).toSet();

					// Add the colors to the set
					inlineStylesAtOffset.forEach((item) => usedStyleSet.add(item));
				}
			}
		}
	}

	// Remove any comments currently in the selection
	let contentState = initialEditorState.getCurrentContent();
	console.log('usedStyleSet:', usedStyleSet);
	for (let style of usedStyleSet) {
		if (
			// style !== fullStyleName &&
			style.slice(0, 'COMMENT'.length + 1) === `COMMENT-`
		) {
			// For each style that we're removing, check the selection before/after ours
			// If this has our style, do nothing. If neither have it, remove from comment structure
			// Exempt the current fullStyleName

			const isContainedInSelection = selectionInMiddleOfStylePrefix(
				contentState,
				selectionState,
				style,
				true
			);

			console.log('isContainedInSelection:', isContainedInSelection);
			if (isContainedInSelection) {
				const commentId = Number(style.slice(-(style.length - 8)));
				setCommentStructure((prev) => {
					let newCommentStructure = {
						...prev,
						[commentId]: {
							...prev[commentId],
							shouldDelete: true,
						},
					};
					// delete newCommentStructure[commentId];

					return newCommentStructure;
				});
			}
			// If so, remove from commentStructure

			contentState = Modifier.removeInlineStyle(contentState, selectionState, style);
		}
	}

	// Apply the comment unless it's remove only
	if (removeOnly !== 'REMOVE') {
		console.log('selectionState:', selectionState);
		console.log('fullStyleName:', fullStyleName);
		contentState = Modifier.applyInlineStyle(contentState, selectionState, fullStyleName);
	}

	const newEditorState = EditorState.push(
		initialEditorState,
		contentState,
		'change-inline-style'
	);
	const finalEditorState = EditorState.forceSelection(newEditorState, selectionState);

	setEditorState(finalEditorState);
	// DONE Need to generate a customStyleMap off of the customStyles in the docStructure

	// Function that takes in the editorState, highlight/textColor, color itself
	// Ensure the type is in the style map. If not, add it.
	// List of all the applied styles for the selection
	// If the entire selection is the new color we're applying, toggle off the highlight.

	// Remove all highlight styles
	// Apply the new highlight style
};

// Returns a selectionState containing the entire comment for a given commentId
export const selectEntireComment = (commentId, startBlockKey, editorState) => {
	console.log('editorState:', editorState);
	console.log('startBlockKey:', startBlockKey);
	const contentState = editorState.getCurrentContent();
	const startingBlock = contentState.getBlockForKey(startBlockKey);

	const emptySelectionState = SelectionState.createEmpty();
	let newSelection = null;

	// First argument in the findStyleRanges functions
	const findCommentStyleRange = (character) => {
		const charStyles = character.getStyle();
		if (!charStyles || charStyles.size === 0) {
			return false;
		}
		return charStyles.find((value, key) => key === `COMMENT-${commentId}`);
	};

	// Pull the comment range in the starting block
	startingBlock.findStyleRanges(findCommentStyleRange, (start, end) => {
		// Build a selection state with our comment style range
		newSelection = emptySelectionState.merge({
			anchorKey: startBlockKey,
			anchorOffset: start,
			focusKey: startBlockKey,
			focusOffset: end,
		});
	});

	// Checking blocks BEFORE
	let startOffset = newSelection.getAnchorOffset();
	while (startOffset === 0) {
		// Grab the block before
		const beforeBlock = contentState.getBlockBefore(newSelection.getAnchorKey());
		if (!beforeBlock) {
			startOffset = 1;
			continue;
		}

		// Find the range of the same comment
		beforeBlock.findStyleRanges(findCommentStyleRange, (start, end) => {
			// Iterate on the starting selection, moving the start forward
			newSelection = newSelection.merge({
				anchorKey: beforeBlock.getKey(),
				anchorOffset: start,
			});
		});

		startOffset = newSelection.getAnchorOffset();

		// If there was no comment in the block, break the loop
		if (newSelection.getAnchorKey() !== beforeBlock.getKey()) {
			startOffset = 1;
		}
	}

	// Checking blocks AFTER
	let endOffset = newSelection.getFocusOffset();
	let endBlock = contentState.getBlockForKey(newSelection.getFocusKey());
	let isEndOfBlock = endBlock.getLength() === endOffset;
	while (isEndOfBlock) {
		// Grab the block after
		const afterBlock = contentState.getBlockAfter(newSelection.getFocusKey());
		if (!afterBlock) {
			isEndOfBlock = false;
			continue;
		}

		// Find the range of the same comment
		afterBlock.findStyleRanges(findCommentStyleRange, (start, end) => {
			// Iterate on the starting selection, moving the start forward
			newSelection = newSelection.merge({
				focusKey: afterBlock.getKey(),
				focusOffset: end,
			});
		});

		endOffset = newSelection.getFocusOffset();
		isEndOfBlock = afterBlock.getLength() === endOffset;

		// If there was no comment in the block, break the loop
		if (newSelection.getFocusKey() !== afterBlock.getKey()) {
			isEndOfBlock = false;
		}
	}

	return newSelection;
};

// Returns the first commentId in a text selection or null
export const findFirstCommentInSelection = (editorState) => {
	const selectionState = editorState.getSelection();
	const startBlockKey = selectionState.getStartKey();
	const endBlockKey = selectionState.getEndKey();

	// Loop through all blocks in the selection
	const blockArray = getBlocksForSelection(editorState);
	for (let block of blockArray) {
		const charList = block.getCharacterList();
		const blockKey = block.getKey();

		// Adust the starting and ending character index to use
		let startIndex = 0;
		let endIndex = charList.size - 1; // Note: if empty block, will be -1

		if (blockKey === startBlockKey) {
			startIndex = selectionState.getStartOffset();
		}
		if (blockKey === endBlockKey) {
			endIndex = selectionState.getEndOffset();
		}

		// Looping through the selected characters
		for (let i = startIndex; i < endIndex; i++) {
			if (!charList.size) {
				continue;
			}

			// Grab the styles on the character
			const character = charList.get(i);
			const charStyles = character.getStyle();
			if (!charStyles || charStyles.size === 0) {
				continue;
			}

			// If the character style contains a comment, return that commentId
			const commentStyle = charStyles.find((value, key) => key.slice(0, 8) === 'COMMENT-');
			if (commentStyle) {
				return {
					commentId: Number(commentStyle.slice(8)),
					blockKey: blockKey,
				};
			}
		}
	}

	// If no comment was found, return null
	return {
		commentId: null,
		blockKey: null,
	};
};
