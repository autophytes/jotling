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
		setEditorState,
		project,
		mediaStructure,
		setMediaStructure,
	} = useContext(LeftNavContext);

	// STATE
	const [imageUrl, setImageUrl] = useState(null);
	const [imageId, setImageId] = useState(null);
	const [imageUseId, setImageUseId] = useState(null);
	const [displayData, setDisplayData] = useState({});
	const [style, setStyle] = useState({ maxWidth: '100%' });
	const [pageWidth, setPageWidth] = useState(null);

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
		e.dataTransfer.setData('image-block-key', blockKey);
		e.dataTransfer.setData('image-start-offset', start);

		// Set the ghost image
		// const base64Icon = btoa(ImageIcon);
		// let img = new Image();
		// img.src = base64Icon;
		// e.dataTransfer.setDragImage(img, 10, 10);

		setDisable(true);
	};

	return (
		!!imageUrl && (
			<div className='decorator-image-wrapper'>
				<img
					ref={imgRef}
					className='decorator-image'
					src={imageUrl}
					style={style}
					onDragStart={handleDragStart}
					onDragEnd={() => setDisable(false)}
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

// Handle the moved image (eventually probably hook other moves into this too)
// Plugged into the Editor component, wrapped to provide editorState and setter.
const handleDrop = (selection, dataTransfer, isInternal, editorStateRef, setEditorState) => {
	console.log('selection: ', selection);
	console.log('dataTransfer: ', dataTransfer);
	console.log('isInternal: ', isInternal);

	const imageBlockKey = dataTransfer.data.getData('image-block-key');
	const imageStartOffset = dataTransfer.data.getData('image-start-offset');
	if (!imageBlockKey) {
		console.log('returning without doing anything');
		return;
	}

	const contentState = editorStateRef.current.getCurrentContent();
	const origBlock = contentState.getBlockForKey(imageBlockKey);
	console.log('origBlock:', origBlock);
	const entityKey = origBlock.getEntityAt(imageStartOffset);
	console.log('entityKey:', entityKey);

	const newSelectionState = SelectionState.createEmpty();
	const removeSelectionState = newSelectionState.merge({
		anchorKey: imageBlockKey, // Starting position
		anchorOffset: Number(imageStartOffset), // How much to adjust from the starting position
		focusKey: imageBlockKey, // Ending position
		focusOffset: Number(imageStartOffset) + 1, // How much to adjust from the ending position.
	});
	console.log('removeSelectionState:', removeSelectionState);

	const contentStateBeforeInsert = Modifier.removeRange(
		contentState,
		removeSelectionState,
		'forward'
	);

	// Insert the character with the image entity at the end of the block
	const contentStateWithImage = Modifier.insertText(
		contentStateBeforeInsert,
		selection,
		' ',
		undefined,
		entityKey
	);

	const newEditorState = EditorState.push(
		editorStateRef.current,
		contentStateWithImage,
		'apply-entity'
	);
	console.log('newEditorState:', newEditorState);
	setEditorState(newEditorState);
	console.log('setEditorState:', setEditorState);

	// Ensure a valid move
	// Get the old entity key
	// Remove the space with the old entity in it
	// Insert a space between words(?) with the new image metadata
	// Can we determine if it's in the left/right half? If so, set the float left/right metadata
	// We'll need to pull handlers for this in from somewhere - where does the plugin do it?

	// Only return handled if we don't want Draft to continue processing
	return 'handled';
};

export { ImageDecorator, handleDrop };
