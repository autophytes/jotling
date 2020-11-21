import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { EditorBlock } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';

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

// Get the entity key from the block at "start"
// Add {blockKey, start, end} to an array
// From our starting block (decorator block), if end is length, check next block
// If contains entity, add to the END of the array and check the next block. Repeat.
// From starting block, if start is 0, check the block before to see if it has that key
// If so, add {blockKey, start, end} to the START of the array as well

// SOURCE LINK
const ImageDecorator = ({
	children,
	blockKey,
	entityKey,
	contentState,
	start,
	end,
	decoratedText,
	childDecorator = {},
}) => {
	// CONTEXT
	const { project } = useContext(LeftNavContext);

	// STATE
	const [linkId, setLinkId] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [imageId, setImageId] = useState(null);
	const [imageUseId, setImageUseId] = useState(null);
	const [prevDecoratedText, setPrevDecoratedText] = useState(decoratedText);
	const [queuedTimeout, setQueuedTimeout] = useState(null);
	const [tagName, setTagName] = useState('');
	const [showActive, setShowActive] = useState(false);

	// CHILD DECORATOR
	// let {
	// 	currentIndex,
	// 	getNextComponentIndex,
	// 	getComponentForIndex,
	// 	getComponentProps,
	// } = childDecorator;
	// const [componentIndex, setComponentIndex] = useState(-1);
	// useEffect(() => {
	// 	if (getNextComponentIndex) {
	// 		const newComponentIndex = getNextComponentIndex(currentIndex);
	// 		console.log('newComponentIndex:', newComponentIndex);
	// 		setComponentIndex(newComponentIndex);
	// 	}
	// }, [getNextComponentIndex, currentIndex]);

	// const Component = useMemo(
	// 	() => (componentIndex !== -1 ? getComponentForIndex(componentIndex) : null),
	// 	[componentIndex, getComponentForIndex]
	// );
	// const componentProps = useMemo(
	// 	() => (componentIndex !== -1 ? getComponentProps(componentIndex) : {}),
	// 	[componentIndex, getComponentProps]
	// );

	// On load (or decorator change - overwriting parts of links does this), grab the Image IDs
	useEffect(() => {
		let { imageId, imageUseId } = getImageIds(entityKey, contentState, blockKey, start);

		setImageId(imageId);
		setImageUseId(imageUseId);
	}, [entityKey, project]);

	useEffect(() => {
		console.log('URL: ', 'file://' + project.tempPath + `/media/media${imageId}.jpeg`);
		setImageUrl('file://' + project.tempPath + `/media/media${imageId}.jpeg`);
	}, [imageId, project]);

	// useEffect(() => {
	// 	if (linkId || linkId === 0) {
	// 		console.log('linkStructure: ', linkStructureRef.current.docLinks);
	// 		console.log('currentDoc: ', navData.currentDoc);
	// 		let newTagName = linkStructureRef.current.docLinks[navData.currentDoc][linkId];
	// 		setTagName(newTagName);
	// 	}
	// 	// Deliberately leaving navData.currentDoc out of the variables we're monitoring
	// }, [linkStructureRef, linkId]);

	return !!imageUrl && <img className='decorator-image' src={imageUrl} />;

	// For help in getting local images to render in electron:
	//   https://github.com/electron/electron/issues/23757#issuecomment-640146333
};

// Gets the Image IDs for the entity
const getImageIds = (entityKey, contentState, blockKey, start) => {
	if (entityKey) {
		return contentState.getEntity(entityKey).data;
	}

	const block = contentState.getBlockForKey(blockKey);
	const retrievedEntityKey = block.getEntityAt(start);
	// const { imageId, imageUseId } = contentState.getEntity(retrievedEntityKey).data;
	return contentState.getEntity(retrievedEntityKey).data;
};

export { ImageDecorator };
