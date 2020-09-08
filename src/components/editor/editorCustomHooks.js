import { useEffect, useState, useContext } from 'react';
import { defaultDecorator, generateDecoratorWithTagHighlights } from './editorFunctions';

import { LeftNavContext } from '../../contexts/leftNavContext';

export const useDecorator = (currentDoc) => {
	const [showAllTags, setShowAllTags] = useState(false);
	const [decorator, setDecorator] = useState(defaultDecorator);

	const { linkStructureRef, editorStyles } = useContext(LeftNavContext);

	// Break out our showAllTags flag
	useEffect(() => {
		if (editorStyles.showAllTags !== showAllTags) {
			setShowAllTags(editorStyles.showAllTags);
		}
	}, [editorStyles, showAllTags]);

	useEffect(() => {
		console.log('updating decorator');

		let newDecorator;
		if (showAllTags) {
			newDecorator = generateDecoratorWithTagHighlights(linkStructureRef.current, currentDoc);
		} else {
			newDecorator = defaultDecorator;
		}

		setDecorator(newDecorator);
	}, [showAllTags, currentDoc]);

	return decorator;
};
