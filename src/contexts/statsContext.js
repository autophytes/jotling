import React, { createContext, useEffect, useState } from 'react';
import { getAllBlockKeys, getBlockKeysForSelection } from '../utils/draftUtils';

export const StatsContext = createContext();

// CONSTANTS

// Project: 1,210 words added
// Project: 390 words removed
// Document: -300 net words

const StatsContextProvider = (props) => {
	// STATE
	const [origDocWordCountObj, setOrigDocWordCountObj] = useState({});
	const [docWordCountObj, setDocWordCountObj] = useState({});
	const [initDocWordCount, setInitDocWordCount] = useState(0);
	// const [sessionWordCount, setSessionWordCount] = useState(0);
	const [docsNetWordCountObj, setDocsNetWordCountObj] = useState({});

	// Updates the current doc's net word count
	const netOutDocWordCount = (newWordCountObj, origWordCountObj, currentDoc) => {
		const newDocTotal = Object.values(newWordCountObj).reduce((acc, val) => acc + val, 0);
		const origDocTotal = Object.values(origWordCountObj).reduce((acc, val) => acc + val, 0);

		// setDocWordCount(newDocTotal - origDocTotal);
		setDocsNetWordCountObj((prev) => ({
			...prev,
			[currentDoc]: newDocTotal - origDocTotal + initDocWordCount,
		}));
	};

	// Does a final word count on the current doc, then moves the net to the sessionWordCount
	const finalizeDocWordCount = (editorState, currentDoc) => {
		// Call one final update of the doc word count, return that obj (don't set)
		const newDocWordCountObj = getEditorStateWordCount(editorState);

		netOutDocWordCount(newDocWordCountObj, origDocWordCountObj, currentDoc);

		setOrigDocWordCountObj({});
		setDocWordCountObj({});
	};

	// On new document load, set the base and current docWordCountObj's
	/**
	 * Initialize a document
	 * @param {*} editorState - a valid editor State
	 * @param {string} currentDoc - the name of the current doc
	 */
	const initializeDocWordCount = (editorState, currentDoc) => {
		const newDocWordCountObj = getEditorStateWordCount(editorState);

		setOrigDocWordCountObj(newDocWordCountObj);
		setDocWordCountObj(newDocWordCountObj);

		setInitDocWordCount(docsNetWordCountObj[currentDoc] ? docsNetWordCountObj[currentDoc] : 0);
	};

	const updateWordCount = (editorStateRef, origEditorState, currentDoc, option) => {
		const contentState = editorStateRef.current.getCurrentContent();
		let keyArray = [];

		// Start with all blockKeys in the selection. All options except 'update-all' start from this.
		if (option !== 'update-all') {
			keyArray = getBlockKeysForSelection(origEditorState);
		}

		// Handle any options we were passed
		if (option) {
			const origContentState = origEditorState.getCurrentContent();
			const origSelection = origEditorState.getSelection();
			let extraKey = null;

			if (option === 'add-block-to-end') {
				// Check block after too (needed if deleting at end of block)
				extraKey = origContentState.getKeyAfter(origSelection.getEndKey());
			}
			if (option === 'add-block-to-start') {
				// Check block before too (needed if backspacing at start of block)
				extraKey = origContentState.getKeyBefore(origSelection.getStartKey());
			}
			if (option === 'add-new-end-block') {
				// Check if the new ending block was newly created (split-block)
				extraKey = contentState.getKeyBefore(
					editorStateRef.current.getSelection().getEndKey()
				);
			}
			if (option === 'update-all') {
				// Check all unique block keys from before and after the change
				let allOrigBlocks = getAllBlockKeys(origContentState);
				let allNewBlocks = getAllBlockKeys(contentState);

				keyArray = Array.from(new Set([...allOrigBlocks, ...allNewBlocks]));
			}

			// If we added a key, push it to the array
			if (extraKey) {
				keyArray.push(extraKey);
			}
		}

		// Find the word count for each blockKey
		let newWordCountObj = {};
		for (let blockKey of keyArray) {
			let words = countWordsInBlock(contentState.getBlockForKey(blockKey));
			newWordCountObj[blockKey] = words;
		}

		setDocWordCountObj((prev) => {
			const newObj = {
				...prev,
				...newWordCountObj,
			};

			netOutDocWordCount(newObj, origDocWordCountObj, currentDoc);

			return newObj;
		});
	};

	return (
		<StatsContext.Provider
			value={{
				docWordCountObj,
				docsNetWordCountObj,
				finalizeDocWordCount,
				initializeDocWordCount,
				updateWordCount,
			}}>
			{props.children}
		</StatsContext.Provider>
	);
};

export default StatsContextProvider;

// Counts the words in an individual block. Used in updateWordCount.
const countWordsInBlock = (block) => {
	// If block no longer exists, return 0;
	if (!block) {
		return 0;
	}

	let blockText = block.getText();

	// Trim off ending spaces
	while (blockText.slice(-1) === ' ') {
		blockText = blockText.slice(0, -1);
	}

	// Count the space chunks (multiple spaces counts as 1) in the block
	let spaces = 0;
	for (let i in blockText) {
		if (blockText[i] === ' ' && i && blockText[i - 1] !== ' ') {
			spaces++;
		}
	}

	// Add 1 to represent the first word of the block.
	if (blockText.length) {
		spaces++;
	}

	return spaces;
};

// Get the total word count of the current document
const getEditorStateWordCount = (editorState) => {
	const contentState = editorState.getCurrentContent();
	const keyArray = getAllBlockKeys(contentState);

	// Find the word count for each blockKey
	let newWordCountObj = {};
	for (let blockKey of keyArray) {
		let words = countWordsInBlock(contentState.getBlockForKey(blockKey));
		newWordCountObj[blockKey] = words;
	}

	return newWordCountObj;
};
