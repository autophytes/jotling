import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { EditorBlock } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

const MIN_WIDTH = 50;
const MIN_HEIGHT = 50;

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
	// const { editorMaxWidth } = useContext(SettingsContext).editorSettings;
	const { project, mediaStructure, setMediaStructure } = useContext(LeftNavContext);

	// STATE
	const [imageUrl, setImageUrl] = useState(null);
	const [imageId, setImageId] = useState(null);
	const [imageUseId, setImageUseId] = useState(null);
	const [displayData, setDisplayData] = useState({});
	const [style, setStyle] = useState({ maxWidth: '100%' });

	// REF
	const imgRef = useRef(null);

	// On load (or decorator change - overwriting parts of links does this), grab the Image IDs
	useEffect(() => {
		let { imageId, imageUseId } = getImageIds(entityKey, contentState, blockKey, start);

		setImageId(imageId);
		setImageUseId(imageUseId);
	}, [entityKey, project]);

	// Load the displayData from our mediaStructure
	useEffect(() => {
		if (imageId && imageUseId) {
			let data = mediaStructure[imageId].uses[imageUseId];

			// // If the width/height doesn't already exist, need to set
			// if (!data.resize.width && !data.resize.height) {
			//   let rootSize = Number(
			//     window
			//       .getComputedStyle(document.querySelector(':root'))
			//       .getPropertyValue('font-size')
			//       .replace('px', '')
			//   );
			//   let initialWidth = editorMaxWidth * rootSize / 4;

			// }
			// let rootSize = Number(
			//   window
			//     .getComputedStyle(document.querySelector(':root'))
			//     .getPropertyValue('font-size')
			//     .replace('px', '')
			// );
			// let initialWidth = editorMaxWidth * rootSize / 4;

			setDisplayData(data);
		}
		// Deliberately not monitor mediaStructure, only do this on load
	}, [imageId, imageUseId]);

	// Synchronize the displayData back to the mediaStructure
	useEffect(() => {
		if (displayData.resize) {
			setMediaStructure((prev) => ({
				...prev,
				[imageId]: {
					...prev[imageId],
					uses: {
						...prev[imageId].uses,
						[imageUseId]: {
							...displayData,
						},
					},
				},
			}));
		}
	}, [displayData, imageId, imageUseId]);

	// Setting the image URL
	useEffect(() => {
		console.log('URL: ', 'file://' + project.tempPath + `/media/media${imageId}.jpeg`);
		setImageUrl('file://' + project.tempPath + `/media/media${imageId}.jpeg`);
	}, [imageId, project]);

	// Set image styles
	useEffect(() => {
		let newStyle = {
			maxWidth: '100%',
			padding: '2px',
		};
		if (displayData.resize && displayData.resize.width) {
			newStyle.width = displayData.resize.width.toString() + 'px';
		}
		if (displayData.resize && displayData.resize.height) {
			newStyle.height = displayData.resize.height.toString() + 'px';
		}

		setStyle(newStyle);
	}, [displayData]);

	// RESIZE LEFT
	const handleResizeLeftMouseDown = (e) => {
		const initialX = e.clientX;
		const startWidth = imgRef.current.getBoundingClientRect().width;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeLeftMouseMove = (e) => {
			if (e.clientX !== 0) {
				// const tempWidth = displayData.resize.width - (e.clientX - mouseX);
				const newWidth = Math.max(MIN_WIDTH, startWidth - (e.clientX - initialX));

				// const newX =
				// 	tempWidth > minWidth
				// 		? containerLeft + (e.clientX - mouseX)
				// 		: containerLeft + (startWidth - minWidth);

				// imgRef.current.style.left = newX + 'px';
				imgRef.current.style.width = newWidth + 'px';
				imgRef.current.style.height = 'auto';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeLeftMouseUp = (e) => {
			// setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeLeftMouseMove);
			window.removeEventListener('mouseup', handleResizeLeftMouseUp);

			// const tempWidth = containerWidth - (e.clientX - mouseX);
			const newWidth = Math.max(MIN_WIDTH, startWidth - (e.clientX - initialX));

			// const newX = tempWidth > minWidth ? containerLeft + (e.clientX - mouseX) : containerLeft;

			// setContainerWidth(newWidth);j
			setDisplayData((prev) => ({
				...prev,
				resize: {
					...prev.resize,
					width: newWidth,
					height: null,
				},
			}));
		};

		window.addEventListener('mousemove', handleResizeLeftMouseMove);
		window.addEventListener('mouseup', handleResizeLeftMouseUp);
	};

	// RESIZE RIGHT
	const handleResizeRightMouseDown = (e) => {
		const initialX = e.clientX;
		const startWidth = imgRef.current.getBoundingClientRect().width;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeRightMouseMove = (e) => {
			if (e.clientX !== 0) {
				const newWidth = Math.max(MIN_WIDTH, startWidth + (e.clientX - initialX));

				imgRef.current.style.width = newWidth + 'px';
				imgRef.current.style.height = 'auto';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeRightMouseUp = (e) => {
			// setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeRightMouseMove);
			window.removeEventListener('mouseup', handleResizeRightMouseUp);

			const newWidth = Math.max(MIN_WIDTH, startWidth + (e.clientX - initialX));

			// setContainerWidth(newWidth);
			setDisplayData((prev) => ({
				...prev,
				resize: {
					...prev.resize,
					width: newWidth,
					height: null,
				},
			}));
		};

		window.addEventListener('mousemove', handleResizeRightMouseMove);
		window.addEventListener('mouseup', handleResizeRightMouseUp);
	};

	// RESIZE BOTTOM
	const handleResizeBottomMouseDown = (e) => {
		const initialY = e.clientY;
		const startHeight = imgRef.current.getBoundingClientRect().height;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeBottomMouseMove = (e) => {
			if (e.clientY !== 0) {
				const newHeight = Math.max(MIN_HEIGHT, startHeight + (e.clientY - initialY));

				imgRef.current.style.height = newHeight + 'px';
				imgRef.current.style.width = 'auto';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeBottomMouseUp = (e) => {
			window.removeEventListener('mousemove', handleResizeBottomMouseMove);
			window.removeEventListener('mouseup', handleResizeBottomMouseUp);

			const newHeight = Math.max(MIN_HEIGHT, startHeight + (e.clientY - initialY));

			// setContainerHeight(newHeight);
			setDisplayData((prev) => ({
				...prev,
				resize: {
					...prev.resize,
					height: newHeight,
					width: null,
				},
			}));
		};

		window.addEventListener('mousemove', handleResizeBottomMouseMove);
		window.addEventListener('mouseup', handleResizeBottomMouseUp);
	};

	return (
		!!imageUrl && (
			<div className='decorator-image-wrapper'>
				<img ref={imgRef} className='decorator-image' src={imageUrl} style={style} />
				<div className='peek-window-resize left' onMouseDown={handleResizeLeftMouseDown} />
				<div className='peek-window-resize right' onMouseDown={handleResizeRightMouseDown} />
				<div className='peek-window-resize bottom' onMouseDown={handleResizeBottomMouseDown} />
				<div
					className='peek-window-resize bottom-left'
					onMouseDown={(e) => {
						handleResizeLeftMouseDown(e);
						handleResizeBottomMouseDown(e);
					}}
				/>
				<div
					className='peek-window-resize bottom-right'
					onMouseDown={(e) => {
						handleResizeRightMouseDown(e);
						handleResizeBottomMouseDown(e);
					}}
				/>
			</div>
		)
	);

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
