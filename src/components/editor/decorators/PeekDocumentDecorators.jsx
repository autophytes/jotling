import React, { useRef, useEffect } from 'react';

import { CompositeDecorator } from 'draft-js';

const PeekHighlightDecorator = (props) => {
	const highlightRef = useRef(null);

	// useEffect(() => {
	// 	const rect = highlightRef.current.getBoundingClientRect();
	// 	console.log(rect);
	// 	const peekWindow = document.getElementById('peek-window');
	// 	const windowRect = peekWindow.getBoundingClientRect();

	// 	peekWindow.scrollTo({ top: rect.top - windowRect.top - 100, behavior: 'smooth' });

	// 	// highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
	// }, []);

	return (
		<span
			ref={highlightRef}
			style={{ backgroundColor: '#FFFF00' }}
			className='peek-window-highlight-decorator'>
			{props.children}
		</span>
	);
};

const getPeekStrategy = (sourceEntityKey) => {
	return function (contentBlock, callback, contentState) {
		contentBlock.findEntityRanges((character) => {
			const entityKey = character.getEntity();

			return entityKey === sourceEntityKey;
		}, callback);
	};
};

export const generatePeekDecorator = (sourceEntityKey) => {
	const newDecorator = new CompositeDecorator([
		{
			strategy: getPeekStrategy(sourceEntityKey),
			component: PeekHighlightDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
		},
	]);

	return newDecorator;
};
