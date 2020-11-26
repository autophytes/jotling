import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { EditorState, Modifier, SelectionState } from 'draft-js';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

import { ImageIcon } from '../../../assets/svg/ImageIcon.js';

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
	const { editorMaxWidth, editorPadding } = useContext(SettingsContext).editorSettings;
	const {
		editorStateRef,
		setEditorStateRef,
		project,
		mediaStructure,
		setMediaStructure,
		editorStyles,
	} = useContext(LeftNavContext);

	// STATE
	const [imageUrl, setImageUrl] = useState(null);
	const [imageId, setImageId] = useState(null);
	const [imageUseId, setImageUseId] = useState(null);
	const [displayData, setDisplayData] = useState({});
	const [style, setStyle] = useState({ maxWidth: '100%' });
	const [pageWidth, setPageWidth] = useState(null);
	const [repositionX, setRepositionX] = useState(null);

	// TESTING
	const [disable, setDisable] = useState(false);

	// REF
	const imgRef = useRef(null);

	// On load (or decorator change - overwriting parts of links does this), grab the Image IDs
	useEffect(() => {
		let { imageId, imageUseId } = getImageIds(entityKey, contentState, blockKey, start);

		setImageId(imageId);
		setImageUseId(imageUseId);
	}, [entityKey, project]);

	// Calculate the page width
	useEffect(() => {
		const rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);
		const pageWidth = (editorMaxWidth - editorPadding * 2) * rootSize;

		setPageWidth(pageWidth);
	}, [editorMaxWidth, editorPadding]);

	// Load the displayData from our mediaStructure
	useEffect(() => {
		if (imageId && imageUseId) {
			let data = mediaStructure[imageId].uses[imageUseId];

			setDisplayData(data);
		}
		// Deliberately not monitor mediaStructure, only do this on load
	}, [imageId, imageUseId]);

	// If repositioning the image, update the mediaStructure and move the image
	useEffect(() => {
		if (imageId === null || imageUseId === null) {
			return;
		}

		const reposition = mediaStructure[imageId].uses[imageUseId].reposition;
		console.log('reposition:', reposition);

		if (reposition && reposition.destBlockKey && reposition.destOffset && repositionX) {
			console.log('repositionX:', repositionX);
			console.log('reposition.destOffset:', reposition.destOffset);
			console.log('reposition.destBlockKey:', reposition.destBlockKey);
			console.log('should call the handleDrop function');

			// *** Update float left/right
			const docWidth = document.body.clientWidth;
			const { leftNav, leftIsPinned, rightNav, rightIsPinned } = editorStyles;
			const rootSize = Number(
				window
					.getComputedStyle(document.querySelector(':root'))
					.getPropertyValue('font-size')
					.replace('px', '')
			);

			let left = leftIsPinned ? leftNav * rootSize : 0;
			let right = rightIsPinned ? docWidth - rightNav * rootSize : docWidth;
			let center = (left + right) / 2;

			let floatDirection = repositionX < center ? 'left' : 'right';
			const newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
			delete newMediaStructure[imageId].uses[imageUseId].reposition;
			newMediaStructure[imageId].uses[imageUseId].float = floatDirection;
			setMediaStructure(newMediaStructure);
			setDisplayData((prev) => ({
				...prev,
				float: floatDirection,
			}));
			// if (repositionX < center) {
			//   floatDirection = 'left'
			// 	console.log('congrats! float left');
			// } else {
			//   floatDirection = right
			// 	console.log('bummer, still floating right');
			// }

			// *** Move the image ***
			const contentState = editorStateRef.current.getCurrentContent();
			const origBlock = contentState.getBlockForKey(blockKey);
			const entityKey = origBlock.getEntityAt(start);

			// Select the original image location
			const newSelectionState = SelectionState.createEmpty();
			const removeSelectionState = newSelectionState.merge({
				anchorKey: blockKey, // Starting position
				anchorOffset: start, // How much to adjust from the starting position
				focusKey: blockKey, // Ending position
				focusOffset: start + 1, // How much to adjust from the ending position.
			});

			// Remove the original image
			const contentStateBeforeInsert = Modifier.removeRange(
				contentState,
				removeSelectionState,
				'forward'
			);

			const insertSelectionState = newSelectionState.merge({
				anchorKey: reposition.destBlockKey, // Starting position
				anchorOffset: reposition.destOffset, // How much to adjust from the starting position
				focusKey: reposition.destBlockKey, // Ending position
				focusOffset: reposition.destOffset, // How much to adjust from the ending position.
			});

			// Insert the repositioned image entity
			const contentStateWithImage = Modifier.insertText(
				contentStateBeforeInsert,
				insertSelectionState,
				' ',
				undefined,
				entityKey
			);

			const newEditorState = EditorState.push(
				editorStateRef.current,
				contentStateWithImage,
				'apply-entity'
			);

			setRepositionX(null);
			setEditorStateRef.current(newEditorState);
		}
	}, [repositionX, blockKey, start, mediaStructure]);

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
		setImageUrl('file://' + project.tempPath + `/media/media${imageId}.jpeg`);
	}, [imageId, project]);

	// Set image styles
	useEffect(() => {
		let newStyle = {
			maxWidth: '100%',
			padding: '2px',
			display: 'block',
		};

		if (displayData.resize && displayData.resize.width) {
			newStyle.width = displayData.resize.width.toString() + 'px';
		} else if (displayData.resize && displayData.resize.height) {
			newStyle.height = displayData.resize.height.toString() + 'px';
		} else {
			newStyle.width = Math.ceil(pageWidth * 0.5) + 'px';
		}

		if (disable) {
			newStyle.display = 'none';
		}

		setStyle(newStyle);
	}, [displayData, pageWidth, disable]);

	// RESIZE HORIZONTAL
	const handleResizeHorizontalMouseDown = (e) => {
		e.preventDefault();
		e.stopPropagation();
		const initialX = e.clientX;
		const startWidth = imgRef.current.getBoundingClientRect().width;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeHorizontalMouseMove = (e) => {
			if (e.clientX !== 0) {
				const newWidth = Math.max(MIN_WIDTH, startWidth - (e.clientX - initialX));

				imgRef.current.style.width = newWidth + 'px';
				imgRef.current.style.height = 'auto';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeHorizontalMouseUp = (e) => {
			window.removeEventListener('mousemove', handleResizeHorizontalMouseMove);
			window.removeEventListener('mouseup', handleResizeHorizontalMouseUp);

			const newWidth = Math.max(MIN_WIDTH, startWidth - (e.clientX - initialX));

			setDisplayData((prev) => ({
				...prev,
				resize: {
					...prev.resize,
					width: newWidth,
					height: null,
				},
			}));
		};

		window.addEventListener('mousemove', handleResizeHorizontalMouseMove);
		window.addEventListener('mouseup', handleResizeHorizontalMouseUp);
	};

	// RESIZE VERTICAL
	const handleResizeVerticalMouseDown = (e) => {
		e.preventDefault();
		// e.stopPropagation();

		const initialY = e.clientY;
		const startHeight = imgRef.current.getBoundingClientRect().height;

		// Calculate max height
		const fullHeight = imgRef.current.naturalHeight;
		const fullWidth = imgRef.current.naturalWidth;
		const aspectRatio = fullWidth / fullHeight;
		const maxHeight = (pageWidth - 8) / aspectRatio; // Remove the 8px image margin

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeVerticalMouseMove = (e) => {
			if (e.clientY !== 0) {
				const newHeight = Math.min(
					Math.max(MIN_HEIGHT, startHeight + (e.clientY - initialY)),
					maxHeight
				);

				imgRef.current.style.height = newHeight + 'px';
				imgRef.current.style.width = 'auto';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeVerticalMouseUp = (e) => {
			window.removeEventListener('mousemove', handleResizeVerticalMouseMove);
			window.removeEventListener('mouseup', handleResizeVerticalMouseUp);

			const newHeight = Math.min(
				Math.max(MIN_HEIGHT, startHeight + (e.clientY - initialY)),
				maxHeight
			);

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

		window.addEventListener('mousemove', handleResizeVerticalMouseMove);
		window.addEventListener('mouseup', handleResizeVerticalMouseUp);
	};

	const handleDragStart = (e) => {
		// Set the drop type (not sure if working - logging the dataTransfer still seems empty)
		e.dataTransfer.dropEffect = 'move';

		// Store the data for the image to move
		e.dataTransfer.setData('image-id', imageId);
		e.dataTransfer.setData('image-use-id', imageUseId);

		// const originalX = e.clientX;
		// const docWidth = document.body.clientWidth;
		// console.log('docWidth:', docWidth);
		// const { leftNav, leftIsPinned, rightNav, rightIsPinned } = editorStyles;
		// console.log('editorStyles:', editorStyles);
		// const rootSize = Number(
		// 	window
		// 		.getComputedStyle(document.querySelector(':root'))
		// 		.getPropertyValue('font-size')
		// 		.replace('px', '')
		// );

		// let left = leftIsPinned ? leftNav * rootSize : 0;
		// console.log('left:', left);
		// let right = rightIsPinned ? docWidth - rightNav * rootSize : docWidth;
		// console.log('right:', right);
		// let center = (left + right) / 2;
		// console.log('center:', center);

		// const calculateImageRepositionFloat = (e) => {
		// 	console.log('mouseup event: ', e);

		// 	let validDrop = false;
		// 	for (let element of e.path) {
		// 		console.log('classList: ', element.classList);
		// 		if (element.classList.contains('DraftEditor-root')) {
		// 			validDrop = true;
		// 			break;
		// 		}
		// 	}

		// 	if (validDrop) {
		// 		// do the drop stuff
		// 		console.log('valid drop!');
		// 		if (originalX + e.offsetX < center) {
		// 			console.log('congrats! float left');
		// 		} else {
		// 			console.log('bummer, still floating right');
		// 		}
		// 	}

		// 	// Remove the current event listner.
		// 	document.removeEventListener('mouseup', calculateImageRepositionFloat);
		// };

		// document.addEventListener('mouseup', calculateImageRepositionFloat);

		// Event listener for mouse up
		// Only fire once
		// Check if inside the editor container
		// If so, use the imageId and imageUseId to update it's float position in the media structure
		//

		// Set the ghost image
		// const base64Icon = btoa(ImageIcon);
		// let img = new Image();
		// img.src = base64Icon;
		// e.dataTransfer.setDragImage(createImageSVGElement(), 12, 12);

		setDisable(true);
	};

	return (
		!!imageUrl && (
			<div
				className='decorator-image-wrapper'
				style={displayData.float ? { float: displayData.float } : {}}>
				<img
					ref={imgRef}
					className='decorator-image'
					src={imageUrl}
					style={style}
					onDragStart={handleDragStart}
					onDragEnd={(e) => {
						for (let element of e.nativeEvent.path) {
							if (element.classList.contains('DraftEditor-root')) {
								setRepositionX(e.clientX);
								break;
							}
						}
						setDisable(false);
					}}
				/>
				<div
					className='peek-window-resize left'
					onMouseDown={handleResizeHorizontalMouseDown}
				/>
				<div
					className='peek-window-resize right'
					onMouseDown={handleResizeHorizontalMouseDown}
				/>
				<div
					className='peek-window-resize bottom'
					onMouseDown={handleResizeVerticalMouseDown}
				/>
				<div
					className='peek-window-resize bottom-left'
					onMouseDown={(e) => {
						handleResizeHorizontalMouseDown(e);
						handleResizeVerticalMouseDown(e);
					}}
				/>
				<div
					className='peek-window-resize bottom-right'
					onMouseDown={(e) => {
						handleResizeHorizontalMouseDown(e);
						handleResizeVerticalMouseDown(e);
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

// Has draft store the repositioned media location data
const handleDraftImageDrop = (
	selection,
	dataTransfer,
	isInternal,
	mediaStructure,
	setMediaStructure
) => {
	const destOffset = selection.getStartOffset();
	const destBlockKey = selection.getStartKey();

	const imageId = dataTransfer.data.getData('image-id');
	const imageUseId = dataTransfer.data.getData('image-use-id');

	const newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
	newMediaStructure[imageId].uses[imageUseId].reposition = {
		destOffset,
		destBlockKey,
	};

	setMediaStructure(newMediaStructure);
};

// const createImageSVGElement = () => {
// 	let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
// 	svg.setAttribute('viewBox', '0 0 24 24');
// 	svg.setAttribute('enable-background', 'new 0 0 24 24');
// 	svg.setAttribute('width', '24');
// 	svg.setAttribute('height', '24');

// 	let path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
// 	path1.setAttribute(
// 		'd',
// 		'm6.25 19.5c-1.601 0-3.025-1.025-3.542-2.551l-.035-.115c-.122-.404-.173-.744-.173-1.084v-6.818l-2.426 8.098c-.312 1.191.399 2.426 1.592 2.755l15.463 4.141c.193.05.386.074.576.074.996 0 1.906-.661 2.161-1.635l.901-2.865z'
// 	);
// 	let path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
// 	path2.setAttribute('d', 'm9 9c1.103 0 2-.897 2-2s-.897-2-2-2-2 .897-2 2 .897 2 2 2z');
// 	let path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
// 	path3.setAttribute(
// 		'd',
// 		'm21.5 2h-15c-1.378 0-2.5 1.122-2.5 2.5v11c0 1.378 1.122 2.5 2.5 2.5h15c1.378 0 2.5-1.122 2.5-2.5v-11c0-1.378-1.122-2.5-2.5-2.5zm-15 2h15c.276 0 .5.224.5.5v7.099l-3.159-3.686c-.335-.393-.82-.603-1.341-.615-.518.003-1.004.233-1.336.631l-3.714 4.458-1.21-1.207c-.684-.684-1.797-.684-2.48 0l-2.76 2.759v-9.439c0-.276.224-.5.5-.5z'
// 	);

// 	svg.appendChild(path1);
// 	svg.appendChild(path2);
// 	svg.appendChild(path3);

// 	return svg;
// };

export { ImageDecorator, handleDraftImageDrop };
