import React, { useContext, useEffect, useState, useRef } from 'react';

import { FindReplaceContext } from '../../../contexts/findReplaceContext';

// PROPS INCLUDE
// blockKey: BlockNodeKey,
// children?: Array<React.Node>,
// contentState: ContentState,
// decoratedText: string,
// dir: ?HTMLDir,
// end: number,
// // Many folks mistakenly assume that there will always be an 'entityKey'
// // passed to a DecoratorComponent.
// // To find the `entityKey`, Draft calls
// // `contentBlock.getEntityKeyAt(leafNode)` and in many cases the leafNode does
// // not have an entityKey. In those cases the entityKey will be null or
// // undefined. That's why `getEntityKeyAt()` is typed to return `?string`.
// // See https://github.com/facebook/draft-js/blob/2da3dcb1c4c106d1b2a0f07b3d0275b8d724e777/src/model/immutable/BlockNode.js#L51
// entityKey: ?string,
// offsetKey: string,
// start: number,

const FindReplaceDecorator = ({ children, decoratedText, blockKey, start, end }) => {
	const [isCurrentResult, setIsCurrentResult] = useState(false);

	const { findRegisterRef, findIndex } = useContext(FindReplaceContext);

	const decoratorRef = useRef(null);

	useEffect(() => {
		let findRegister = findRegisterRef.current[decoratedText.toLowerCase()];

		// If the element was already there, remove to ensure the array is in the correct order
		// ISSUE: this is never matching.
		// ISSUE: our scroll is even scrolling through visible items
		if (findRegister.register[`${blockKey}-${start}`]) {
			let matchIndex = findRegister.array.findIndex(
				(item) => item.blockKey === blockKey && item.start === start
			);
			findRegister.array.splice(matchIndex, 1);
			console.log(`removed ${blockKey} ${start} from the array`);
		}

		let newArray = [...findRegister.array, { blockKey, start }];

		// Pushing the object into the array and updating the registers
		findRegister.array = newArray;
		findRegister.register[`${blockKey}-${start}`] = true;
		findRegister.blockList[blockKey] = true;

		console.log('findRegister.array: ', findRegister.array);
	}, [decoratedText, blockKey, start]);

	useEffect(() => {
		if (findIndex !== null) {
			let findObject = findRegisterRef.current[decoratedText.toLowerCase()].array[findIndex];

			if (findObject.blockKey === blockKey && findObject.start === start) {
				// This is the current find result
				setIsCurrentResult(true);
			} else {
				setIsCurrentResult(false);
			}
		}
	}, [findIndex, decoratedText, blockKey, start]);

	// If this is the highlighted match, scroll to it
	useEffect(() => {
		if (isCurrentResult) {
			let decoratorRect = decoratorRef.current.getBoundingClientRect();

			if (
				window.pageYOffset > decoratorRect.top ||
				window.pageYOffset + document.clientHeight < decoratorRect.top
			) {
				window.scrollTo({
					left: 0,
					top: Math.floor(decoratorRect.top + window.pageYOffset - 200, 0),
					behavior: 'auto',
				});
			}
		}
	}, [isCurrentResult]);

	return (
		<span
			ref={decoratorRef}
			style={{ backgroundColor: isCurrentResult ? '#FFA500' : '#FFFF00' }}>
			{children}
		</span>
	);
};

export { FindReplaceDecorator };
