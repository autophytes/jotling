import { useEffect, useState, useContext, useCallback } from 'react';
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
// Debounce the decorator updates - make sure the user has paused typing

export const useDecorator = (currentDoc) => {
	const [showAllTags, setShowAllTags] = useState(false);
	const [decorator, setDecorator] = useState(defaultDecorator);
	const [queuedUpdate, setQueuedUpdate] = useState(null);

	const { linkStructureRef, editorStyles } = useContext(LeftNavContext);
	const { findText } = useContext(FindReplaceContext);

	// Break out our showAllTags flag
	useEffect(() => {
		if (editorStyles.showAllTags !== showAllTags) {
			setShowAllTags(editorStyles.showAllTags);
		}
	}, [editorStyles, showAllTags]);

	const queueDecoratorUpdate = useCallback(
		(currentDoc, showAllTags, findText) => {
			// Remove any queued updates to linkStructure
			clearTimeout(queuedUpdate);

			// Queue an update to linkStructure with the updated text
			const newTimeout = setTimeout(() => {
				setDecorator(
					generateDecorators(linkStructureRef.current, currentDoc, showAllTags, findText)
				);
			}, 5000);

			// Save the timeout (for potential clearing on changes)
			setQueuedUpdate(newTimeout);
		},
		[queuedUpdate]
	);

	useEffect(() => {
		console.log('updating decorator');

		if (!findText && showAllTags) {
			setDecorator(
				generateDecorators(linkStructureRef.current, currentDoc, showAllTags, findText)
			);
		} else if (showAllTags || findText) {
			queueDecoratorUpdate(currentDoc, showAllTags, findText);
		} else {
			setDecorator(defaultDecorator);
		}
	}, [showAllTags, currentDoc, findText]);

	return decorator;
};
