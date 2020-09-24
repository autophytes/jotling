import React, { useEffect, useState, useContext, useLayoutEffect, useRef } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { generatePeekDecorator } from './PeekDocumentDecorators';
import { findTitleForGivenDocFileName } from '../../../utils/utils';

import CloseSVG from '../../../assets/svg/CloseSVG';

import { Editor, EditorState } from 'draft-js';

const minWidth = 300;

const PeekWindow = () => {
	// STATE
	const [documentName, setDocumentName] = useState('');
	const [documentTitle, setDocumentTitle] = useState('');
	const [editorState, setEditorState] = useState(EditorState.createEmpty());
	const [containerTop, setContainerTop] = useState(200);
	const [containerLeft, setContainerLeft] = useState(200);
	const [containerWidth, setContainerWidth] = useState(0);
	const [containerHeight, setContainerHeight] = useState(0);
	const [hasScrolled, setHasScrolled] = useState(false);

	// REFS
	const peekWindowContentRef = useRef(null);
	const peekWindowRef = useRef(null);

	// CONTEXT
	const {
		editorArchives,
		linkStructureRef,
		peekWindowLinkId,
		setPeekWindowLinkId,
		navData,
		setNavData,
		setScrollToLinkId,
		scrollToLinkIdRef,
		docStructure,
	} = useContext(LeftNavContext);

	// REPOSITION
	const handleRepositionMouseDown = (e) => {
		const mouseX = e.clientX;
		const mouseY = e.clientY;

		const maxX = window.innerWidth - 200;
		const minX = -(containerWidth - 100);
		const maxY = window.innerHeight;

		let rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleRepositionMouseMove = (e) => {
			if (e.clientX !== 0) {
				const newX = Math.min(maxX, Math.max(minX, containerLeft + (e.clientX - mouseX)));
				const newY = Math.min(
					maxY,
					Math.max(containerTop + (e.clientY - mouseY), 1.25 * rootSize)
				);

				peekWindowRef.current.style.top = newY + 'px';
				peekWindowRef.current.style.left = newX + 'px';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleRepositionMouseUp = (e) => {
			console.log('REPOSITION MOUSEUP EVENT FIRED');

			window.removeEventListener('mousemove', handleRepositionMouseMove);
			window.removeEventListener('mouseup', handleRepositionMouseUp);

			const newX = Math.min(maxX, Math.max(minX, containerLeft + (e.clientX - mouseX)));
			const newY = Math.max(containerTop + (e.clientY - mouseY), 1.25 * rootSize);

			setContainerTop(newY);
			setContainerLeft(newX);
		};

		window.addEventListener('mousemove', handleRepositionMouseMove);
		window.addEventListener('mouseup', handleRepositionMouseUp);
	};

	// RESIZE LEFT
	const handleResizeLeftMouseDown = (e) => {
		const mouseX = e.clientX;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeLeftMouseMove = (e) => {
			if (e.clientX !== 0) {
				const newX = containerLeft + (e.clientX - mouseX);
				const newWidth = Math.max(minWidth, containerWidth - (e.clientX - mouseX));

				peekWindowRef.current.style.left = newX + 'px';
				peekWindowRef.current.style.width = newWidth + 'px';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeLeftMouseUp = (e) => {
			// setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeLeftMouseMove);
			window.removeEventListener('mouseup', handleResizeLeftMouseUp);

			const newX = containerLeft + (e.clientX - mouseX);
			const newWidth = Math.max(minWidth, containerWidth - (e.clientX - mouseX));

			setContainerLeft(newX);
			setContainerWidth(newWidth);
		};

		window.addEventListener('mousemove', handleResizeLeftMouseMove);
		window.addEventListener('mouseup', handleResizeLeftMouseUp);
	};

	// RESIZE RIGHT
	const handleResizeRightMouseDown = (e) => {
		const mouseX = e.clientX;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeRightMouseMove = (e) => {
			if (e.clientX !== 0) {
				const newWidth = Math.max(minWidth, containerWidth + (e.clientX - mouseX));

				peekWindowRef.current.style.width = newWidth + 'px';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeRightMouseUp = (e) => {
			// setIsResizing(false);
			window.removeEventListener('mousemove', handleResizeRightMouseMove);
			window.removeEventListener('mouseup', handleResizeRightMouseUp);

			const newWidth = Math.max(minWidth, containerWidth + (e.clientX - mouseX));

			setContainerWidth(newWidth);
		};

		window.addEventListener('mousemove', handleResizeRightMouseMove);
		window.addEventListener('mouseup', handleResizeRightMouseUp);
	};

	// RESIZE BOTTOM
	const handleResizeBottomMouseDown = (e) => {
		const mouseY = e.clientY;

		// When the mouse moves, update the width to reflext the mouse's X coordinate
		const handleResizeBottomMouseMove = (e) => {
			if (e.clientY !== 0) {
				const newHeight = containerHeight + (e.clientY - mouseY);

				peekWindowRef.current.style.height = newHeight + 'px';
			}
		};

		// When finshed resizing, set the width in REMs so it responds to root size changes
		const handleResizeBottomMouseUp = (e) => {
			window.removeEventListener('mousemove', handleResizeBottomMouseMove);
			window.removeEventListener('mouseup', handleResizeBottomMouseUp);

			const newHeight = containerHeight + (e.clientY - mouseY);

			setContainerHeight(newHeight);
		};

		window.addEventListener('mousemove', handleResizeBottomMouseMove);
		window.addEventListener('mouseup', handleResizeBottomMouseUp);
	};

	// Close on ESCAPE
	useEffect(() => {
		const closeEventListener = (e) => {
			if (e.keyCode === 27) {
				// Clear our peek link ID
				// e.stopImmediatePropagation();
				setScrollToLinkId(peekWindowLinkId);
				scrollToLinkIdRef.current = peekWindowLinkId;
				setPeekWindowLinkId(null);
			}
		};
		document.addEventListener('keyup', closeEventListener);

		return () => document.removeEventListener('keyup', closeEventListener);
	}, []);

	// Setting the document name
	useEffect(() => {
		setDocumentName(linkStructureRef.current.links[peekWindowLinkId].source);
	}, [peekWindowLinkId, linkStructureRef]);

	// Retrieve the document title
	useEffect(() => {
		const docCategories = ['draft', 'research', 'pages'];

		for (let category of docCategories) {
			let potentialTitle = findTitleForGivenDocFileName(docStructure[category], documentName);
			if (potentialTitle) {
				setDocumentTitle(potentialTitle);
				return;
			}
		}

		setDocumentTitle('');
	}, [documentName, docStructure]);

	// Generate our editorState to view in the peek window
	useEffect(() => {
		if (documentName && editorArchives[documentName]) {
			console.log(editorArchives[documentName]);

			const sourceEntityKey = linkStructureRef.current.links[peekWindowLinkId].sourceEntityKey;
			const decorator = generatePeekDecorator(sourceEntityKey);

			let newEditorState = EditorState.createWithContent(
				editorArchives[documentName].editorState.getCurrentContent(),
				decorator
			);
			setEditorState(newEditorState);
		}
	}, [documentName, editorArchives, peekWindowLinkId]);

	useEffect(() => {
		const rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);

		const windowHeight = window.innerHeight;
		const windowWidth = window.innerWidth;

		const defaultHeight = Math.min(500, windowHeight - 2.5 * rootSize - 1.25 * rootSize);
		const defaultWidth = Math.min(450, (windowWidth - 100) / 2);

		console.log('2.5 * rootSize: ', 2.5 * rootSize);

		const defaultTop =
			windowHeight / 2 - defaultHeight / 2 + (1.25 * rootSize) / 2 + (2.5 * rootSize) / 2;
		const defaultLeft = windowWidth - defaultWidth - 50;

		setContainerTop(defaultTop);
		setContainerLeft(defaultLeft);
		setContainerWidth(defaultWidth);
		setContainerHeight(defaultHeight);
	}, []);

	// Scroll to our matching link
	useLayoutEffect(() => {
		const firstPeekHighlightElement = document.querySelector(
			'.peek-window-highlight-decorator'
		);
		if (!hasScrolled && firstPeekHighlightElement) {
			const highlightRect = firstPeekHighlightElement.getBoundingClientRect();

			const windowRect = peekWindowContentRef.current.getBoundingClientRect();

			peekWindowContentRef.current.scrollTo({
				top: highlightRect.top - windowRect.top - 100,
				behavior: 'smooth',
			});
			setHasScrolled(true);
		}
	}, [editorState, hasScrolled]);

	return (
		<>
			<div
				className='peek-window'
				ref={peekWindowRef}
				style={{
					top: `${containerTop}px`,
					left: `${containerLeft}px`,
					width: `${containerWidth}px`,
					height: `${containerHeight}px`,
					opacity: containerWidth ? 1 : 0,
				}}>
				<div className='peek-window-top-handle' onMouseDown={handleRepositionMouseDown}>
					<button
						className='peek-window-open'
						onClick={() => {
							setNavData({ ...navData, currentDoc: documentName });
							setScrollToLinkId(peekWindowLinkId);
							scrollToLinkIdRef.current = peekWindowLinkId;
							setPeekWindowLinkId(null);
						}}>
						Open Document
					</button>
					<p className='peek-window-title'>{documentTitle ? documentTitle : documentName}</p>
					<button className='peek-window-close' onClick={() => setPeekWindowLinkId(null)}>
						<CloseSVG />
					</button>
				</div>
				<div className='peek-window-contents' ref={peekWindowContentRef}>
					<Editor editorState={editorState} readOnly />
					<div className='peek-window-resize left' onMouseDown={handleResizeLeftMouseDown} />
					<div className='peek-window-resize right' onMouseDown={handleResizeRightMouseDown} />
					<div
						className='peek-window-resize bottom'
						onMouseDown={handleResizeBottomMouseDown}
					/>
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
			</div>
		</>
	);
};

export default PeekWindow;
