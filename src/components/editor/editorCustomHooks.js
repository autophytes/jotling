import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { defaultDecorator, generateDecorators } from './editorFunctions';

import { LeftNavContext } from '../../contexts/leftNavContext';
import { FindReplaceContext } from '../../contexts/findReplaceContext';

// TO-DO
// Our queueDecoratorUpdate needs to be monitored by our useEffect to keep the function fresh,
//  but that is circular logic. May need to look into refs for this.
// Open the find box
// Cycle through the results
// Replace the results
// Make the useDecorator async (prevent keystroke lag for find/replace)
// Immediately only searching the on-screen text, then searching the rest?
// Debounce the decorator updates - make sure the user has paused typing

const findVisibleBlocks = (editorRef) => {
	const bottom = window.innerHeight;
	const blockElementList = editorRef.current.editor.children[0].children;

	let blockKeyList = [];
	// Iterate through each of our blocks
	for (let element of blockElementList) {
		let rect = element.getBoundingClientRect();
		// If the block is visible on screen
		if (rect.top < bottom && rect.bottom > 0) {
			// Extract the block key and add it to the list to return
			let offsetKey = element.dataset.offsetKey;
			let blockKey = offsetKey.slice(0, offsetKey.indexOf('-'));
			blockKeyList.push(blockKey);
		} else if (blockKeyList.length) {
			// If we had previous matches and are now off screen, return the list.
			// return blockKeyList;
			break;
		}
	}
	return blockKeyList;
};

export const useDecorator = (currentDoc, editorRef) => {
	const [showAllTags, setShowAllTags] = useState(false);
	const [decorator, setDecorator] = useState(defaultDecorator);

	const queuedUpdate = useRef(null);
	const visibleBlockKeys = useRef([]);

	const { linkStructureRef, editorStyles } = useContext(LeftNavContext);
	const { findText } = useContext(FindReplaceContext);

	// Break out our showAllTags flag
	useEffect(() => {
		if (editorStyles.showAllTags !== showAllTags) {
			setShowAllTags(editorStyles.showAllTags);
		}
	}, [editorStyles, showAllTags]);

	// Debounce our full page "find" decorator update
	const queueDecoratorUpdate = useCallback((currentDoc, showAllTags, findText) => {
		// Remove any queued updates to linkStructure
		clearTimeout(queuedUpdate.current);

		// Queue an update to linkStructure with the updated text
		queuedUpdate.current = setTimeout(() => {
			visibleBlockKeys.current = [];
			setDecorator(
				generateDecorators(linkStructureRef.current, currentDoc, showAllTags, findText)
			);
			console.log('DELAYED UPDATE is firing!');
		}, 500);

		// Save the timeout (for potential clearing on changes)
		// setQueuedUpdate(newTimeout);
	}, []);

	useEffect(() => {
		console.log('updating decorator');

		if (!findText && showAllTags) {
			setDecorator(
				generateDecorators(linkStructureRef.current, currentDoc, showAllTags, findText)
			);
		} else if (showAllTags || findText) {
			// On the first iteration, find the visible blocks
			if (!visibleBlockKeys.current.length) {
				visibleBlockKeys.current = findVisibleBlocks(editorRef);
			}

			// Immediately update the search results on the visible screen
			setDecorator(
				generateDecorators(
					linkStructureRef.current,
					currentDoc,
					showAllTags,
					findText,
					visibleBlockKeys.current
				)
			);
			// Delay the update of the rest of the search results
			queueDecoratorUpdate(currentDoc, showAllTags, findText);
		} else {
			setDecorator(defaultDecorator);
		}
	}, [showAllTags, currentDoc, findText, queueDecoratorUpdate]);

	return decorator;
};

// Get down in the element tree to our blocks
// Calculate the visible range of the document
// For each element, check the top offset relative to the document. In range, add key to array.
// Once the first (after successess) is off screen, stop.
// Hvae a non-debounced function
//   Pass a list of block keys to the generate decorators, only decorate those blocks
// After, have the debounced function do the full search and reset the block keys
