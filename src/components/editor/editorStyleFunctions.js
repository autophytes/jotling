import React from 'react';
import {
	RichUtils,
	EditorState,
	SelectionState,
	Modifier,
	DefaultDraftBlockRenderMap,
} from 'draft-js';
import Immutable from 'immutable';

import { WikiSectionTitle } from './editorComponents/WikiSectionTitle';

import { setBlockData, getSelectedBlocksList } from 'draftjs-utils';

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
	setEditorState(RichUtils.toggleBlockType(editorState, blockType));
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

	if (currentAlignment !== newAlignment) {
		setEditorState(setBlockData(editorState, { 'text-align': newAlignment }));
	} else {
		setEditorState(setBlockData(editorState, { 'text-align': undefined }));
	}
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
	setDocStructure
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
	console.log('blocks selected: ', selectedBlocks.size);
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
	if (!isEntireSelectionCurrentColor) {
		contentState = Modifier.applyInlineStyle(
			contentState,
			selectionState,
			`${styleName.toUpperCase()}-${color}`
		);
	}

	const newEditorState = EditorState.push(editorState, contentState, 'change-inline-style');
	setEditorState(newEditorState);
	// DONE Need to generate a customStyleMap off of the customStyles in the docStructure

	// Function that takes in the editorState, highlight/textColor, color itself
	// Ensure the type is in the style map. If not, add it.
	// List of all the applied styles for the selection
	// If the entire selection is the new color we're applying, toggle off the highlight.

	// Remove all highlight styles
	// Apply the new highlight style
};
