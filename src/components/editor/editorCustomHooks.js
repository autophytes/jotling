import { useEffect, useState, useContext, useCallback } from 'react';
import { defaultDecorator, generateDecorators } from './editorFunctions';

import { LeftNavContext } from '../../contexts/leftNavContext';
import { FindReplaceContext } from '../../contexts/findReplaceContext';

export const useDecorator = (currentDoc) => {
	const [showAllTags, setShowAllTags] = useState(false);
	const [decorator, setDecorator] = useState(defaultDecorator);

	const { linkStructureRef, editorStyles } = useContext(LeftNavContext);
	const { findText } = useContext(FindReplaceContext);

	// Break out our showAllTags flag
	useEffect(() => {
		if (editorStyles.showAllTags !== showAllTags) {
			setShowAllTags(editorStyles.showAllTags);
		}
	}, [editorStyles, showAllTags]);

	useEffect(() => {
		console.log('updating decorator');

		let newDecorator;
		if (showAllTags || findText) {
			newDecorator = generateDecorators(
				linkStructureRef.current,
				currentDoc,
				showAllTags,
				findText
			);
		} else {
			newDecorator = defaultDecorator;
		}

		setDecorator(newDecorator);
	}, [showAllTags, currentDoc, findText]);

	// TO-DO
	// Open the find box
	// Cycle through the results
	// Replace the results
	// Debounce the decorator updates - make sure the user has paused typing
	const queueDecoratorUpdate = useCallback(() => {
		if (linkId !== null && prevDecoratedText !== decoratedText) {
			// Remove any queued updates to linkStructure
			if (queuedTimeout) {
				clearTimeout(queuedTimeout);
			}

			// Queue an update to linkStructure with the updated text
			const newTimeout = setTimeout(() => {
				let newLinkStructure = { ...linkStructureRef.current };
				newLinkStructure.links[linkId][linkPropName] = getAllEntityContent(
					editorStateRef,
					blockKey,
					start,
					end
				);
				// getAllEntityContent(editorStateRef, blockKey, start, end);
				setLinkStructure({ ...newLinkStructure });
			}, 500);

			// Save the timeout (for potential clearing on changes)
			setQueuedTimeout(newTimeout);
			// Update the text we've queued updates for
			setPrevDecoratedText(decoratedText);
		}
	});

	return decorator;
};
